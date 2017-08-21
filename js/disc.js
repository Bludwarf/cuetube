// Generated by CoffeeScript 1.12.5

/* Pour avoir des property js. Src: https://stackoverflow.com/a/11592890/1655155 */
var Disc;

Function.prototype.property = function(prop, desc) {
  return Object.defineProperty(this.prototype, prop, desc);
};

Function.prototype.propertiesOf = function(targetName, props) {
  var _class, j, len, prop, results;
  results = [];
  for (j = 0, len = props.length; j < len; j++) {
    prop = props[j];
    _class = this;
    results.push((function(prop) {
      return _class.property(prop, {
        get: function() {
          return this[targetName][prop];
        },
        set: function(value) {
          return this[targetName][prop] = value;
        }
      });
    })(prop));
  }
  return results;
};

Disc = (function() {
  function Disc(cuesheet1) {
    var cueFile, i, j, ref;
    this.cuesheet = cuesheet1;
    if (!this.cuesheet) {
      this.cuesheet = new cuesheet.CueSheet();
    }
    this.files = [];
    if (this.cuesheet.files) {
      for (i = j = 0, ref = this.cuesheet.files.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        cueFile = this.cuesheet.files[i];
        this.files.push(new Disc.File(this, i, cueFile));
      }
    }
    this.index = null;
    this.enabled = true;
    this.discId = void 0;
  }

  Disc.propertiesOf('cuesheet', ['title', 'performer', 'rems']);

  Disc.property('id', {
    get: function() {
      return this.videoId;
    }
  });

  Disc.property('videoId', {
    get: function() {
      if (!this.files || !this.files.length) {
        return;
      }
      return this.files[0].videoId;
    }
  });

  Disc.property('tracks', {
    get: function() {
      var tracks;
      tracks = [];
      if (this.files) {
        this.files.forEach(function(file) {
          return tracks = tracks.concat(file.tracks);
        });
      }
      return tracks;
    }
  });

  Disc.property('playable', {
    get: function() {
      if (!this.enabled) {
        return false;
      }
      return _.some(this.tracks, function(track) {
        return track.enabled;
      });
    }
  });

  Disc.property('disabledTracks', {
    get: function() {
      var tracks;
      tracks = [];
      this.tracks.forEach(function(track) {
        if (!track.enabled) {
          return tracks.push(track);
        }
      });
      return tracks;
    }
  });

  Disc.prototype.newFile = function() {
    var cuesheetFile, file;
    this.cuesheet.newFile();
    cuesheetFile = this.cuesheet.getCurrentFile();
    file = new Disc.File(this, this.files.length, cuesheetFile);
    this.files.push(file);
    return file;
  };

  Disc.prototype.toJSON = function() {
    return this.cuesheet;
  };

  Disc.prototype.addRem = function(key, value) {
    if (!this.rems) {
      this.rems = [];
    }
    return this.rems.push(key + " \"" + value + "\"");
  };

  Disc.property('src', {
    set: function(src) {
      return this.addRem("SRC", src);
    }
  });

  return Disc;

})();

Disc.File = (function() {
  function File(disc, index, cuesheetFile1) {
    var cueTrack, i, j, ref;
    this.disc = disc;
    this.index = index;
    this.cuesheetFile = cuesheetFile1;
    if (!this.cuesheetFile) {
      this.cuesheetFile = new cuesheet.File();
    }
    this.tracks = [];
    if (this.cuesheetFile.tracks) {
      for (i = j = 0, ref = this.cuesheetFile.tracks.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        cueTrack = this.cuesheetFile.tracks[i];
        this.tracks.push(new Disc.Track(this, i, cueTrack));
      }
    }
  }

  File.DEFAULT_TYPE = "MP3";

  File.propertiesOf('cuesheetFile', ['name', 'type']);

  File.property('videoId', {
    get: function() {
      return getParameterByName("v", this.name);
    }
  });

  File.prototype.newTrack = function() {
    var cuesheetTrack, track;
    this.disc.cuesheet.newTrack(this.tracks.length + 1, this.DEFAULT_TYPE);
    cuesheetTrack = this.disc.cuesheet.getCurrentTrack();
    track = new Disc.Track(this, this.tracks.length, cuesheetTrack);
    this.tracks.push(track);
    this._tracksInTime = void 0;
    return track;
  };

  File.prototype.getTrackAt = function(time) {
    var j, len, ref, track;
    ref = this.tracks;
    for (j = 0, len = ref.length; j < len; j++) {
      track = ref[j];
      if (time <= track.endSeconds) {
        return track;
      }
    }
    return this.tracks[this.tracks.length - 1];
  };

  File.property('tracksInTime', {
    get: function() {
      if (!this._tracksInTime) {
        this._tracksInTime = [].concat(this.tracks);
        this._tracksInTime.sort(function(t1, t2) {
          return t1.startSeconds - t2.startSeconds;
        });
      }
      return this._tracksInTime;
    }
  });

  return File;

})();

Disc.Track = (function() {
  function Track(file1, index, cuesheetTrack1) {
    this.file = file1;
    this.index = index;
    this.cuesheetTrack = cuesheetTrack1;
    if (!this.cuesheetTrack) {
      this.cuesheetTrack = new cuesheet.Track(void 0, Disc.File.DEFAULT_TYPE);
      _.extend(this.cuesheetTrack, {
        number: this.index + 1
      });
    } else {
      if (this.cuesheetTrack.title !== null && !this.cuesheetTrack.title.trim()) {
        this.cuesheetTrack.title = null;
      }
    }
    this.enabled = this.file.disc.enabled;
  }

  Track.propertiesOf('cuesheetTrack', ['number', 'title', 'indexes', 'performer']);

  Track.property('indexInTime', {
    get: function() {
      var i, j, len, ref, track;
      ref = this.file.tracksInTime;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        track = ref[i];
        if (track === this) {
          return i;
        }
      }
      return -1;
    }
  });

  Track.property('disc', {
    get: function() {
      return this.file.disc;
    }
  });

  Track.property('startSeconds', {
    get: function() {
      var time;
      time = this.indexes[this.indexes.length - 1].time;
      return time.min * 60 + time.sec + time.frame / 75;
    }
  });

  Track.property('endSeconds', {
    get: function() {
      var indexInTime, tracksInTime;
      tracksInTime = this.file.tracksInTime;
      indexInTime = this.indexInTime;
      if (indexInTime + 1 < tracksInTime.length) {
        return tracksInTime[indexInTime + 1].startSeconds;
      } else if (this.file.duration) {
        return this.file.duration;
      } else {
        console.warn("Impossible de connaitre la fin de la piste " + this.number + " sans connaitre la durée de son fichier " + this.file.name);
        return void 0;
      }
    }
  });

  Track.property('next', {
    get: function() {
      var nextFile;
      if (this.index < this.file.tracks.length - 1) {
        return this.file.tracks[this.index + 1];
      } else if (this.file.index < this.file.disc.files.length - 1) {
        nextFile = this.file.disc.files[this.file.index + 1];
        if (nextFile.tracks && nextFile.tracks.length) {
          return nextFile.tracks[0];
        }
      }
      return null;
    }
  });

  return Track;

})();

//# sourceMappingURL=disc.js.map
