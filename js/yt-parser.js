/**
 * Created by mlavigne on 27/06/2017.
 */

/* require moment.js */

var ytparser = {};

const TIME_ZERO = parseTime("0:00");

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
 * @param options pour aider le parsing
 * @param {boolean} options.artistInTitle comme dans le m3u ?
 * @param {boolean} options.artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
 */
ytparser.newDiscFromVideo = function(video, videoUrl, options) {
    const snippet = video.items[0].snippet;
    const contentDetails = video.items[0].contentDetails;
    return newDiscFromVideoSnippet(snippet, videoUrl, contentDetails, options);
};

/**
 * Remplace CueService.extractTracks
 * @param json représentation ou objet YouTube Vidéo (snippet)
 * @param {boolean} options.artistInTitle comme dans le m3u ?
 * @param {boolean} options.artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
 */
ytparser.newDiscFromVideoSnippet = function(snippet, videoUrl, contentDetails, options) {
    return newDiscFromVideoSnippet(snippet, videoUrl, contentDetails, options);
};

/**
 * 
 * @param snippet video.items[0].snippet dans le JSON d'une vidéo YouTube
 * @param videoUrl $scope.getVideoUrlFromId(videoId)
 * @param contentDetails? video.items[0].contentDetails dans le JSON d'une vidéo YouTube (facultatif)
 * @param {boolean} options.artistInTitle comme dans le m3u ?
 * @param {boolean} options.artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
 * @returns {Array}
 */
function newDiscFromVideoSnippet(snippet, videoUrl, contentDetails, options) {
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
    let artistBeforeTitle = options && options.artistBeforeTitle; // comme dans le m3u ?
    let artistInTitle = options && options.artistInTitle; // true si l'artiste apparait dans le titre de la chanson
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i].trim();
        if (line === "") continue;

        try {
            const parseRes = ytparser.parseTrack({
                line: line,
                lineNumber: i,
                trackNumber: file.tracks.length + 1,
                artistBeforeTitle: artistBeforeTitle,
                artistInTitle: artistInTitle
            });
            if (parseRes) {
                console.log("newDiscFromVideo:track : Parsing OK de la ligne : "+line);

                // Infos à garder pour les autres pistes
                artistBeforeTitle = parseRes.artistBeforeTitle;
                artistInTitle = parseRes.artistInTitle;

                const track = file.newTrack();
                _.extend(track, parseRes.track/*{
                 title: title,
                 performer: artist,
                 indexes: [
                 new cuesheet.Index(1, time)
                 ]
                 }*/);
            } else {
                console.warn("newDiscFromVideo:track : Impossible de parser la ligne : " + line);
            }
        } catch (e) {
            console.warn("newDiscFromVideo:track : Impossible de parser la ligne : " + line);
        }

    }//for

    // Vérif si on a au moins trouver une piste
    if (!disc.tracks || !disc.tracks.length) {
        console.error("Vidéo sans tracklist. Tentez votre chance à cette adresse : http://www.regeert.nl/cuesheet/?str="+encodeURIComponent(disc.title));
        const error = new Error("Aucune piste n'a été trouvée dans la description de la vidéo"/* : " + description*/);
        error.disc = disc;
        error.name = "youtube.notracklist";
        throw error;
    }

    // Informations dans le contentDetails (optionnel)
    if (contentDetails) {
        _.extend(disc.files[0], {
            duration: moment.duration(contentDetails.duration).asSeconds()
        });
    }

    return disc;
}

/**
 * @typedef {Object} ParseResult
 * @property {string} artistInTitle comme dans le m3u ?
 * @property {string} artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
 * @property {cuesheet.Track} track la piste parsée
 */
/**
 * @typedef {Object} ParsedTrack
 * @property {string} title
 * @property {string} performer
 * @property {cuesheet.Index[]} indexes
 */
/**
 *
 * @param {string} input.line ligne à parser
 * @param {number} input.lineNumber numéro de la ligne à parser
 * @param {number} input.trackNumber numéro de la piste à créer
 * @param {boolean} input.artistInTitle comme dans le m3u ?
 * @param {boolean} input.artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
 *
 * @return {ParseResult}
 */
ytparser.parseTrack = function(input) {
    const line = input.line;
    let remainingLine = line.trim();
    const i = input.lineNumber;

    /** @type ParseResult */
    const output = {
        artistBeforeTitle: input.artistBeforeTitle,
        artistInTitle: input.artistInTitle,
    };

    const rx = /(.+[^\d:])?(\d+(?::\d+)+)([^\d:].+)?/i; // 1:avant time code, 2:timecode, 3:après timecode
    const sepRxAfter = /^([^\w]+)(\w.+)$/;
    const sepRxBefore = /^[^\w]*(\w.+)([^\w]+)$/;

    // Ligne préfixée par le numéro de piste ?
    const REGEX_WITH_TRACK_NUMBER = /^(#?(\d+))[^0-9:]/;
    let mTrackNumber = REGEX_WITH_TRACK_NUMBER.exec(remainingLine);
    if (mTrackNumber) {
        const trackNumber = +mTrackNumber[2];
        if (trackNumber !== input.trackNumber) {
            console.warn(`Le numéro de piste ${trackNumber} ne correspond pas à celui attendu : ${input.trackNumber}. Ligne complète : ${line}`);
        } else {
            remainingLine = remainingLine.substring(mTrackNumber[1].length).trim()// on retire le numéro de piste de la ligne
        }
    }

    // Découpage par timecode "00:00..."
    const REGEX_SPLIT_BY_TIMECODES = /(\d+(?::\d+)+)/gi; // TODO : constante
    let splitIndex = 0;
    let splitRes = undefined;
    const parts2 = [];
    let partIndex = 0;
    let textAfterLastTime = mTrackNumber ? remainingLine : undefined; // on autorise une ligne sans code uniquement si on a détecté un numéro de piste
    while ((splitRes = REGEX_SPLIT_BY_TIMECODES.exec(remainingLine)) !== null) {
        let textBeforeTime = remainingLine.substring(splitIndex, splitRes.index).trim();
        if (textBeforeTime) {
            parts2.push(textBeforeTime);
        }
        parts2.push(parseTime(splitRes[0]));
        splitIndex = splitRes.index + splitRes[0].length;
        textAfterLastTime = remainingLine.substring(splitIndex).trim();
    }

    // Texte après le dernier time
    if (textAfterLastTime) {
        parts2.push(textAfterLastTime);
    }

    const timeParts = parts2.filter(part => part instanceof cuesheet.Time);
    const textParts = parts2.filter(part => typeof(part)==='string');
    let time;

    // Formats avec N TIME => 1er : début de la piste
    if (timeParts.length === 0) {
        time = TIME_ZERO;
    } else {
        time = timeParts[0];
    }

    // Nettoyage des textes
    const REGEX_CLEAN_TEXT_PARTS = /[^\w]*(.*)/i; // TODO : constante
    const REGEX_CLEAN_TEXT_PARTS_END = /(.*)-$/i; // TODO : constante
    for (let i=0; i<textParts.length; ++i) {
        let textPart = textParts[i];
        // On supprime les symboles au début
        const m = REGEX_CLEAN_TEXT_PARTS.exec(textPart);
        if (m) {
            textPart = m[1].trim();
            if (textPart) {
                textParts[i] = textPart;
            } else {
                textParts.splice(i, 1);
            }
        }


        // On supprime les symboles à la fin
        const mEnd = REGEX_CLEAN_TEXT_PARTS_END.exec(textPart);
        if (mEnd) {
            textParts[i] = mEnd[1].trim();
        }
    }

    // Formats avec 1 TEXT
    if (textParts.length > 1) {
        throw new Error("Trop de texte séparés par des timecode dans la ligne "+line);
    }
    let sep = " - ";
    let text = textParts[0];
    if (!text) {
        throw new Error("Aucun texte dans la ligne "+line);
    }

    // Séparation du texte
    let title, artist;
    if (sep && sep.trim()) {
        let texts = text.split(sep);

        // Deux parties (artiste - title ou title - artiste) ?
        if (sep.trim() && texts.length > 1) {
            if (typeof(input.artistInTitle) === 'undefined') {
                output.artistInTitle = confirm("Le nom de l'artiste apparaît-il dans le texte suivant ?\n"+text);
            }
            if (!output.artistInTitle) {
                title = text;
            } else {

                if (typeof(input.artistBeforeTitle) === 'undefined') {
                    output.artistBeforeTitle = confirm("Le nom de l'artiste est bien avant le titre dans le texte suivant ?\n" + text);
                }

                if (output.artistBeforeTitle) {
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

    output.track = {
        title: title,
        performer: artist,
        indexes: [
            new cuesheet.Index(input.trackNumber, time)
        ]
    };

    return output;
};

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