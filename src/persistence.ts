///<reference path="@types/utils.d.ts"/>
///<reference path="CuePrinter.ts"/>
//import CuePrinter = require('./CuePrinter');

abstract class Persistence {

    static DEFAULT_COLLECTION = '_default_';

    constructor(protected $scope: IPlayerScope, protected $http: ng.IHttpService) {
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

    public abstract postCollection(collection: Collection): Promise<Collection>;

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
        const collection: Collection = await this.getCollection(collectionName) || new Collection();
        collection.discIds = discIds;
        this.postCollection(collection);
        return collection.discIds;
    }

    public async newCollection(collectionName: string): Promise<Collection> {
        return this.postCollection({
            name: collectionName,
            discIds: []
        });
    }

    public abstract getDisc(discId: string, discIndex: number): Promise<Disc>;

    // FIXME : disc devrait être un Disc et Promise une Promise<Disc>
    public abstract postDisc(discId: string, disc): Promise<any>;

    public getVideo(videoId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubeVideoResource> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePageInfo<GoogleApiYouTubeVideoResource>>('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails',//'contentDetails', // contentDetails => durée
                    id: videoId,
                    maxResults: 1
                }
            })
            // conversion success(data) -> then(res) {data = res.data}
            // conversion error(data) -> catch(res) {data = res.data}
                .then(res => {
                    let data = res.data;
                    if (!data.items || data.items.length !== 1) return reject(new Error("Items not found for videoId " + videoId));
                    this.$scope.debugData.getVideoSnippet = data;
                    resolve(data.items[0]);
                }, resKO => {
                    reject(resKO.data);
                })
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
            this.$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',//'contentDetails',
                    playlistId: playlistId,
                    maxResults: 50 // TODO : YouTube n'autorise pas plus que 50
                }
            })
            // conversion success(data) -> then(res) {data = res.data}
                .then(res => {
                    const data: any = res.data;
                    if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage) return reject(new Error("Too much results (> 50)"));
                    resolve(data);
                }, res => {
                    reject(res.data);
                })
        });
    }

    /**
     * Fusionne la persistence src avec la persistence actuelle.
     * @param {Persistence} src persistence à intégrer dans la courante
     * @return {Promise<boolean>} true si la persistence actuelle a été modifiée suite au merge
     */
    public async merge(src: Persistence): Promise<boolean> {

        console.group("Synchro entre deux persistances en cours");

        // Synchro des collections
        return Promise.all([this.getCollectionNames(), src.getCollectionNames()]).then(results => {
            const [thisCollectionNames, srcCollectionNames] = results;

            // FIXME : gérer le cas de la collection "_default_"

            let thisModified = false;

            /** Collections absentes dans la source */
            const onlyInThis = thisCollectionNames.filter(name => !srcCollectionNames.includes(name));

            // TODO utilité de cet index ici ?
            let discIndex = 0;

            // Synchro des collections
            return Promise.all(
                /** Collections uniquement dans la source */
                srcCollectionNames.filter(name => !thisCollectionNames.includes(name)).map(name =>
                    Promise.resolve()
                        .then(() => console.log(`Synchro : ajout de la collection ${name}...`))
                        .then(() => src.getCollection(name))
                        .then(collection => this.postCollection(collection))
                        .then(collection => {
                            thisModified = true;
                            return collection;
                        })
                        .then(collection => {
                            console.log(`Synchro : collection ${name} ajoutée avec succès`);
                            return collection;
                        })
                        //.catch(err => console.error(`Synchro : échec lors de l'ajout de la collection ${name}`, err))
                ).concat(
                    /** Collections communes */
                    thisCollectionNames.filter(name => srcCollectionNames.includes(name)).map(name =>
                        Promise.resolve()
                            .then(() => console.log(`Synchro : diff de la collection ${name}...`))
                            .then(() => Promise.all([this.getCollection(name), src.getCollection(name)]))
                            .then(results => {
                                const [thisCollection, srcCollection] = results;
                                console.group(`Synchro : Collection ${name}`);
                                let thisCollModified = false;
                                return Promise.all(
                                    // Disques uniquement dans la source
                                    srcCollection.discIds.filter(discId => !thisCollection.discIds.includes(discId)).map(discId => {
                                        console.log(`Synchro : ajout du disque ${discId} à la collection ${name}...`);
                                        thisCollection.discIds.push(discId);
                                        thisCollModified = true;
                                        return discId;
                                    })
                                ).then(results => {
                                    // Si la collection a été modifiée il faut la sauvegarder
                                    if (thisCollModified) {
                                        thisModified = true;
                                        return this.postCollection(thisCollection);
                                    } else {
                                        return Promise.resolve(thisCollection);
                                    }
                                }).then(collection => {
                                    if (!thisCollModified) {
                                        console.log(`Collection ${name} non modifiée`);
                                    }
                                    console.groupEnd();
                                    if (thisCollModified) {
                                        return collection;
                                    } else {
                                        return null;
                                    }
                                })
                            })
                    )
                )
            ).then(modifiedCollections => {

                console.log("Début de la synchro des disques...");

                // Récup de tous les disques référencés après synchro
                const discIds = modifiedCollections
                    .filter(collection => collection != null)
                    .map(collection => collection.discIds)
                    // Collecte de tous les discId sans doublon
                    .reduce((allDiscIds, discIds) => {
                        discIds.forEach(discId => {
                            if (allDiscIds.indexOf(discId) === -1) {
                                allDiscIds.push(discId);
                            }
                        });
                        return allDiscIds;
                    }, []);

                // Synchro de chaque disque
                let discIndex = -1;// TODO
                Promise.all(
                    discIds.map(discId => Promise
                        .resolve(discId)
                        .then(discId => Promise.all([this.getDisc(discId, discIndex), src.getDisc(discId, discIndex)]))
                        .then(results => {
                            const [thisDisc, srcDisc] = results;

                            // Comparaison de la cuesheet pour diff
                            const thisCueData = CuePrinter.print(thisDisc.cuesheet);
                            const srcCueData = CuePrinter.print(srcDisc.cuesheet);
                            if (thisCueData === srcCueData) {
                                console.log(`Disque ${discId} (${srcDisc.title}) inchangé`);
                            } else {
                                console.log(`Disque ${discId} (${srcDisc.title}) différent. On prend celui de ${src.title}...`, thisCueData, srcCueData);
                            }
                        })
                    )
                ).then(results => {
                    console.log("Fin de la synchro des disques");
                })

            }).then(() => {
                console.groupEnd();
                return thisModified;
            });
        });
    }
}