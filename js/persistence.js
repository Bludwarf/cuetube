///<reference path="@types/utils.d.ts"/>
///<reference path="CuePrinter.ts"/>
//import CuePrinter = require('./CuePrinter');
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Persistence {
    constructor($scope, $http) {
        this.$scope = $scope;
        this.$http = $http;
    }
    /**
     * @return {Promise<boolean>} true si init OK, false sinon
     */
    init(params) {
        return Promise.resolve(true);
    }
    getCollectionDiscIds(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!collectionName) {
                collectionName = Persistence.DEFAULT_COLLECTION;
            }
            let collection = yield this.getCollection(collectionName);
            if (!collection) {
                collection = new Collection(collectionName);
                this.postCollection(collection);
            }
            return collection.discIds;
        });
    }
    /**
     * @param {string} collectionName
     * @param {string[]} discIds id des disques présents dans cette collection, annule et remplace les précédents
     * @return {Promise<string[]>}
     */
    postCollectionDiscIds(collectionName, discIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!collectionName) {
                collectionName = Persistence.DEFAULT_COLLECTION;
            }
            const collection = (yield this.getCollection(collectionName)) || new Collection();
            collection.discIds = discIds;
            this.postCollection(collection);
            return collection.discIds;
        });
    }
    newCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.postCollection({
                name: collectionName,
                discIds: []
            });
        });
    }
    getVideo(videoId, GOOGLE_KEY) {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails',
                    id: videoId,
                    maxResults: 1
                }
            })
                .then(res => {
                let data = res.data;
                if (!data.items || data.items.length !== 1)
                    return reject(new Error("Items not found for videoId " + videoId));
                this.$scope.debugData.getVideoSnippet = data;
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
    createDisc(discId, discIndex, jsonCuesheet) {
        const cue = new cuesheet.CueSheet();
        _.extend(cue, jsonCuesheet);
        const disc = new Disc(cue);
        disc.id = discId;
        disc.index = discIndex;
        return disc;
    }
    getPlaylistItems(playlistId, GOOGLE_KEY) {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',
                    playlistId: playlistId,
                    maxResults: 50 // TODO : YouTube n'autorise pas plus que 50
                }
            })
                .then(res => {
                const data = res.data;
                if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage)
                    return reject(new Error("Too much results (> 50)"));
                resolve(data);
            }, res => {
                reject(res.data);
            });
        });
    }
    /**
     * Fusionne la persistence src avec la persistence actuelle.
     * @param {Persistence} src persistence à intégrer dans la courante
     * @return {Promise<boolean>} true si la persistence actuelle a été modifiée suite au merge
     */
    merge(src) {
        return __awaiter(this, void 0, void 0, function* () {
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
                srcCollectionNames.filter(name => !thisCollectionNames.includes(name)).map(name => Promise.resolve()
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
                thisCollectionNames.filter(name => srcCollectionNames.includes(name)).map(name => Promise.resolve()
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
                    })).then(results => {
                        // Si la collection a été modifiée il faut la sauvegarder
                        if (thisCollModified) {
                            thisModified = true;
                            return this.postCollection(thisCollection);
                        }
                        else {
                            return Promise.resolve(thisCollection);
                        }
                    }).then(collection => {
                        if (!thisCollModified) {
                            console.log(`Collection ${name} non modifiée`);
                        }
                        console.groupEnd();
                        if (thisCollModified) {
                            return collection;
                        }
                        else {
                            return null;
                        }
                    });
                })))).then(modifiedCollections => {
                    console.log("Début de la synchro des disques...");
                    // Récup de tous les disques référencés après synchro
                    const discIds = modifiedCollections
                        .filter(collection => collection != null)
                        .map(collection => collection.discIds)
                        .reduce((allDiscIds, discIds) => {
                        discIds.forEach(discId => {
                            if (allDiscIds.indexOf(discId) === -1) {
                                allDiscIds.push(discId);
                            }
                        });
                        return allDiscIds;
                    }, []);
                    // Synchro de chaque disque
                    let discIndex = -1; // TODO
                    return Promise.all(discIds.map(discId => Promise
                        .resolve(discId)
                        .then(discId => {
                        console.log(`Synchro du disque ${discId}...`);
                        return discId;
                    })
                        .then(discId => Promise.all([
                        this.getDisc(discId, discIndex).catch(e => null),
                        src.getDisc(discId, discIndex).catch(e => null)
                    ]))
                        .then(results => {
                        const [thisDisc, srcDisc] = results;
                        // Le disque n'est pas connu par tout le monde
                        if (!thisDisc || !srcDisc) {
                            console.error(`Le disque ${discId} n'est pas connu par tout le monde`);
                            if (!thisDisc) {
                                console.log(`Synchro : ajout du disque ${discId}`);
                                return this.postDisc(discId, srcDisc).then(disc => {
                                    console.log(`Synchro : disque ${discId} "${disc.title}" ajouté avec succès`);
                                    return disc;
                                });
                            }
                            if (!srcDisc) {
                                console.log(`Synchro : ajout du disque ${discId} vers ${src.title} : TODO`);
                                return null;
                            }
                            return null;
                        }
                        // Comparaison de la cuesheet pour diff
                        const thisCueData = CuePrinter.print(thisDisc.cuesheet);
                        const srcCueData = CuePrinter.print(srcDisc.cuesheet);
                        if (thisCueData === srcCueData) {
                            console.log(`Disque ${discId} (${srcDisc.title}) inchangé`);
                        }
                        else {
                            console.log(`Disque ${discId} (${srcDisc.title}) différent. On prend celui de ${src.title}...`, thisCueData, srcCueData);
                        }
                    })));
                }).then(() => {
                    console.groupEnd();
                    return thisModified;
                });
            });
        });
    }
}
Persistence.DEFAULT_COLLECTION = '_default_';
