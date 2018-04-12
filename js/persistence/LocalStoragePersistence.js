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
    get title() {
        return "LocalStorage";
    }
    /**
     * @param {string} key
     * @return undefined si item inconnu
     */
    getItem(key) {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        }
        else {
            return undefined;
        }
    }
    /**
     *
     * @param {string} key
     * @param value si null alors supprime l'item
     */
    setItem(key, value) {
        if (value) {
            localStorage.setItem(key, JSON.stringify(value));
        }
        else {
            localStorage.removeItem(key);
        }
    }
    getCollectionNames() {
        return __awaiter(this, void 0, void 0, function* () {
            const knownNames = this.getItem("collectionNames");
            if (knownNames) {
                return knownNames;
            }
            const rx = /^collection\.(.+)/;
            const names = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const m = rx.exec(key);
                if (m) {
                    const name = m[1];
                    if (name !== LocalStoragePersistence.DEFAULT_COLLECTION) {
                        names.push(name);
                    }
                }
            }
            try {
                this.setCollectionNames(names);
            }
            catch (e) {
                console.warn("Impossible de sauvegarder la liste des collections. Cause :", e);
            }
            return names;
        });
    }
    setCollectionNames(collectionsNames) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setItem("collectionsNames", collectionsNames);
            return collectionsNames;
        });
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
            const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
            this.setItem(`collection.${collectionName}`, collection);
            const collectionNames = yield this.getCollectionNames();
            if (collectionNames.indexOf(collectionName) === -1) {
                collectionNames.push(collectionName);
                try {
                    this.setCollectionNames(collectionNames);
                }
                catch (e) {
                    console.warn("Impossible de sauvegarder la liste des collections. Cause :", e);
                }
            }
            return collection;
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
LocalStoragePersistence.DEFAULT_COLLECTION = '_DEFAULT_';
