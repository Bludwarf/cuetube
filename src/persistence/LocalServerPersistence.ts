///<reference path="../../node_modules/@types/angular/index.d.ts"/>
import CueSheet = cuesheet.CueSheet;

class LocalServerPersistence extends Persistence {

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    public getCollectionNames(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collectionNames`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collectionNames != 200");
                    return reject(res.status);
                }
                const collectionNames: string[] = res.data;
                resolve(collectionNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }

    public setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.post<string[]>(`/collectionNames`, collectionsNames).then(res => {
                resolve(collectionsNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }

    public getCollection(collectionName: string): Promise<Collection> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collection/${collectionName}/discs`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collection != 200");
                    return reject(res.status);
                }
                const discIds: string[] = res.data;
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

    public postCollection(collection: Collection): Promise<Collection> {
        const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
        return new Promise((resolve, reject) => {
            this.$http.post<Collection>(`/collection/${collectionName}/discs`, collection.discIds).then(res => {
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

    public getDisc(discId: string, discIndex: number): Promise<Disc> {
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
    public postDisc(discId: string, disc): Promise<any> {
        return new Promise((resolve, reject) => {
            this.$http.post(`/${discId}.cue.json`, disc).then(resolve, reject);
        });
    }
}