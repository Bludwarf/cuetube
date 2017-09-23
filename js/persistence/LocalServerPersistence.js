var CueSheet = cuesheet.CueSheet;
class LocalServerPersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
    }
    getCollectionDiscIds(collectionName) {
        return new Promise((resolve, reject) => {
            this.$http.get(`/collection/${collectionName}/discs`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collection != 200");
                    return reject(res.status);
                }
                const discIds = res.data;
                resolve(discIds);
            }, resKO => {
                return reject(resKO);
            });
        });
    }
    postCollectionDiscIds(collectionName, discIds) {
        return new Promise((resolve, reject) => {
            this.$http.post(`/collection/${collectionName}/discs`, discIds).then(res => {
                resolve(discIds);
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
            this.$http.post(`/${discId}.json`, disc).then(resolve, reject);
        });
    }
}
//# sourceMappingURL=LocalServerPersistence.js.map