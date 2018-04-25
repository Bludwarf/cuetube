declare module ytparser {
    function newDiscFromPlaylistItems(playlistItems: Array<any>, discName: string);
    function newDiscFromVideoSnippet(snippet: string, videoUrl: string)/*: Disc*/;
}
