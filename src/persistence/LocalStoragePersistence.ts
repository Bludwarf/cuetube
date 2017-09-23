class LocalStoragePersistence extends Persistence {

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    public getCollectionDiscIds(collectionName: string, cb: (err: Error, discIds: string[]) => void): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                const collection: Collection = getCollection(collectionName);
                if (!collection) return reject(`La collection ${collectionName} n'a pas été trouvée dans le LocalStorage`);
                resolve(collection.discIds);
            } catch (e) {
                reject(e);
            }
        });
    }
    public postCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                const collection: Collection = getCollection(collectionName) || new Collection();
                collection.discIds = collection.discIds || [];
                setCollection(collectionName, collection);
                resolve(collection.discIds);
            } catch (e) {
                reject(e);
            }
        });
    }

    public getDisc(discId: string, discIndex: number): Promise<Disc> {
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

    public postDisc(discId: string, disc): Promise<any> {
        return new Promise((resolve, reject) => {
            localStorage.setItem(`disc.${discId}.cuesheet`, JSON.stringify(disc.cuesheet));
            resolve(disc);
        });
    }
}

function getCollection(collectionName: string): Collection {
    const json = localStorage.getItem(`collection.${collectionName}`);
    if (!json) {
        return undefined;
    }
    return JSON.parse(json);
}

function setCollection(collectionName: string, collection: Collection) {
    localStorage.setItem(`collection.${collectionName}`, JSON.stringify(collection));
}