abstract class Persistence {

    constructor(protected $scope: IPlayerScope, protected $http: ng.IHttpService) {
    }

    public abstract getCollectionDiscIds(collectionName: string, cb: (err: Error, discIds: string[]) => void): Promise<string[]>;

    public abstract getDisc(discId: string, discIndex: number): Promise<Disc>;

    public abstract postDisc(videoId: string, video): Promise<any>;

    public getVideo(videoId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubeVideoResource> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePageInfo<GoogleApiYouTubeVideoResource>>('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails',//'contentDetails', // contentDetails => durée
                    id: videoId,
                    maxResults: 1
                }
            })
            // conversion success(data) -> then(res) {data = res.data}
            // conversion error(data) -> catch(res) {data = res.data}
                .then(res => {
                    let data = res.data;
                    if (!data.items || data.items.length !== 1) return reject(new Error("Items not found for videoId " + videoId));
                    this.$scope.debugData.getVideoSnippet = data;
                    resolve(data.items[0]);
                }, resKO => {
                    reject(resKO.data);
                })
        });
    }

    public getPlaylistItems(playlistId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubePlaylistItemResource[]> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',//'contentDetails',
                    playlistId: playlistId,
                    maxResults: 50 // TODO : YouTube n'autorise pas plus que 50
                }
            })
            // conversion success(data) -> then(res) {data = res.data}
                .then(res => {
                    const data: any = res.data;
                    if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage) return reject(new Error("Too much results (> 50)"));
                    resolve(data);
                }, res => {
                    reject(res.data);
                })
        });
    }
}