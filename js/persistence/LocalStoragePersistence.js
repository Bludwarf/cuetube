var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LocalStoragePersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
    }
    getCollection(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const json = localStorage.getItem(`collection.${collectionName}`);
            if (!json) {
                return undefined;
            }
            const object = JSON.parse(json);
            const collection = new Collection(collectionName);
            collection.discIds = object.discIds;
            return collection;
        });
    }
    postCollection(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            localStorage.setItem(`collection.${collection.name}`, JSON.stringify(collection));
            return collection;
        });
    }
    getCollectionDiscIds(collectionName, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            let collection = yield this.getCollection(collectionName);
            if (!collection) {
                collection = new Collection(collectionName);
                this.postCollection(collection);
            }
            return collection.discIds;
        });
    }
    postCollectionDiscIds(collectionName, discIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = (yield this.getCollection(collectionName)) || new Collection();
            collection.discIds = collection.discIds || [];
            collection.discIds = collection.discIds.concat(discIds);
            this.postCollection(collection);
            return collection.discIds;
        });
    }
    getDisc(discId, discIndex) {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const json = localStorage.getItem(`disc.${discId}.cuesheet`);
            if (!json) {
                throw new Error(`Le disque ${discId} n'a pas été trouvé dans le LocalStorage`);
            }
            const data = JSON.parse(json);
            const disc = _super("createDisc").call(this, discId, discIndex, data);
            return disc;
        });
    }
    postDisc(discId, disc) {
        return __awaiter(this, void 0, void 0, function* () {
            localStorage.setItem(`disc.${discId}.cuesheet`, JSON.stringify(disc.cuesheet));
            return disc;
        });
    }
}
//# sourceMappingURL=LocalStoragePersistence.js.map