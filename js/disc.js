/**
 * Created by mlavigne on 22/08/2017.
 */
/// <reference path="@types/cuesheet.d.ts" />
var Disc = (function () {
    function Disc(srcCuesheet) {
        this.files = [];
        this.index = undefined;
        /** pour choisir les vidéos à lire */
        this.enabled = true;
        this.cuesheet = srcCuesheet;
        if (!srcCuesheet) {
            this.cuesheet = new cuesheet.CueSheet();
        }
        if (this.cuesheet.files) {
            for (var i = 0; i < srcCuesheet.files.length; ++i) {
                var cueFile = this.cuesheet.files[i];
                this.files.push(new Disc.File(this, i, cueFile));
            }
        }
    }
    Object.defineProperty(Disc.prototype, "title", {
        get: function () {
            return this.cuesheet.title;
        },
        set: function (value) {
            this.cuesheet.title = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "performer", {
        get: function () {
            return this.cuesheet.performer;
        },
        set: function (value) {
            this.cuesheet.performer = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "rems", {
        get: function () {
            return this.cuesheet.rems;
        },
        set: function (value) {
            this.cuesheet.rems = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "id", {
        get: function () {
            return this._id ? this._id : this.videoId;
        },
        set: function (value) {
            this._id = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "videoId", {
        get: function () {
            if (!this.files || !this.files.length)
                return undefined;
            return this.files[0].videoId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "tracks", {
        get: function () {
            var tracks = [];
            if (this.files) {
                this.files.forEach(function (file) {
                    tracks = tracks.concat(file.tracks);
                });
            }
            return tracks;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "playable", {
        get: function () {
            if (!this.enabled)
                return false;
            // au moins un track.enabled
            return _.some(this.tracks, function (track) { return track.enabled; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Disc.prototype, "disabledTracks", {
        get: function () {
            var tracks = [];
            this.tracks.forEach(function (track) {
                if (!track.enabled)
                    tracks.push(track);
            });
            return tracks;
        },
        enumerable: true,
        configurable: true
    });
    Disc.prototype.newFile = function () {
        this.cuesheet.newFile();
        var cuesheetFile = this.cuesheet.getCurrentFile();
        var file = new Disc.File(this, this.files.length, cuesheetFile);
        this.files.push(file);
        return file;
    };
    // TODO : Pour éviter le problème : TypeError: Converting circular structure to JSON
    //noinspection JSUnusedGlobalSymbols
    Disc.prototype.toJSON = function () {
        return this.cuesheet;
    };
    Disc.prototype.setRem = function (key, value) {
        this.rems = this.rems || [];
        // Suppr ancien REM pour cette key
        this.rems = this.rems.filter(function (rem) { return rem.indexOf(key + " ") != 0; });
        this.rems.push(key + " \"" + value + "\"");
    };
    Disc.prototype.getRem = function (key) {
        if (!this.rems)
            return undefined;
        var rem = this.rems.find(function (aRem) { return aRem.indexOf(key + " ") == 0; });
        if (!rem)
            return undefined;
        var value = rem.slice(key.length + 1);
        if (value.startsWith("\"") && value.endsWith("\""))
            value = value.slice(1, -1);
        return value;
    };
    Object.defineProperty(Disc.prototype, "src", {
        get: function () {
            return this.getRem("SRC"); // TODO si NULL et vidéo multipiste alors calculer l'URL YouTube à partir de l'id du disque
        },
        set: function (src) {
            this.setRem("SRC", src);
        },
        enumerable: true,
        configurable: true
    });
    return Disc;
}());
(function (Disc) {
    var File = (function () {
        function File(disc, index, cuesheetFile) {
            this.disc = disc;
            this.index = index;
            this.cuesheetFile = cuesheetFile;
            this.tracks = []; // TODO devrait être en lecture seule
            this._tracksInTime = undefined; // cache pour tracksInTime
            if (!this.cuesheetFile) {
                this.cuesheetFile = new cuesheet.File();
            }
            if (this.cuesheetFile.tracks) {
                for (var i = 0; i < this.cuesheetFile.tracks.length; ++i) {
                    var cueTrack = this.cuesheetFile.tracks[i];
                    this.tracks.push(new Disc.Track(this, i, cueTrack));
                }
            }
        }
        Object.defineProperty(File.prototype, "name", {
            get: function () {
                return this.cuesheetFile.name;
            },
            set: function (value) {
                this.cuesheetFile.name = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(File.prototype, "type", {
            get: function () {
                return this.cuesheetFile.type;
            },
            set: function (value) {
                this.cuesheetFile.type = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(File.prototype, "videoId", {
            get: function () {
                return getParameterByName("v", this.name);
            },
            enumerable: true,
            configurable: true
        });
        File.prototype.newTrack = function () {
            this.disc.cuesheet.newTrack(this.tracks.length + 1, File.DEFAULT_TYPE);
            var cuesheetTrack = this.disc.cuesheet.getCurrentTrack();
            var track = new Disc.Track(this, this.tracks.length, cuesheetTrack);
            this.tracks.push(track);
            this._tracksInTime = undefined; // RAZ du cache pour tracksInTime
            return track;
        };
        /**
         * Par défaut : 1ère si avant disque, dernière si après
         * @param time
         * @return {Track}
         */
        File.prototype.getTrackAt = function (time) {
            for (var _i = 0, _a = this.tracks; _i < _a.length; _i++) {
                var track = _a[_i];
                if (time <= track.endSeconds)
                    return track;
            }
            return this.tracks[this.tracks.length - 1];
        };
        Object.defineProperty(File.prototype, "tracksInTime", {
            /**
             * Les pistes ne sont pas toujours triées dans l'ordre chronologique
             */
            get: function () {
                if (!this._tracksInTime) {
                    return this._tracksInTime = [].concat(this.tracks);
                }
                this._tracksInTime.sort(function (t1, t2) { return t1.startSeconds - t2.startSeconds; });
                return this._tracksInTime;
            },
            enumerable: true,
            configurable: true
        });
        return File;
    }());
    File.DEFAULT_TYPE = "MP3";
    Disc.File = File;
    var Track = (function () {
        function Track(file, index, cuesheetTrack) {
            this.file = file;
            this.index = index;
            this.cuesheetTrack = cuesheetTrack;
            if (!this.cuesheetTrack) {
                this.cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE); // number doit être setté manuellement
                _.extend(this.cuesheetTrack, {
                    number: this.index + 1
                });
            }
            else {
                // Clean du title si vide pour avoir "Track #" par défaut
                if (this.cuesheetTrack.title != null && !this.cuesheetTrack.title.trim()) {
                    this.cuesheetTrack.title = null;
                }
            }
            this.enabled = this.file.disc.enabled;
        }
        Object.defineProperty(Track.prototype, "number", {
            get: function () {
                return this.cuesheetTrack.number;
            },
            set: function (value) {
                this.cuesheetTrack.number = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "title", {
            get: function () {
                return this.cuesheetTrack.title;
            },
            set: function (value) {
                this.cuesheetTrack.title = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "indexes", {
            get: function () {
                return this.cuesheetTrack.indexes;
            },
            set: function (value) {
                this.cuesheetTrack.indexes = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "performer", {
            get: function () {
                return this.cuesheetTrack.performer;
            },
            set: function (value) {
                this.cuesheetTrack.performer = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "indexInTime", {
            get: function () {
                for (var i = 0; i < this.file.tracksInTime.length; ++i) {
                    var track = this.file.tracksInTime[i];
                    if (track == this) {
                        return i;
                    }
                }
                return -1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "disc", {
            get: function () {
                return this.file.disc;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "startSeconds", {
            get: function () {
                var time = this.indexes[this.indexes.length - 1].time;
                return time.min * 60 + time.sec + time.frame / 75;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "endSeconds", {
            get: function () {
                var tracksInTime = this.file.tracksInTime;
                var indexInTime = this.indexInTime;
                if (indexInTime + 1 < tracksInTime.length) {
                    return tracksInTime[indexInTime + 1].startSeconds; // TODO perf OK tracks => tracksInTime ?
                }
                else if (this.file.duration) {
                    return this.file.duration;
                }
                else {
                    // auto apprentissage de la durée du fichier par : $scope.$on("video started")...
                    console.warn("Impossible de connaitre la fin de la piste #{this.number} sans connaitre la durée de son fichier #{this.file.name}");
                    return undefined;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Track.prototype, "next", {
            get: function () {
                // Même fichier ?
                if (this.index < this.file.tracks.length - 1)
                    return this.file.tracks[this.index + 1];
                else if (this.file.index < this.file.disc.files.length - 1) {
                    var nextFile = this.file.disc.files[this.file.index + 1];
                    if (nextFile.tracks && nextFile.tracks.length)
                        return nextFile.tracks[0];
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        return Track;
    }());
    Disc.Track = Track;
})(Disc || (Disc = {}));
