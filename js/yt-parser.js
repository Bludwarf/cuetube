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

/**
 * Remplace CueService.extractTracks
 * @param json représentation ou objet YouTube Vidéo (snippet)
 */
ytparser.newDiscFromVideo = function(video, videoUrl) {
    const snippet = video.items[0].snippet;
    return newDiscFromVideoSnippet(snippet, videoUrl);
};

/**
 * Remplace CueService.extractTracks
 * @param json représentation ou objet YouTube Vidéo (snippet)
 */
ytparser.newDiscFromVideoSnippet = function(snippet, videoUrl) {
    return newDiscFromVideoSnippet(snippet, videoUrl);
};

function newDiscFromVideo_json(jsonString, videoUrl) {
    return newDiscFromVideo(JSON.parse(jsonString), videoUrl);
}

/**
 * 
 * @param snippet video.items[0].snippet dans le JSON d'une vidéo YouTube
 * @param videoUrl $scope.getVideoUrlFromId(videoId)
 * @returns {Array}
 */
function newDiscFromVideoSnippet(snippet, videoUrl) {
    let description = snippet.localized.description || snippet.description;

    // Recherche des lignes contenant des timecodes
    let lines = description.split(/\n/);

    // Création de la cuesheet
    let disc = new Disc();
    _.extend(disc, {
        title: snippet.title,
        performer: snippet.channelTitle
    });
    console.log("newDiscFromVideo : Parsing de la vidéo : "+disc.title);

    // Un seul fichier puisqu'une seule vidéo
    let file = disc.newFile();
    _.extend(file, {
        name: videoUrl,
        type: "MP3"
    });

    // Parsing de la description
    let rx = /(.+[^\d:])?(\d+(?::\d+)+)([^\d:].+)?/i; // 1:avant time code, 2:timecode, 3:après timecode
    let sepRxAfter = /^([^\w]+)(\w.+)$/;
    let sepRxBefore = /^[^\w]*(\w.+)([^\w]+)$/;
    let artistBeforeTitle; // comme dans le m3u ?
    let artistInTitle; // true si l'artiste apparait dans le titre de la chanson
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i].trim();
        if (line === "") continue;

        let parts = rx.exec(line);
        if (parts) {
            console.log("newDiscFromVideo:track : Parsing OK de la ligne : "+line);
            let time = parseTime(parts[2]);
            let textAfterTime = !!parts[3];
            let text = textAfterTime ? parts[3] : parts[1];

            // On cherche le séparateur
            let sepRx = textAfterTime ? sepRxAfter : sepRxBefore;
            let sepParts = sepRx.exec(text);
            let sep = sepParts ? sepParts[1] : null;
            text = sepParts ? sepParts[2] : text;

            // Séparation du texte
            let title, artist;
            if (sep && sep.trim()) {
                let texts = text.split(sep);

                // Deux parties (artiste - title ou title - artiste) ?
                if (sep.trim() && texts.length > 1) {
                    alert(artistInTitle);
                    if (artistInTitle === undefined) {
                        artistInTitle = confirm("Le nom de l'artiste apparaît-il dans le texte suivant ?\n"+text);
                    }
                    if (!artistInTitle) {
                        title = text;
                    } else {

                        if (typeof(artistBeforeTitle) === 'undefined') {
                            artistBeforeTitle = confirm("Le nom de l'artiste est bien avant le titre dans le texte suivant ?\n" + text);
                        }

                        if (artistBeforeTitle) {
                            artist = texts[0];
                            title = texts[1];
                        }
                        else {
                            title = texts[0];
                            artist = texts[1];
                        }
                    }
                }
                else {
                    title = text;
                }
            }
            else {
                // sep vide
                title = text;
            }

            //let track = disc.newTrack(file.tracks ? (file.tracks.length + 1) : 1, "AUDIO").getCurrentTrack();
            let track = file.newTrack();
            _.extend(track, {
                title: title,
                performer: artist,
                indexes: [
                    new cuesheet.Index(1, time)
                ]
            });
        } else {
            console.error("newDiscFromVideo:track : Impossible de parser la ligne : "+line);
        }
    }//for

    return disc;
}

// fonction extraite de cue-parser/lib/cue.js
/**
 * Accepte : H:M:S ou M:S
 * @return {cuesheet.Time}
 */
function parseTime(timeSting) {
    var timePattern = /^(?:(\d+):)?(\d+):(\d+)$/,
        parts = timeSting.match(timePattern),
        time = new cuesheet.Time();

    if (!parts) {
        throw new Error('Invalid time format:' + timeSting);
    }

    time.min = (parts[1] ? parts[1]*60 : 0) + parseInt(parts[2], 10);
    time.sec = parseInt(parts[3], 10);
    time.frame = 0;

    return time;
}