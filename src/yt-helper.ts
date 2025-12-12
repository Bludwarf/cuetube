// YouTube Helper
// require utils.js
// require yt-parser
import {ytparser} from './yt-parser';
import * as _ from 'underscore';
import * as $ from 'jquery';

export class yth {

  /**
   * @param options cf options Youtube
   */
  static getSrc(vid, origin, options) {
    origin = origin || (location.protocol + '//' + location.host + location.pathname);
    const params = $.extend({
      origin: origin, // origin toujours en premier car tout est placé dans ce paramètre
      feature: 'player_embedded',
      html5: true,
      enablejsapi: 1,
      controls: 0,
      modestbranding: 1,
      showinfo: 0,
      rel: 0,
      autoplay: 0,
      disablekb: 1,
      playsinline: 1,
      widgetid: 2
    }, options);
    return "https://www.youtube.com/embed/" + vid + "?" + $.param(params).replace(/&/g, '&amp;');
  };

  /**
   * Conversion d'une liste de piste en tracklist YouTube
   * @param {[Disc.Track]} tracks
   */
  static getTracklist(tracks) {
    let lines = [];
    tracks.forEach(track => {
      let timecode = yth.getTimecode(track);
      let line = `${timecode} - ${track.title}`;
      if (track.performer) line += ` - ${track.performer}`;
      lines.push(line);
    });
    return lines.join("\n");
  };

  /**
   *
   * @param tracklist {string}
   * @param file {Disc.File}
   * @param [options]
   * @param {boolean} options.artistInTitle comme dans le m3u ?
   * @param {boolean} options.artistBeforeTitle true si l'artiste apparait dans le titre de la chanson
   * @param {boolean} options.containsDuration true si la durée de la piste apparait dans le texte d'entrée
   * @param {boolean} options.durationBeforeTime true si la durée apparait avant le temps de début de la piste
   */
  static setTracklist(tracklist, file, options?) {
    // TODO : clear file.tracks
    const lines = tracklist.split(/\r?\n/);
    const cueTracks = ytparser.parseTracks(lines, options);
    file.removeTracks();
    cueTracks.forEach(cueTrack => {
      const track = file.newTrack();
      _.extend(track, cueTrack);
    });
  };

  /**
   * Conversion d'une liste de piste en tracklist YouTube
   * @param {Disc.Track} track
   */
  static getTimecode(track) {
    return formatHMSS(track.startSeconds);
  };
}
