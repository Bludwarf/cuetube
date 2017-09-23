class Persistence {
    constructor($scope, $http) {
        this.$scope = $scope;
        this.$http = $http;
    }
    getVideo(videoId, GOOGLE_KEY) {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet,contentDetails',
                    id: videoId,
                    maxResults: 1
                }
            })
                .then(res => {
                let data = res.data;
                if (!data.items || data.items.length !== 1)
                    return reject(new Error("Items not found for videoId " + videoId));
                this.$scope.debugData.getVideoSnippet = data;
                resolve(data.items[0]);
            }, resKO => {
                reject(resKO.data);
            });
        });
    }
    /**
     *
     * @param {string} discId
     * @param {number} discIndex
     * @param jsonCuesheet {*} un objet JSON contenant la cuesheet à créér
     * @return {Disc}
     */
    createDisc(discId, discIndex, jsonCuesheet) {
        const cue = new cuesheet.CueSheet();
        _.extend(cue, jsonCuesheet);
        const disc = new Disc(cue);
        disc.id = discId;
        disc.index = discIndex;
        return disc;
    }
    getPlaylistItems(playlistId, GOOGLE_KEY) {
        return new Promise((resolve, reject) => {
            // TODO : à mettre dans ytparser plutôt non ?
            this.$http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',
                    playlistId: playlistId,
                    maxResults: 50 // TODO : YouTube n'autorise pas plus que 50
                }
            })
                .then(res => {
                const data = res.data;
                if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage)
                    return reject(new Error("Too much results (> 50)"));
                resolve(data);
            }, res => {
                reject(res.data);
            });
        });
    }
}
//# sourceMappingURL=persistence.js.map