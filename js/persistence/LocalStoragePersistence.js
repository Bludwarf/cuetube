class LocalStoragePersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
    }
    getCollectionDiscIds(collectionName, cb) {
        return new Promise((resolve, reject) => {
            try {
                const collection = getCollection(collectionName);
                if (!collection)
                    return reject(`La collection ${collectionName} n'a pas été trouvée dans le LocalStorage`);
                resolve(collection.discIds);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    postCollectionDiscIds(collectionName, discIds) {
        return new Promise((resolve, reject) => {
            try {
                const collection = getCollection(collectionName) || new Collection();
                collection.discIds = collection.discIds || [];
                setCollection(collectionName, collection);
                resolve(collection.discIds);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    getDisc(discId, discIndex) {
        return new Promise((resolve, reject) => {
            const json = localStorage.getItem(`disc.${discId}.cuesheet`);
            if (!json) {
                return reject(`Le disque ${discId} n'a pas été trouvé dans le LocalStorage`);
            }
            const data = JSON.parse(json);
            const disc = super.createDisc(discId, discIndex, data);
            resolve(disc);
        });
    }
    postDisc(discId, disc) {
        return new Promise((resolve, reject) => {
            localStorage.setItem(`disc.${discId}.cuesheet`, disc.toJSON());
            resolve(disc);
        });
    }
}
function getCollection(collectionName) {
    const json = localStorage.getItem(`collection.${collectionName}`);
    if (!json) {
        return undefined;
    }
    return JSON.parse(json);
}
function setCollection(collectionName, collection) {
    localStorage.setItem(`collection.${collectionName}`, JSON.stringify(collection));
}
//# sourceMappingURL=LocalStoragePersistence.js.map