import * as _ from 'underscore';
import {Disc} from './disc';
import {CuePrinter} from './CuePrinter';
import {HttpClient} from '@angular/common/http';
import {Collection} from './Collection';
import {md5} from './md5';
import {cloneWithout} from './json-utils';

export abstract class Persistence {

    static DEFAULT_COLLECTION = '_default_';

    private _syncState: SyncState;

    public getSyncState(): Promise<SyncState> {
        return Promise.resolve(this._syncState)
            .then(existingSyncState => {
                if (!existingSyncState) {
                    // Chargement de l'état de synchro si pas encore fait
                    return this.loadSyncState()
                        .catch(e => {
                            console.warn('Impossible de charger le syncState : on le reconstruit...', e);
                            return this.buildSyncState();
                        })
                        .then(loadedSyncState => {
                            // Quelqu'un a peut-être déjà initialisé _syncState ?
                            if (!this._syncState) {
                                this._syncState = loadedSyncState;
                            }
                            return this._syncState;
                        });
                }
                return existingSyncState;
            });
    }

    /**
     * Construit pour la fois 1ère l'état de synchro s'il n'a jamais été calculé
     * @return {Promise<SyncState>}
     */
    private buildSyncState(): Promise<SyncState> {
        // On doit chercher toutes les collections et tous les disques
        return Promise.all([
            this.getAllCollectionsByNames(),
            this.getAllDiscs()
        ])
            .catch(e => {
                console.error('Erreur lors du buildSyncState', e);
                throw e;
            })
            .then(res => {
                const [collectionsByNames, discs] = res;
                const syncState = new SyncState();
                _.each(collectionsByNames, collection => syncState.collections.push(collection));
                _.each(discs, disc => syncState.discs.push(disc));
                return syncState;
            });
    }

    public abstract saveSyncState(): Promise<SyncState>;

    protected constructor(public $http: HttpClient) {
    }

    /**
     * Titre de cette persistance dans les logs
     * @return {string}
     */
    abstract get title(): string;

    /**
     * @return {Promise<boolean>} true si init OK, false sinon
     */
    public init(_params: any): Promise<boolean> {
        return Promise.resolve(true);
    }

    public abstract getCollectionNames(): Promise<string[]>;

    public abstract getDiscIds(): Promise<string[]>;

    /**
     *
     * @param {string[]} collectionsNames
     * @return {Promise<string[]>} ne doit pas ressortir la collection '_default_'
     */
    public abstract setCollectionNames(collectionsNames: string[]): Promise<string[]>;

    /**
     * @param collectionName
     * @return la collection portant ce nom ou une nouvelle si la collection n'existe pas encore
     */
    public abstract getCollection(collectionName: string): Promise<Collection>;

    public getCollectionByNames(collectionsNames: string[]): Promise<{ [key: string]: Collection }> {
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

    public saveCollection(collection: Collection): Promise<Collection> {
        return this.postCollection(collection).then(savedCollection => {
            return this.getSyncState().then(syncState => {
                syncState.collections.push(savedCollection);
                return savedCollection;
            }).then(savedCollection2 => {
                // TODO ajout d'un débrayage en cas de batch save
                console.log('Sauvegarde de l\'état de la synchro...');
                return this.saveSyncState().then(() => {
                    console.log('Sauvegarde de l\'état de la synchro OK');
                    return savedCollection2;
                });
            });
        });
    }

    protected abstract postCollection(collection: Collection): Promise<Collection>;

    public deleteCollection(collectionName: string): Promise<void> {
        return this._deleteCollection(collectionName).then(() => {
            return this.getSyncState().then(syncState => {
                syncState.collections.removeById(collectionName);
            }).then(() => {
                // TODO ajout d'un débrayage en cas de batch save
                console.log('Sauvegarde de l\'état de la synchro...');
                return this.saveSyncState().then(() => {
                    console.log('Sauvegarde de l\'état de la synchro OK');
                });
            });
        });
    }

    protected abstract _deleteCollection(collectionName: string): Promise<void>;

    saveCollections(collections: Collection[]): Promise<Collection[]> {
        return Promise.all(collections.map(collection => this.saveCollection(collection)));
    }

    public async getCollectionDiscIds(collectionName: string): Promise<string[]> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }
        let collection: Collection = await this.getCollection(collectionName);
        if (!collection) {
            collection = new Collection(collectionName);
            await this.saveCollection(collection);
        }
        return collection.discIds;
    }

    /**
     * @param {string} collectionName
     * @param {string[]} discIds id des disques présents dans cette collection, annule et remplace les précédents
     * @return {Promise<string[]>}
     */
    public saveCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {
        if (!collectionName) {
            collectionName = Persistence.DEFAULT_COLLECTION;
        }
        return this.getCollection(collectionName).then(collection => {
            if (!collection) {
                collection = new Collection(collectionName);
            }
            return collection;
        }).then(collection => {
            collection.discIds = discIds;
            return this.saveCollection(collection);
        }).then(collection => collection.discIds);
    }

    public async newCollection(collectionName: string): Promise<Collection> {
        const collection = new Collection(collectionName);
        collection.discIds = [];
        return this.saveCollection(collection);
    }

    public abstract getDisc(discId: string): Promise<Disc>;

    public getDiscs(discIds: string[]): Promise<Disc[]> {
        return Promise.all(discIds.map(discId => this.getDisc(discId)));
    }

    public saveDisc(discId: string, disc: Disc): Promise<Disc> {
        return this.postDisc(discId, disc).then(savedDisc => {
            return this.getSyncState().then(syncState => {
                syncState.discs.push(savedDisc);
                return savedDisc;
            }).then(savedDisc2 => {
                // TODO ajout d'un débrayage en cas de batch save
                console.log('Sauvegarde de l\'état de la synchro...');
                return this.saveSyncState().then(() => {
                    console.log('Sauvegarde de l\'état de la synchro OK');
                    return savedDisc2;
                });
            });
        });
    }

    protected abstract postDisc(discId: string, disc: Disc): Promise<Disc>;

    public getVideo(videoId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubeVideoResource> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePageInfo<GoogleApiYouTubeVideoResource>>('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails', // 'contentDetails', // contentDetails => durée
                    id: videoId,
                    maxResults: '1'
                }
            }).toPromise()
                // conversion success(data) -> then(res) {data = res.data}
                // conversion error(data) -> catch(res) {data = res.data}
                .then(res => {
                    // const data = res.data; // AngularJS
                    const data = res; // Angular5
                    if (!data.items || data.items.length !== 1) {
                        return reject(new Error('Items not found for videoId ' + videoId));
                    }
                    resolve(data.items[0]);
                }, resKO => {
                    reject(resKO.data);
                });
        });
    }

    /**
     * @param jsonCuesheet {*} un objet JSON contenant la cuesheet à créér
     */
    protected createDisc(discId: string, jsonCuesheet: any): Disc {
        const cue = new cuesheet.CueSheet();
        _.extend(cue, jsonCuesheet);

        const disc = new Disc(cue);
        disc.id = discId;
        return disc;
    }

    public getPlaylistItems(playlistId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubePlaylistItemResource[]> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePaginationInfo<GoogleApiYouTubePlaylistItemResource>>(
                'https://www.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        key: GOOGLE_KEY,
                        part: 'snippet', // 'contentDetails',
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
        let thisSyncState: SyncState, srcSyncState: SyncState;

        // Synchro des collections
        return Promise.all([this.getSyncState(), src.getSyncState()])
            .then(syncStates => {
                [thisSyncState, srcSyncState] = syncStates;
                return syncStates;
            })
            .then(() => {
                const thisCollectionNames = _.keys(thisSyncState.collections.elementsById);
                const srcCollectionNames = _.keys(srcSyncState.collections.elementsById);
                return [thisCollectionNames, srcCollectionNames];
            })
            .then(results => {
                const [thisCollectionNames, srcCollectionNames] = results;

                console.log('Début de la synchro des collections...');

                return Promise.all([

                    /** Collections absentes dans this */
                    Promise.all(srcCollectionNames.filter(name => !thisCollectionNames.includes(name))
                        .map(srcCollectionName => {
                            return src.getCollection(srcCollectionName).then(srcCollection => {
                                syncResult.collections.pulled.push(srcCollection);
                                return srcCollection;
                            });
                        })),

                    /** Collections absentes dans la source */
                    Promise.all(thisCollectionNames.filter(name => !srcCollectionNames.includes(name))
                        .map(thisCollectionName => {
                            return this.getCollection(thisCollectionName).then(thisCollection => {
                                syncResult.collections.pushed.push(thisCollection);
                                return thisCollection;
                            });
                        })),

                    /** Collections en commun */
                    Promise.all(thisCollectionNames.filter(name => srcCollectionNames.includes(name))
                        .map(collectionName => {
                            const thisChecksum = thisSyncState.collections.elementsById[collectionName].checksum;
                            const srcChecksum = srcSyncState.collections.elementsById[collectionName].checksum;
                            if (thisChecksum !== srcChecksum) {
                                return Promise.all([this.getCollection(collectionName), src.getCollection(collectionName)])
                                    .then(collections => syncCommonCollection(collections[0], collections[1], syncResult));
                            } else {
                                return Promise.resolve(null);
                            }
                        }))
                ]);

            }).then(() => {
                const thisDiscIds = _.keys(thisSyncState.discs.elementsById);
                const srcDiscIds = _.keys(srcSyncState.discs.elementsById);
                return [thisDiscIds, srcDiscIds];
            }).then(results => {

                const [thisDiscIds, srcDiscIds] = results;

                const discIdsToProcess = {
                    pull: srcDiscIds.filter(id => !thisDiscIds.includes(id)),
                    push: thisDiscIds.filter(id => !srcDiscIds.includes(id)),
                    common: thisDiscIds.filter(id => srcDiscIds.includes(id)),
                };
                console.log('Début de la synchro des disques...', discIdsToProcess);
                return Promise.all([

                    /** Disques absents dans this */
                    Promise.all(discIdsToProcess.pull
                        .map(async id => {
                            const srcDisc = await src.getDisc(id);
                            syncResult.discs.pulled.push(srcDisc);
                            return srcDisc;
                        })),

                    /** Disques absents dans la source */
                    Promise.all(discIdsToProcess.push
                        .map(async id => {
                            const thisDisc = await this.getDisc(id);
                            syncResult.discs.pushed.push(thisDisc);
                            return thisDisc;
                        }))
                        .catch(e => {
                            console.error(`Erreur non bloquante lors de la récupération d'un disque local absent dans la source`, e);
                        }),

                    /** Disques en commun */
                    Promise.all(discIdsToProcess.common
                        .map(async id => {
                            const thisChecksum = thisSyncState.discs.elementsById[id].checksum;
                            const srcChecksum = srcSyncState.discs.elementsById[id].checksum;
                            if (thisChecksum !== srcChecksum) {

                                // On prend le plus récent des deux
                                const thisLastmod = thisSyncState.discs.elementsById[id].lastmod;
                                const srcLastmod = srcSyncState.discs.elementsById[id].lastmod;

                                if (thisLastmod < srcLastmod) {
                                    const disc = await src.getDisc(id);
                                    console.log(`Disque ${disc.id} (${disc.title}) de la source plus récent`);
                                    pushOnlyOnce(syncResult.discs.common.pulled, disc);
                                } else if (thisLastmod > srcLastmod) {
                                    const disc = await this.getDisc(id);
                                    console.log(`Disque ${disc.id} (${disc.title}) plus récent que la source`);
                                    pushOnlyOnce(syncResult.discs.common.pushed, disc);
                                } else {
                                    const [thisDisc, srcDisc] = await Promise.all([this.getDisc(id), src.getDisc(id)]);
                                    syncCommonDisc(thisDisc, srcDisc, syncResult);
                                }

                            } else {
                                return Promise.resolve(null);
                            }
                        }))
                ]);

            }).then(() => {

                // Sauvegardes dans les deux persistences
                return Promise.all([

                    // Sauvegardes dans this

                    // Collections créés dans this
                    Promise.all(syncResult.collections.pulled.map(collection => this.saveCollection(collection))),
                    // Collections modifiées dans this
                    Promise.all(syncResult.collections.common.pulled.map(collection => this.saveCollection(collection))),
                    // Disques créés dans this
                    Promise.all(syncResult.discs.pulled.map(disc => this.saveDisc(disc.id, disc))),
                    // Disques modifiés dans this
                    Promise.all(syncResult.discs.common.pulled.map(disc => this.saveDisc(disc.id, disc))),

                    // Sauvegardes dans src

                    // Collections créés dans src
                    Promise.all(syncResult.collections.pushed.map(collection => src.saveCollection(collection))),
                    // Collections modifiées dans src
                    Promise.all(syncResult.collections.common.pushed.map(collection => src.saveCollection(collection))),
                    // Disques créés dans src
                    Promise.all(syncResult.discs.pushed.map(disc => src.saveDisc(disc.id, disc))),
                    // Disques modifiés dans src
                    Promise.all(syncResult.discs.common.pushed.map(disc => src.saveDisc(disc.id, disc)))

                ]);

            }).then(() => {

                console.log('Sauvegarde de l\'état de synchro dans les deux persistances...');
                return Promise.all([
                    this.saveSyncState(),
                    src.saveSyncState()
                ]);

            }).then(() => {

                // TODO : post dans les deux persistences
                return syncResult;

            });
    }

    /**
     * Charge l'état actuel de cette persistence pour faciliter la synchronisation
     * @throws Error si aucun état actuel
     */
    protected abstract loadSyncState(): Promise<SyncState>;

    public getAllCollectionsByNames(): Promise<{ [key: string]: Collection }> {
        return this.getCollectionNames().then(collectionNames => this.getCollectionByNames(collectionNames));
    }

    public getAllDiscs(): Promise<Disc[]> {
        return this.getDiscIds().then(discIds => this.getDiscs(discIds));
    }
}


export class SyncResult {
    collections = new SyncResultPart<Collection>();
    discs = new SyncResultPart<Disc>();
}

export class SyncResultPart<T> {
    /** existaient que dans src */
    pulled: T[] = [];
    /** existaient que dans this */
    pushed: T[] = [];
    /** objets en commun avec une autre source peut être modifiés */
    common: {
        /** modifiés dans this */
        pulled: T[];
        /** modifiés dans src */
        pushed: T[];
    } = {
        pulled: [],
        pushed: [],
    };
}

export class SyncState {

    readonly discs: SyncStateDiscs = new SyncStateDiscs(this);
    readonly collections: SyncStateCollections = new SyncStateCollections(this);

    /** date de la dernière modif d'un élément */
    public lastmod: Date;

    /**
     * @param json objet ou chaîne JSON
     * @return {SyncState}
     */
    public static load(json: any): SyncState {
        if (typeof json === 'string') {
            json = JSON.parse(json);
        }
        // TODO : sale... moche... bouh ! => reprendre cycle.js et voir s'il propose une méthode pour parse
        const syncState = new SyncState();
        syncState.lastmod = new Date(json.lastmod);
        syncState.collections.load(json.collections);
        syncState.discs.load(json.discs);
        return syncState;
    }
}

export abstract class SyncStateElements<T> {

    // On utilise plus de Map car elle se converti très mal en JSON
    // cf commentaires : http://2ality.com/2015/08/es6-map-json.html
    readonly elementsById: { [key: string]: SyncStateElement<T> } = {};

    /** date de la dernière modif d'un élément */
    public lastmod: Date = new Date();

    protected constructor(public parent: SyncState) {
    }

    /**
     * Ajoute un élément ou le met à jour uniquement s'il a été modifié
     * @return l'élément synchronisé avec des infos sur sa synchronisation
     */
    push(element: T): SyncStateElement<T> {
        const id = this.getId(element);
        let ssElement: SyncStateElement<T>;
        if (!(id in this.elementsById)) {
            ssElement = new SyncStateElement<T>(element, this);
            this.elementsById[id] = ssElement;
            return ssElement;
        } else {
            ssElement = this.elementsById[id];
            if (ssElement.hasChanged(element)) {
                ssElement.update(element);
            }
            return ssElement;
        }
    }

    removeById(id: string) {
        delete this.elementsById[id];
    }

    /**
     * @param {T} element
     * @return {string} l'id dans la map qui stocke l'état de chaque élément
     */
    abstract getId(element: T): string;

    abstract getChecksum(element: T): string;

    // noinspection JSUnusedGlobalSymbols : utilisée lorsqu'on appelle SyncStateDiscs.stringify
    toJSON(): any {
        return cloneWithout(this, ['parent']);
    }

    // TODO méthodes save et load dans la persistence qui utilise un SyncState
    load(json: any) {
        this.lastmod = new Date(json.lastmod);
        _.each(json.elementsById, (elementJSON, key) => {
            const element = new SyncStateElement<T>(undefined, this);
            element.load(elementJSON);
            this.elementsById[key] = element;
        });
    }
}

export class SyncStateElement<T> {

    public /* readonly */ created = new Date();
    public lastmod = new Date();
    public checksum;

    constructor(syncedElement: T, public parent: SyncStateElements<T>) {
        if (syncedElement) {
            this.checksum = this.parent.getChecksum(syncedElement);
        }
    }

    hasChanged(syncedElement: T): any {
        return this.checksum !== this.parent.getChecksum(syncedElement);
    }

    update(syncedElement: T): this {
        this.checksum = this.parent.getChecksum(syncedElement);
        this.lastmod = new Date();
        this.parent.lastmod = this.lastmod;
        this.parent.parent.lastmod = this.lastmod;
        return this;
    }

    // noinspection JSUnusedGlobalSymbols : utilisée lorsqu'on appelle SyncStateDiscs.stringify
    toJSON(): any {
        return cloneWithout(this, ['parent']);
    }

    load(json: any) {
        _.extend(this, json);
        this.created = new Date(this.created);
        this.lastmod = new Date(this.lastmod);
    }
}

export class SyncStateDiscs extends SyncStateElements<Disc> {

    constructor(public parent: SyncState) {
        super(parent);
    }

    getId(disc: Disc): string {
        return disc.id;
    }

    getChecksum(disc: Disc): string {
        return md5(disc.toJSON());
    }
}

export class SyncStateCollections extends SyncStateElements<Collection> {

    constructor(public parent: SyncState) {
        super(parent);
    }

    getId(collection: Collection): string {
        return collection.name;
    }

    getChecksum(collection: Collection): string {
        return md5(JSON.stringify(collection));
    }
}

/**
 * Synchro de deux collections qui sont différentes (checksum)
 * @param {Collection} thisCollection
 * @param {Collection} srcCollection
 * @param {SyncResult} syncResult
 * @return {Collection} thisCollection
 */
function syncCommonCollection(thisCollection: Collection, srcCollection: Collection, syncResult: SyncResult): Collection {

    console.log(`Synchro des collections communes`, thisCollection, srcCollection);

    /** Disques absents dans this */
    const pulledDiscIds = srcCollection.discIds.filter(discId => !thisCollection.discIds.includes(discId))
        .map(discId => discId);
    if (pulledDiscIds.length) {
        syncResult.collections.common.pulled.push(srcCollection);
    }

    /** Disques absents dans la source */
    const pushedDiscIds = thisCollection.discIds.filter(discId => !srcCollection.discIds.includes(discId))
        .map(discId => discId);
    if (pushedDiscIds.length) {
        pushOnlyOnce(syncResult.collections.common.pushed, thisCollection);
    }

    // Modification des collections
    if (pulledDiscIds.length || pushedDiscIds.length) {
        // On ajoute les disques de this à la fin de src
        pushedDiscIds.map(discId => srcCollection.push(discId));
        // On reporte la même collection dans this
        thisCollection.replaceWith(srcCollection);
    }

    return thisCollection;
}

/**
 * Synchro de deux disques qui sont différents (checksum)
 * @param {Disc} thisDisc
 * @param {Disc} srcDisc
 * @param {SyncResult} syncResult
 * @return {Disc} thisDisc
 */
function syncCommonDisc(thisDisc: Disc, srcDisc: Disc, syncResult: SyncResult): Disc {
    // Comparaison de la cuesheet pour diff
    // FIXME utiliser plutôt toJSON car print affiche la date courante !
    const thisCueData = CuePrinter.print(thisDisc.cuesheet);
    const srcCueData = CuePrinter.print(srcDisc.cuesheet);
    if (thisCueData === srcCueData) {
        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) inchangé`);
    } else {
        console.log(`Disque ${srcDisc.id} (${srcDisc.title}) différent. On prend celui de la source...`,
            thisCueData, srcCueData);
        pushOnlyOnce(syncResult.discs.common.pulled, srcDisc);
    }

    return thisDisc;
}

function pushOnlyOnce<T>(array: T[], item: T) {
    if (!array.includes(item)) {
        array.push(item);
    }
}
