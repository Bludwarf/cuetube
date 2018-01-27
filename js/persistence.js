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
    getCollectionDiscIds(collectionName, cb) {
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
}
Persistence.DEFAULT_COLLECTION = '_default_';
//# sourceMappingURL=persistence.js.map