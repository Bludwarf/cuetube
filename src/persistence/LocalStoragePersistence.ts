class LocalStoragePersistence extends Persistence {

    static DEFAULT_COLLECTION = '_DEFAULT_';

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    /**
     * @param {string} key
     * @return undefined si item inconnu
     */
    public getItem<T>(key: string): T {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        } else {
            return undefined;
        }
    }

    /**
     *
     * @param {string} key
     * @param value si null alors supprime l'item
     */
    public setItem<T>(key: string, value: T) {
        if (value) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.removeItem(key);
        }
    }

    public async getCollectionNames(): Promise<string[]> {
        const knownNames = this.getItem<string[]>("collectionNames");
        if (knownNames) {
            return knownNames;
        }

        const rx = /^collection\.(.+)/;
        const names = [];
        for (let i = 0; i < localStorage.length; i++){
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
        } catch (e) {
            console.warn("Impossible de sauvegarder la liste des collections. Cause :", e);
        }

        return names;
    }

    public async setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        this.setItem("collectionsNames", collectionsNames);
        return collectionsNames;
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
        this.setItem(`collection.${collection.name}`, collection);
        const collectionNames = await this.getCollectionNames();
        if (collectionNames.indexOf(collection.name) === -1) {
            collectionNames.push(collection.name);
            try {
                this.setCollectionNames(collectionNames);
            } catch (e) {
                console.warn("Impossible de sauvegarder la liste des collections. Cause :", e);
            }
        }
        return collection;
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