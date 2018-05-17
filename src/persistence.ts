///<reference path="../node_modules/@types/gapi.youtube/index.d.ts"/>
import * as _ from 'underscore';
import {Disc} from './disc';
import {CuePrinter} from './CuePrinter';
import {HttpClient} from '@angular/common/http';
import {Collection} from './Collection';
import {LocalServerPersistence} from './persistence/LocalServerPersistence';
import {GoogleDrivePersistence} from './persistence/GoogleDrivePersistence';
import {LocalAndDistantPersistence} from './persistence/LocalAndDistantPersistence';
import {LocalStoragePersistence} from './persistence/LocalStoragePersistence';

export abstract class Persistence {

    static DEFAULT_COLLECTION = '_default_';

    constructor(public $http: HttpClient) {
    }

    /**
     * Titre de cette persistance dans les logs
     * @return {string}
     */
    abstract get title(): string;

    /**
     * @return {Promise<boolean>} true si init OK, false sinon
     */
    public init(params: any): Promise<boolean> {
        return Promise.resolve(true);
    }

    public abstract getCollectionNames(): Promise<string[]>;

    /**
     *
     * @param {string[]} collectionsNames
     * @return {Promise<string[]>} ne doit pas ressortir la collection '_default_'
     */
    public abstract setCollectionNames(collectionsNames: string[]): Promise<string[]>;

    public abstract getCollection(collectionName: string): Promise<Collection>;

    public getCollectionByNames(collectionsNames: string[]): Promise<{[key: string]: Collection}> {
        return Promise.all(collectionsNames.map(name => this.getCollection(name))).then(results => {
            // conversion array => map
            return results.reduce((map, collection) => {
                if (collection) {
                    map[collection.name] = collection;
                } else {
                    console.error(`getCollectionByNames("${collectionsNames}") : collection inconnue`);
                }
                return map;
            }, {});
        });
    }

    public abstract postCollection(collection: Collection): Promise<Collection>;

    postCollections(collections: Collection[]): Promise<Collection[]> {
        return Promise.all(collections.map(collection => this.postCollection(collection)));
    }

    public async getCollectionDiscIds(collectionName: string): Promise<string[]> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }
        let collection: Collection = await this.getCollection(collectionName);
        if (!collection) {
            collection = new Collection(collectionName);
            this.postCollection(collection);
        }
        return collection.discIds;
    }

    /**
     * @param {string} collectionName
     * @param {string[]} discIds id des disques présents dans cette collection, annule et remplace les précédents
     * @return {Promise<string[]>}
     */
    public async postCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }
        const collection: Collection = await this.getCollection(collectionName) || new Collection(collectionName);
        collection.discIds = discIds;
        this.postCollection(collection);
        return collection.discIds;
    }

    public async newCollection(collectionName: string): Promise<Collection> {
        const collection = new Collection(collectionName);
        collection.discIds = [];
        return this.postCollection(collection);
    }

    public abstract getDisc(discId: string, discIndex: number): Promise<Disc>;

    public getDiscs(discIds: string[], startingDiscIndex: number): Promise<Disc[]> {
        let discIndex = startingDiscIndex;
        return Promise.all(discIds.map(discId => this.getDisc(discId, startingDiscIndex++)));
    }

    // FIXME : disc devrait être un Disc et Promise une Promise<Disc>
    public abstract postDisc(discId: string, disc): Promise<Disc>;

    public getVideo(videoId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubeVideoResource> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePageInfo<GoogleApiYouTubeVideoResource>>('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails',//'contentDetails', // contentDetails => durée
                    id: videoId,
                    maxResults: '1'
                }
            }).toPromise()
            // conversion success(data) -> then(res) {data = res.data}
            // conversion error(data) -> catch(res) {data = res.data}
                .then(res => {
                    // const data = res.data; // AngularJS
                    const data = res; // Angular5
                    if (!data.items || data.items.length !== 1) { return reject(new Error('Items not found for videoId ' + videoId)); }
                    resolve(data.items[0]);
                }, resKO => {
                    reject(resKO.data);
                });
        });
    }

    /**
     *
     * @param {string} discId
     * @param {number} discIndex
     * @param jsonCuesheet {*} un objet JSON contenant la cuesheet à créér
     * @return {Disc}
     */
    protected createDisc(discId: string, discIndex: number, jsonCuesheet: any): Disc {
        const cue = new cuesheet.CueSheet();
        _.extend(cue, jsonCuesheet);

        const disc = new Disc(cue);
        disc.id = discId;
        disc.index = discIndex;

        return disc;
    }

    public getPlaylistItems(playlistId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubePlaylistItemResource[]> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePaginationInfo<GoogleApiYouTubePlaylistItemResource>>(
                'https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',//'contentDetails',
                    playlistId: playlistId,
                    maxResults: '50' // TODO : YouTube n'autorise pas plus que 50
                }
            }).toPromise()
            // conversion success(data) -> then(res) {data = res.data}
                .then(res => {
                    // const data: any = res.data; // AngularJS
                    const data = res; // Angular5
                    if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage) {
                        return reject(new Error('Too much results (> 50)'));
                    }
                    // resolve(data); // AngularJS
                    resolve(data.items); // Angular5
                }, res => {
                    reject(res.data);
                });
        });
    }

    /**
     * Fusionne la persistence src avec la persistence actuelle. À la fin les deux persistence sont égales.
     * @param {Persistence} src persistence à intégrer dans la courante
     * @return {Promise<boolean>} true si la persistence actuelle a été modifiée suite au sync
     */
    public async sync(src: Persistence): Promise<SyncResult> {

        console.group('Synchro entre deux persistances en cours');
        const syncResult = new SyncResult();

        // Synchro des collections
        return Promise.all([this.getCollectionNames(), src.getCollectionNames()]).then(results => {
            const [thisCollectionNames, srcCollectionNames] = results;

            // Récup des collections des deux côtés (obligé car on veut tous les disques plus tard)
            console.log('Récup de toutes les collections des deux côtés...');
            return Promise.all([
                thisCollectionNames,
                this.getCollectionByNames(thisCollectionNames),
                srcCollectionNames,
                src.getCollectionByNames(srcCollectionNames)
            ]);
        }).then(results => {
            const [thisCollectionNames, thisCollections, srcCollectionNames, srcCollections] = results;

            console.log('Début de la synchro des collections...');

            /** Collections absentes dans this */
            srcCollectionNames.filter(name => !thisCollectionNames.includes(name))
                .map(srcCollectionName => {
                    const srcCollection = srcCollections[srcCollectionName];
                    syncResult.collections.all.push(srcCollection);
                    syncResult.collections.pulled.push(srcCollection);
                    return srcCollection;
                });

            /** Collections absentes dans la source */
            thisCollectionNames.filter(name => !srcCollectionNames.includes(name))
                .map(thisCollectionName => {
                    const thisCollection = thisCollections[thisCollectionName];
                    syncResult.collections.all.push(thisCollection);
                    syncResult.collections.pushed.push(thisCollection);
                    return thisCollection;
                });

            /** Collections en commun */
            thisCollectionNames.filter(name => srcCollectionNames.includes(name))
                .map(collectionName => {
                    const thisCollection = thisCollections[collectionName];
                    const srcCollection = srcCollections[collectionName];
                    return syncCommonCollection(thisCollection, srcCollection, syncResult);
                });

            return results;

        }).then(results => {

            console.log('Récup de toutes les disques communs...');

            // Récup de tous les disques en commun pour comparer
            const discIndex = -1; // TODO intérêt ?
            return Promise.all(syncResult.discIds.all
                .map(discId => Promise.all([
                    this.getDisc(discId, discIndex).catch(e => null), // disc dans this
                    src.getDisc(discId, discIndex).catch(e => null)  // disc dans src
                ])));

        }).then(discPairs => {

            console.log('Début de la synchro des disques...');

            discPairs.map(discPair => {
                const [thisDisc, srcDisc] = discPair;

                // Cas qui ne devrait pas arriver !
                if (!thisDisc && !srcDisc) {
                    console.error("Un disque n'a été trouvé ni dans this ni dans src");
                    return null;
                }

                // Disque absent dans this
                if (!thisDisc) {
                    pushOnlyOnce(syncResult.discs.pulled, srcDisc);
                    pushOnlyOnce(syncResult.discs.all, srcDisc);
                }

                // Disque absent dans src
                if (!srcDisc) {
                    pushOnlyOnce(syncResult.discs.pushed, thisDisc);
                    pushOnlyOnce(syncResult.discs.all, thisDisc);
                }

                // Disque en commun
                if (thisDisc && srcDisc) {
                    pushOnlyOnce(syncResult.discs.common.all, thisDisc);
                    pushOnlyOnce(syncResult.discs.common.all, srcDisc);
                    pushOnlyOnce(syncResult.discs.all, thisDisc);
                    pushOnlyOnce(syncResult.discs.all, srcDisc);

                    // Comparaison de la cuesheet pour diff
                    const thisCueData = CuePrinter.print(thisDisc.cuesheet);
                    const srcCueData = CuePrinter.print(srcDisc.cuesheet);
                    if (thisCueData === srcCueData) {
                        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) inchangé`);
                        pushOnlyOnce(syncResult.discs.common.notModified, thisDisc);
                        pushOnlyOnce(syncResult.discs.common.notModified, srcDisc);
                    } else {
                        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) différent. On prend celui de ${src.title}...`,
                            thisCueData, srcCueData);
                        pushOnlyOnce(syncResult.discs.common.pulled, srcDisc);
                    }

                }
            })

        }).then(results => {

            // Sauvegardes dans les deux persistences
            return Promise.all([

                // Sauvegardes dans this
                Promise.all([
                    // Collections créés dans this
                    syncResult.collections.pulled.map(collection => this.postCollection(collection)),
                    // Collections modifiées dans this
                    syncResult.collections.common.pulled.map(collection => this.postCollection(collection)),
                    // Disques créés dans this
                    syncResult.discs.pulled.map(disc => this.postDisc(disc.id, disc)),
                    // Disques modifiés dans this
                    syncResult.discs.common.pulled.map(disc => this.postDisc(disc.id, disc))
                ]),

                // Sauvegardes dans src
                Promise.all([
                    // Collections créés dans src
                    syncResult.collections.pushed.map(collection => src.postCollection(collection)),
                    // Collections modifiées dans src
                    syncResult.collections.common.pushed.map(collection => src.postCollection(collection)),
                    // Disques créés dans src
                    syncResult.discs.pushed.map(disc => src.postDisc(disc.id, disc)),
                    // Disques modifiés dans src
                    syncResult.discs.common.pushed.map(disc => src.postDisc(disc.id, disc))
                ]),

            ]);

        }).then(results => {

            // TODO : post dans les deux persistences
            return syncResult;

        });
    }
}

export class SyncResult {
    collections = new SyncResultPart<Collection>();
    discIds = new SyncResultPart<string>();
    discs = new SyncResultPart<Disc>();
}

export class SyncResultPart<T> {
    /** tous les objets comparés */
    all: T[] = [];
    /** existaient que dans src */
    pulled: T[] = [];
    /** existaient que dans this */
    pushed: T[] = [];
    /** objets en commun avec une autre source peut être modifiés */
    common: {
        /** tous les objets en commun avec une autre source (modifiés + non modifiés) */
        all: T[];
        /** modifiés dans this */
        pulled: T[];
        /** modifiés dans src */
        pushed: T[];
        /** non modifiés */
        notModified: T[];
    } = {
        all: [],
        pulled: [],
        pushed: [],
        notModified: []
    };
}

function syncCommonCollection(thisCollection: Collection, srcCollection: Collection, syncResult: SyncResult) {

    console.log(`Synchro des collections communes`, thisCollection, srcCollection);

    pushOnlyOnce(syncResult.collections.all, thisCollection);
    pushOnlyOnce(syncResult.collections.all, srcCollection);
    pushOnlyOnce(syncResult.collections.common.all, thisCollection);
    pushOnlyOnce(syncResult.collections.common.all, srcCollection);

    /** Disques absents dans this */
    const pulledDiscIds = srcCollection.discIds.filter(discId => !thisCollection.discIds.includes(discId))
        .map(discId => {
            pushOnlyOnce(syncResult.discIds.all, discId);
            pushOnlyOnce(syncResult.discIds.pulled, discId);
            return discId;
        });
    if (pulledDiscIds.length) {
        syncResult.collections.common.pulled.push(srcCollection);
    }

    /** Disques absents dans la source */
    const pushedDiscIds = thisCollection.discIds.filter(discId => !srcCollection.discIds.includes(discId))
        .map(discId => {
            pushOnlyOnce(syncResult.discIds.all, discId);
            pushOnlyOnce(syncResult.discIds.pushed, discId);
            return discId;
        });
    if (pushedDiscIds.length) {
        pushOnlyOnce(syncResult.collections.common.pushed, thisCollection);
    }

    // Collection non modifiées si aucune diff
    if (!pulledDiscIds.length && !pushedDiscIds.length) {
        pushOnlyOnce(syncResult.collections.common.notModified, thisCollection);
        pushOnlyOnce(syncResult.collections.common.notModified, srcCollection);
    }

    /** Disques en commun */
    const notModifiedDiscIds = thisCollection.discIds.filter(discId => srcCollection.discIds.includes(discId))
        .map(discId => {
            pushOnlyOnce(syncResult.discIds.all, discId);
            pushOnlyOnce(syncResult.discIds.common.all, discId);
            pushOnlyOnce(syncResult.discIds.common.notModified, discId);
            return discId;
        });

    // Modification des collections
    if (pulledDiscIds.length || pushedDiscIds.length) {
        // On ajoute les disques de this à la fin de src
        pushedDiscIds.map(discId => srcCollection.push(discId));
        // On reporte la même collection dans this
        thisCollection.replaceWith(srcCollection);
    }

    return thisCollection;
}

function pushOnlyOnce<T>(array: T[], item: T) {
    if (!array.includes(item)) {
        array.push(item);
    }
}
