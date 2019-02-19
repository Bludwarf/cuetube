/**
 * Created by mlavigne on 27/06/2017.
 */
import {Disc} from './disc';
import * as _ from 'underscore';
import * as moment from 'moment';
import {
  GoogleApiYouTubePlaylistItemResource,
  GoogleApiYouTubePaginationInfo,
  GoogleApiYouTubeVideoResource
} from './GoogleApiYouTubePatch';

/* require moment.js */
export class ytparser {

  static newDiscFromPlaylistItems(playlistItems: GoogleApiYouTubePlaylistItemResource[], title: string) {
    // playlistItems = playlistItems.items || playlistItems;
    if (!playlistItems || !playlistItems.length) {
      throw new Error('Aucun élément dans la playlist');
    }

    const cue = new cuesheet.CueSheet();
    _.extend(cue, {
      title: title, // prompt("Nom du disque")
      performer: playlistItems[0].snippet.channelTitle
      /*rem: [
       "COMMENT \"Playlist YouTube : https://www.youtube.com/watch?v=RRtlWfi6jiM&list=PL1800E1EFCA1EABE3\""
       ]*/
    });

    for (let i = 0; i < playlistItems.length; ++i) {
      const item = playlistItems[i];
      const file = cue.newFile().getCurrentFile();
      _.extend(file, {
        name: ytparser.getVideoUrlFromId(item.snippet.resourceId.videoId),
        type: 'MP3'
      });

      const track = cue.newTrack().getCurrentTrack();
      _.extend(track, {
        number: i + 1,
        title: item.snippet.title,
        type: 'AUDIO',
        indexes: [
          {
            'number': 1,
            'time': {
              'min': 0,
              'sec': 0,
              'frame': 0
            }
          }
        ]
      });
    }

    const disc = new Disc(cue);
    disc.id = playlistItems[0].snippet.playlistId;
    return disc;
  }

  static getVideoUrlFromId(id) {
    return 'https://www.youtube.com/watch?v=' + id;
  }

  /**
   * Remplace CueService.extractTracks
   */
  static newDiscFromVideo(videoPage: GoogleApiYouTubePaginationInfo<GoogleApiYouTubeVideoResource>,
                          videoUrl: string, options?: ParseTrackObject) {
    const video = videoPage.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    return newDiscFromVideoSnippet(snippet, videoUrl, contentDetails, options);
  }

  /**
   * Remplace CueService.extractTracks
   */
  static newDiscFromVideoSnippet(snippet: GoogleApiYouTubeVideoResource['snippet'],
                                 videoUrl: string, contentDetails?: any, options?: ParseTrackObject) {
    return newDiscFromVideoSnippet(snippet, videoUrl, contentDetails, options);
  }

  static parseTracks(lines, options?) {

    const tracks = [];

    const curr = {
      artistBeforeTitle: options && options.artistBeforeTitle,
      artistInTitle: options && options.artistInTitle,
      containsDuration: options && options.containsDuration,
      durationBeforeTime: options && options.durationBeforeTime
    };

    for (let i = 0; i < lines.length; ++i) {
      const line = lines[i].trim();
      if (line === '') {
        continue;
      }

      try {
        const parseRes = ytparser.parseTrack({
          line: line,
          lineNumber: i,
          trackNumber: tracks.length + 1,
          artistBeforeTitle: curr.artistBeforeTitle,
          artistInTitle: curr.artistInTitle,
          containsDuration: curr.containsDuration,
          durationBeforeTime: curr.durationBeforeTime
        });
        if (parseRes) {
          console.log('newDiscFromVideo:track : Parsing OK de la ligne : ' + line);

          // Infos à garder pour les autres pistes
          curr.artistBeforeTitle = parseRes.artistBeforeTitle;
          curr.artistInTitle = parseRes.artistInTitle;
          curr.containsDuration = parseRes.containsDuration;
          curr.durationBeforeTime = parseRes.durationBeforeTime;

          tracks.push(parseRes.track);
        } else {
          console.warn('newDiscFromVideo:track : Impossible de parser la ligne : ' + line);
        }
      } catch (e) {
        console.warn('newDiscFromVideo:track : Impossible de parser la ligne : ' + line + '\nErreur:' + e);
      }

    } // for

    if (tracks && tracks.length >= 2) {

      if (!ytparser.checkTimecodeExists(tracks)) {

        // Vérif si les timecode sont présents
        alert('La tracklist ne comporte pas les timecodes de chaque piste, veuillez les ajouter manuellement...');

      } else if (!ytparser.checkTimecode(tracks)) {

        // Vérif si timecode ne sont pas des durées #90

        alert('Visiblement la tracklist indique la durée des pistes au lieu de leur début... On a corrigé la cuesheet.');
        let elapsed = new cuesheet.Time(0, 0, 0);
        for (let i = 0; i < tracks.length; ++i) {
          const time = tracks[i].indexes[0].time;
          const savedTime = new cuesheet.Time(time.min, time.sec, time.frame);

          time.min = elapsed.min;
          time.sec = elapsed.sec;
          time.frame = elapsed.frame;

          elapsed = this.addTimecode(elapsed, savedTime);
        }
      }
    }

    return tracks;
  }

  static addTimecode(t1, t2) {
    const sum = new cuesheet.Time(t1.min + t2.min, t1.sec + t2.sec, t1.frame + t2.frame);
    sum.sec += Math.floor(sum.frame / 75);
    sum.frame = sum.frame % 75;
    sum.min += Math.floor(sum.sec / 60);
    sum.sec = sum.sec % 60;
    return sum;
  }

  /**
   * @param tracks
   * @return {boolean} false si les timecodes ne sont pas rangés dans l'ordre chronologique
   */
  static checkTimecode(tracks) {
    for (let i = 1; i < tracks.length; ++i) {
      const previous = tracks[i - 1];
      const track = tracks[i];
      if (compareTimes(previous.indexes[0].time, track.indexes[0].time) > 0) {
        return false;
      }
    }
    return true;
  }

  /** @return {boolean} true si tous les timecodes sont présents (au moins 2 tracks) */
  static checkTimecodeExists(tracks) {
    const first = tracks[0];
    for (let i = 1; i < tracks.length; ++i) {
      const track = tracks[i];
      if (compareTimes(first.indexes[0].time, track.indexes[0].time) === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   *
   */
  static parseTrack(input: ParseTrackInput): ParseTrackResult {
    const line = input.line;
    let remainingLine = line.trim();
    // noinspection JSUnusedLocalSymbols
    const i = input.lineNumber;

    const output: ParseTrackResult = {
      artistBeforeTitle: input.artistBeforeTitle,
      artistInTitle: input.artistInTitle,
      containsDuration: input.containsDuration,
      durationBeforeTime: input.durationBeforeTime,
      track: undefined
    };

    // noinspection JSUnusedLocalSymbols
    const rx = /(.+[^\d:])?(\d+(?::\d+)+)([^\d:].+)?/i; // 1:avant time code, 2:timecode, 3:après timecode
    // noinspection JSUnusedLocalSymbols
    const sepRxAfter = /^([^\w]+)(\w.+)$/;
    // noinspection JSUnusedLocalSymbols
    // noinspection JSUnusedLocalSymbols
    // noinspection JSUnusedLocalSymbols
    // noinspection JSUnusedLocalSymbols
    const sepRxBefore = /^[^\w]*(\w.+)([^\w]+)$/;

    // Ligne préfixée par le numéro de piste ?
    const REGEX_WITH_TRACK_NUMBER = /^(#?(\d+))[^0-9:]/;
    const mTrackNumber = REGEX_WITH_TRACK_NUMBER.exec(remainingLine);
    if (mTrackNumber) {
      const trackNumber = +mTrackNumber[2];
      if (trackNumber !== input.trackNumber) {
        console.warn(
          `Le numéro de piste ${trackNumber} ne correspond pas à celui attendu : ${input.trackNumber}. Ligne complète : ${line}`);
      } else {
        remainingLine = remainingLine.substring(mTrackNumber[1].length).trim(); // on retire le numéro de piste de la ligne
      }
    }

    // Découpage par timecode "00:00..."
    const REGEX_SPLIT_BY_TIMECODES = /(\d+(?::\d+)+)/gi; // TODO : constante
    let splitIndex = 0;
    let splitRes;
    const parts2 = [];

    let textAfterLastTime = mTrackNumber ? remainingLine : undefined; // autorise ligne ssi on a détecté un numéro de piste
    while ((splitRes = REGEX_SPLIT_BY_TIMECODES.exec(remainingLine)) !== null) {
      const textBeforeTime = remainingLine.substring(splitIndex, splitRes.index).trim();
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
    const textParts = parts2.filter(part => typeof (part) === 'string');
    let time;

    if (timeParts.length === 0) {
      // Formats avec N TIME => 1er : début de la piste
      time = TIME_ZERO;
    } else if (timeParts.length === 2) {
      // Formats avec durée et time
      if (typeof (output.containsDuration) === 'undefined') {
        output.containsDuration = confirm('La durée de la piste apparaît-elle dans le texte suivant ?\n' + line);
        output.durationBeforeTime = confirm('Cette durée est-elle avant le timecode ?\n' + line);
      }
      if (output.containsDuration) {
        time = input.durationBeforeTime ? timeParts[1] : timeParts[0];
      } else {
        throw new Error(`Impossible de parser la ligne #${input.lineNumber} ${input.line}`);
      }
    } else {
      time = timeParts[0];
    }

    // Nettoyage des textes
    const REGEX_CLEAN_TEXT_PARTS = /[^\w]*(.*)/i; // TODO : constante
    const REGEX_CLEAN_TEXT_PARTS_END = /(.*)-$/i; // TODO : constante
    for (let j = 0; j < textParts.length; ++j) {
      let textPart = textParts[j];
      // On supprime les symboles au début
      const m = REGEX_CLEAN_TEXT_PARTS.exec(textPart);
      if (m) {
        textPart = m[1].trim();
        if (textPart) {
          textParts[j] = textPart;
        } else {
          textParts.splice(j, 1);
        }
      }


      // On supprime les symboles à la fin
      const mEnd = REGEX_CLEAN_TEXT_PARTS_END.exec(textPart);
      if (mEnd) {
        textParts[j] = mEnd[1].trim();
      }

      // Suppression de " si seul et à la fin
      if (textParts[j]) {
        textPart = textParts[j];
        const firstQuote = textPart.indexOf('"');
        if (firstQuote !== -1 && firstQuote === textPart.length - 1) {
          textParts[j] = textPart.slice(0, -1);
        }
      }
    }

    // Formats avec 1 TEXT
    if (textParts.length > 1) {
      // Format avec juste un caractère à la fin après les timecode
      if (textParts.length === 2 && textParts[1].match(/[^w]/)) {
        // pas une seule lettre
      } else {
        throw new Error('Trop de texte séparés par des timecode dans la ligne ' + line);
      }
    }
    const sep = ' - ';
    const text = textParts[0];
    if (!text) {
      throw new Error('Aucun texte dans la ligne ' + line);
    }

    // Séparation du texte
    let title, artist;
    if (sep && sep.trim()) {
      const texts = text.split(sep);

      // Deux parties (artiste - title ou title - artiste) ?
      if (sep.trim() && texts.length > 1) {
        if (typeof (input.artistInTitle) === 'undefined') {
          output.artistInTitle = confirm('Le nom de l\'artiste apparaît-il dans le texte suivant ?\n' + text);
        }
        if (!output.artistInTitle) {
          title = text;
        } else {

          if (typeof (input.artistBeforeTitle) === 'undefined') {
            output.artistBeforeTitle = confirm('Le nom de l\'artiste est bien avant le titre dans le texte suivant ?\n' + text);
          }

          if (output.artistBeforeTitle) {
            artist = texts[0];
            title = texts[1];
          } else {
            title = texts[0];
            artist = texts[1];
          }
        }
      } else {
        title = text;
      }
    } else {
      // sep vide
      title = text;
    }

    output.track = {
      title: title,
      performer: artist,
      indexes: [
        new cuesheet.Index(1, time)
      ]
    };

    return output;
  }

}

/**
 * Résultat de {module:ytparser.parseTrack}
 */
interface ParseTrackObject {
  /** comme dans le m3u ? */
  artistInTitle?: boolean;
  /** true si l'artiste apparait dans le titre de la chanson */
  artistBeforeTitle?: boolean;
  /** true si la durée de la piste apparait dans le texte d'entrée */
  containsDuration?: boolean;
  /** true si la durée apparait avant le temps de début de la piste */
  durationBeforeTime?: boolean;
}

interface ParseTrackInput extends ParseTrackObject {
  /** ligne à parser */
  line: string;
  /** numéro de la ligne à parser */
  lineNumber: number;
  /** numéro de la piste à créer */
  trackNumber: number;
}

/**
 * Résultat de {module:ytparser.parseTrack}
 */
interface ParseTrackResult extends ParseTrackObject {
  /** la piste parsée */
  track: ParsedTrack;
}

interface ParsedTrack {
  title: string;
  performer: string;
  indexes: cuesheet.Index[];
}

const TIME_ZERO = parseTime('0:00');

/**
 *
 * @param snippet video.items[0].snippet dans le JSON d'une vidéo YouTube
 * @param videoUrl $scope.getVideoUrlFromId(videoId)
 * @param contentDetails? video.items[0].contentDetails dans le JSON d'une vidéo YouTube (facultatif)
 * @param options? options
 * @returns {Array}
 */
function newDiscFromVideoSnippet(snippet: GoogleApiYouTubeVideoResource['snippet'], videoUrl: string,
                                 contentDetails?: GoogleApiYouTubeVideoResource['contentDetails'], options?: ParseTrackObject) {
  const description = /*snippet.localized.description ||*/ snippet.description;

  // Recherche des lignes contenant des timecodes
  const lines = description.split(/\n/);

  // Création de la cuesheet
  const disc = new Disc();
  _.extend(disc, {
    title: snippet.title,
    performer: snippet.channelTitle
  });

  console.log('newDiscFromVideo : Parsing de la vidéo : ' + disc.title);

  // Un seul fichier puisqu'une seule vidéo
  const file = disc.newFile();
  _.extend(file, {
    name: videoUrl,
    type: 'MP3'
  });

  // Parsing de la description (cf parsetrack)
  const cueTracks = ytparser.parseTracks(lines, options);
  cueTracks.forEach(cueTrack => {
    const track = file.newTrack();
    _.extend(track, cueTrack);
  });

  // Vérif si on a au moins trouvé une piste
  if (!disc.tracks || !disc.tracks.length) {
    console.error('Vidéo sans tracklist. Tentez votre chance à cette adresse : http://www.regeert.nl/cuesheet/?str='
      + encodeURIComponent(disc.title));
    const error: ErrorWithDisc = new ErrorWithDisc('Aucune piste n\'a été trouvée dans la description de la vidéo'/* : " + description*/);
    error.disc = disc;
    error.name = 'youtube.notracklist';
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

class ErrorWithDisc extends Error {
  disc: Disc;

  constructor(m: string) {
    super(m);
    // Set the prototype explicitly. [https://stackoverflow.com/a/41102306/1655155]
    Object.setPrototypeOf(this, ErrorWithDisc.prototype);
  }
}

/**
 *
 * @param t1 {cuesheet.Time}
 * @param t2 {cuesheet.Time}
 */
function compareTimes(t1, t2) {
  const minDiff = t1.min - t2.min;
  if (minDiff !== 0) {
    return minDiff;
  }
  const secDiff = t1.sec - t2.sec;
  if (secDiff !== 0) {
    return secDiff;
  }
  return t1.frame - t2.frame;
}

// fonction extraite de cue-parser/lib/cue.js
/**
 * Accepte : H:M:S ou M:S
 * @return {cuesheet.Time}
 */
function parseTime(timeSting) {
  const timePattern = /^(?:(\d+):)?(\d+):(\d+)$/,
    parts = timeSting.match(timePattern),
    time = new cuesheet.Time();

  if (!parts) {
    throw new Error('Invalid time format:' + timeSting);
  }

  time.min = (parts[1] ? parts[1] * 60 : 0) + parseInt(parts[2], 10);
  time.sec = parseInt(parts[3], 10);
  time.frame = 0;

  return time;
}
