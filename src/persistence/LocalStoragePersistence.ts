class LocalStoragePersistence extends Persistence {

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    public getCollectionDiscIds(collectionName: string, cb: (err: Error, discIds: string[]) => void): Promise<string[]> {
        return null;
    }

    public getDisc(discId: string, discIndex: number): Promise<Disc> {
        return null;
    }

    public postDisc(videoId: string, video): Promise<any> {
        return null;
    }

    public postCueSheet(videoId: string, cuesheet: cuesheet.CueSheet): Promise<cuesheet.CueSheet> {
        return null;
    }
}