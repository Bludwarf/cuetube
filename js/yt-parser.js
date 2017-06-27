/**
 * Created by mlavigne on 27/06/2017.
 */

var ytparser = {};

ytparser.newDiscFromPlaylistItems = function(playlistItems, title) {
    playlistItems = playlistItems.items || playlistItems;

    let disc = new cuesheet.CueSheet();
    _.extend(disc, {
        title: title,//prompt("Nom du disque")
        performer: playlistItems[0].snippet.channelTitle
        /*rems: [
         "COMMENT \"Playlist YouTube : https://www.youtube.com/watch?v=RRtlWfi6jiM&list=PL1800E1EFCA1EABE3\""
         ]*/
    });

    for (let i = 0; i < playlistItems.length; ++i) {
        let item = playlistItems[i];
        let file = disc.newFile().getCurrentFile();
        _.extend(file, {
            name: ytparser.getVideoUrlFromId(item.snippet.resourceId.videoId),
            type: "MP3"
        });

        let track = disc.newTrack().getCurrentTrack();
        _.extend(track, {
            number: i + 1,
            title: item.snippet.title,
            type: "AUDIO",
            indexes: [
                {
                    "number": 1,
                    "time": {
                        "min": 0,
                        "sec": 0,
                        "frame": 0
                    }
                }
            ]
        });
    }

    return new Disc(disc);
};

ytparser.getVideoUrlFromId = function(id) {
    return "https://www.youtube.com/watch?v="+id;
};