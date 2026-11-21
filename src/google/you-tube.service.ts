import {Injectable} from '@angular/core';
import {GoogleApiYouTubeVideoResource} from '../GoogleApiYouTubePatch';
import {HttpClient} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class YouTubeService {

    constructor(
        private readonly $http: HttpClient,
    ) {
    }

    public getVideo(videoId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubeVideoResource> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePageInfo<GoogleApiYouTubeVideoResource>>('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails', // 'contentDetails', // contentDetails => durée
                    id: videoId,
                    maxResults: '1'
                }
            }).toPromise()
                // conversion success(data) -> then(res) {data = res.data}
                // conversion error(data) -> catch(res) {data = res.data}
                .then(res => {
                    // const data = res.data; // AngularJS
                    const data = res; // Angular5
                    if (!data.items || data.items.length !== 1) {
                        return reject(new Error('Items not found for videoId ' + videoId));
                    }
                    resolve(data.items[0]);
                }, resKO => {
                    reject(resKO.data);
                });
        });
    }

    public getPlaylistItems(playlistId: string, GOOGLE_KEY: string): Promise<GoogleApiYouTubePlaylistItemResource[]> {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get<GoogleApiYouTubePaginationInfo<GoogleApiYouTubePlaylistItemResource>>(
                'https://www.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        key: GOOGLE_KEY,
                        part: 'snippet', // 'contentDetails',
                        playlistId: playlistId,
                        maxResults: '50' // TODO : YouTube n'autorise pas plus que 50
                    }
                }).toPromise()
                // conversion success(data) -> then(res) {data = res.data}
                .then(res => {
                    // const data: any = res.data; // AngularJS
                    const data = res; // Angular5
                    if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage) {
                        return reject(new Error('Too much results (> 50)'));
                    }
                    // resolve(data); // AngularJS
                    resolve(data.items); // Angular5
                }, res => {
                    reject(res.data);
                });
        });
    }

}
