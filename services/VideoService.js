const querystring = require("querystring");
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, "..");
const dir = root + "/client/youtube/";

const CueService = require("./CueService");

function pad2(i) {
    return (i < 10 ? "0" : "") + i;
}

module.exports = {
    
    /**
     * FIXME : à revoir : trop compliqué
     * @param cue : cf CueService#getCue()
     */
    createVideo: function(name, author, duration, cue) {
        return {
          // TODO : title/name: "Minecraft FULL SOUNDTRACK (2016)"
          title: cue.title || name,
          name: cue.title || name,
          author: cue.performer || author,
          url: cue.files[0].name,
          videoId: this.getVideoIdFromUrl(cue.files[0].name),
          cues: this.tracksToCues(duration*1, this.getTracks(cue)),
            files: cue.files
        };
    },

    getTracks: function(cue) {
        var tracks = [];
        cue.files.forEach(function(file) {
            tracks = tracks.concat(file.tracks);
        });
        return tracks;
    },
    
    /**
     * @param url : exemple : https://www.youtube.com/watch?v=Dg0IjOzopYU
     */
    getVideoIdFromUrl: function(url) {
        var i = url.indexOf('?');
        if (i === -1) return undefined;
        var query = querystring.decode(url.substr(i+1));
        return query.v;
    },
    
    tracksToCues: function(totalDuration, tracks) {
        var cues = [];
        
        for (var i = 0; i < tracks.length; ++i) {
            var track = tracks[i];
            var time = track.indexes[0].time;
            cues.push({
                name: track.title,
                //timeCode: this.getTimeCode(track),
                startSeconds: CueService.getTrackTimeSeconds(track), // FIXME : attention on peut avoir des pregap
                endSeconds: (i+1 < tracks.length ? CueService.getTrackTimeSeconds(tracks[i+1]) : totalDuration)
            });
        }
        
        return cues;
    },
    
    getTimeCode: function(track) {
        var hours = Math.floor(track.time / 3600);
        var mins = Math.floor((track.time % 3600) / 60);
        var secs = Math.floor(track.time % 60);
        
        var timeCode = "";
        if (hours) timeCode += hours + ":";
        timeCode += (timeCode ? pad2(mins) : mins) + ":" + pad2(secs);
        
        return timeCode
    },
    
    /**
     * @param youtubeMetadata {Object} : structure comme dans /client/youtube/*.json, cf https://developers.google.com/youtube/v3/docs/videos
     */
    createVideoFiles: function(videoId, youtubeMetadata, cb) {
        
        // Création du fichier youtube
        var youtubeFile = dir + videoId + ".json";
        fs.writeFile(youtubeFile, JSON.stringify(youtubeMetadata, null, 4), 'utf-8', (err) => {
            if (err) return cb(err);
            
            // Création du fichier cue si besoin
            // TODO
            return cb(null);
        })
    },
    
    reload: function() {
        // NOP
    }
}