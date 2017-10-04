var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
        });
    }
    postCollection(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented");
            // TODO : ne pas oublier de mettre à jour setCollectionNames
        });
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
            this.$http.post(`/${discId}.cue.json`, disc).then(resolve, reject);
        });
    }
}
//# sourceMappingURL=LocalServerPersistence.js.map