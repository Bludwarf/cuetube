// YouTube Helper
// require utils.js
const yth = (function() {
  const yth = {};

  /**
   * @param options cf options Youtube
   */
  yth.getSrc = function(vid, origin, options) {
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
  yth.getTracklist = function(tracks) {
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
   * Conversion d'une liste de piste en tracklist YouTube
   * @param {Disc.Track} track
   */
  yth.getTimecode = function(track) {
    return formatHMSS(track.startSeconds);
  };

  return yth;
})();