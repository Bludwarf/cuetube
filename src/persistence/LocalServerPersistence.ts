import CueSheet = cuesheet.CueSheet;

class LocalServerPersistence extends Persistence {

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    public async getCollection(collectionName: string): Promise<Collection> {
        throw new Error("Not implemented");
    }

    public async postCollection(collection: Collection): Promise<Collection> {
        throw new Error("Not implemented");
    }

    public getCollectionDiscIds(collectionName: string): Promise<string[]> {

        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collection/${collectionName}/discs`).then(res => {
                if (res.status !== 200) {
                    console.error("Error GET collection != 200");
                    return reject(res.status);
                }
                const discIds: string[] = res.data;
                resolve(discIds);
            }, resKO => {
                return reject(resKO);
            });
        });
    }

    public postCollectionDiscIds(collectionName: string, discIds: string[]): Promise<string[]> {

        return new Promise((resolve, reject) => {
            this.$http.post<string[]>(`/collection/${collectionName}/discs`, discIds).then(res => {
                resolve(discIds);
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