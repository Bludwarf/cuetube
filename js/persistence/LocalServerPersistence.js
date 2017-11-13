///<reference path="../../node_modules/@types/angular/index.d.ts"/>
var CueSheet = cuesheet.CueSheet;
class LocalServerPersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
    }
    getCollectionNames() {
        return new Promise((resolve, reject) => {
            this.$http.get(`/collectionNames`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collectionNames != 200");
                    return reject(res.status);
                }
                const collectionNames = res.data;
                resolve(collectionNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }
    setCollectionNames(collectionsNames) {
        return new Promise((resolve, reject) => {
            this.$http.post(`/collectionNames`, collectionsNames).then(res => {
                resolve(collectionsNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }
    getCollection(collectionName) {
        return new Promise((resolve, reject) => {
            this.$http.get(`/collection/${collectionName}/discs`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collection != 200");
                    return reject(res.status);
                }
                const discIds = res.data;
                const collection = {
                    name: collectionName,
                    discIds: discIds
                };
                resolve(collection);
            }, resKO => {
                return reject(resKO);
            });
        });
    }
    postCollection(collection) {
        return new Promise((resolve, reject) => {
            this.$http.post(`/collection/${collection.name}/discs`, collection.discIds).then(res => {
                if (res.status !== 200) {
                    console.error("Error POST collection != 200");
                    return reject(res.status);
                }
                return resolve(collection);
            }, resKO => {
                return reject(resKO);
            });
        });
    }
    getDisc(discId, discIndex) {
        return new Promise((resolve, reject) => {
            this.$http.get("/" + discId + ".cue.json").then(res => {
                if (res.status !== 200) {
                    return reject(res.status);
                }
                const disc = super.createDisc(discId, discIndex, res.data);
                resolve(disc);
            }, reject);
        });
    }
    // TODO : renvoyer plutôt le disc que le résultat du post
    postDisc(discId, disc) {
        return new Promise((resolve, reject) => {
            this.$http.post(`/${discId}.cue.json`, disc).then(resolve, reject);
        });
    }
}
//# sourceMappingURL=LocalServerPersistence.js.map