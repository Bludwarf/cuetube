class LocalStoragePersistence extends Persistence {

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    public async getCollection(collectionName: string): Promise<Collection> {
        const json = localStorage.getItem(`collection.${collectionName}`);
        if (!json) {
            return undefined;
        }
        const object = JSON.parse(json);
        const collection = new Collection(collectionName);
        collection.discIds = object.discIds;
        return collection;
    }

    public async postCollection(collection: Collection): Promise<Collection> {
        localStorage.setItem(`collection.${collection.name}`, JSON.stringify(collection));
        return collection;
    }

    public async getCollectionDiscIds(collectionName: string, cb: (err: Error, discIds: string[]) => void): Promise<string[]> {
        let collection: Collection = await this.getCollection(collectionName);
        if (!collection) {
            collection = new Collection(collectionName);
            this.postCollection(collection);
        }
        return collection.discIds;
    }
    public async postCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {
        const collection: Collection = await this.getCollection(collectionName) || new Collection();
        collection.discIds = discIds;
        this.postCollection(collection);
        return collection.discIds;
    }

    public async getDisc(discId: string, discIndex: number): Promise<Disc> {
        const json = localStorage.getItem(`disc.${discId}.cuesheet`);
        if (!json) {
            throw new Error(`Le disque ${discId} n'a pas été trouvé dans le LocalStorage`);
        }
        const data = JSON.parse(json);
        const disc = super.createDisc(discId, discIndex, data);
        return disc;
    }

    public async postDisc(discId: string, disc): Promise<any> {
        localStorage.setItem(`disc.${discId}.cuesheet`, JSON.stringify(disc.cuesheet));
        return disc;
    }
}