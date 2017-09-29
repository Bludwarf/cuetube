(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.CueParser = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {exports: {}};
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {

        }, {}], 2: [function (require, module, exports) {
            /**
             * parse one line of cue sheet, and return COMMAND
             * and all parameters
             */

            module.exports = function (line) {
                var matcher = /^([A-Z]+)\s+(.*)$/,
                    result,
                    command,
                    params;

                line = line.trim();

                result = line.match(matcher);

                if (result) {

                    command = result[1];
                    params = parseParams(result[2]);

                } else {
                    throw new Error('Not a command: ' + line);
                }

                if (!command) {
                    throw new Error('Can not parse command from ' + line);
                }

                if (!params) {
                    throw new Error('Can not parse parameters from ' + line);
                }

                return {
                    command: command,
                    params: params
                };
            };

            function parseParams(lineString) {
                var params = [],
                    quoteIndex;

                if (lineString[0] === '"') {
                    quoteIndex = lineString.indexOf('"', 1);
                    params.push(lineString.substring(1, quoteIndex));
                    lineString = lineString.substring(quoteIndex + 1).trim();
                }

                if (lineString !== '') {
                    params = params.concat(lineString.split(' '));
                }

                return params;
            }
        }, {}], 3: [function (require, module, exports) {
            /**
             * Main library
             */
            var parseCommand = require('./command')
                , CueSheet = require('./cuesheet').CueSheet
                , File = require('./cuesheet').File
                , Index = require('./cuesheet').Index
                , Time = require('./cuesheet').Time;


            var commandMap = {
                'CATALOG': parseCatalog,
                'CDTEXTFILE': parseCdTextFile,
                'FILE': parseFile,
                'FLAGS': parseFlags,
                'INDEX': parseIndex,
                'ISRC': parseIsrc,
                'PERFORMER': parsePerformer,
                'POSTGAP': parsePostgap,
                'PREGAP': parsePregap,
                'REM': parseRem,
                'SONGWRITER': parseSongWriter,
                'TITLE': parseTitle,
                'TRACK': parseTrack
            };

            exports = module.exports;

            /**
             * parse function
             *
             * @param options adjust parser behaviour
             * @property options.autoCreateFile    Allows to parse cuesheet even if it does not have FILE
             */
            exports.parse = function (cuesheetContent, options) {

                var lineParser
                    , cuesheet = new CueSheet()
                    , lines;

                lines = cuesheetContent.replace(/\r\n/, '\n').split('\n');

                // TODO : how to pass options in a clean way ?
                cuesheet.options = options;

                // Get last occurence of commands (line number)
                options.lastOccurrences = {};

                lines.forEach(function (line, lineNumber) {
                    if (!line.match(/^\s*$/)) {
                        lineParser = parseCommand(line);
                        options.lastOccurrences[lineParser.command] = lineNumber;
                        commandMap[lineParser.command](lineParser.params, cuesheet);
                    }
                });

                // TODO : how to pass options in a clean way ?
                delete cuesheet.options;

                return cuesheet;
            };

            /**
             * Allows to parse cuesheet even if it does not have FILE
             * @param value {boolean}
             */
            exports.setAutoCreateFile = function (value) {
                AUTO_CREATE_FILE = value;
            };

            function parseCatalog(params, cuesheet) {
                cuesheet.catalog = params[0];
            }

            function parseCdTextFile(params, cuesheet) {
                cuesheet.cdTextFile = params[0];
            }

            function parseFile(params, cuesheet) {
                var file;

                file = cuesheet.newFile().getCurrentFile();

                file.name = params[0];
                file.type = params[1];
            }

            function parseFlags(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    throw new Error('No track for adding flag: ' + params);
                }

                track.flags = params.slice(0);
            }

            function parseIndex(params, cuesheet) {
                var number = parseInt(params[0], 10)
                    , time = parseTime(params[1])
                    , track = cuesheet.getCurrentTrack();

                if (!track) {
                    throw new Error('No track found for index ' + params);
                }

                if (track.postgap) {
                    throw new Error('POSTGAP should be after all indexes');
                }

                if (number < 0 || number > 99) {
                    throw new Error('Index nubmer must between 0 and 99: ', number);
                }

                if (!track.indexes) {
                    if (number > 2) {
                        throw new Error('Invalid index number ' + number + ', First index number must be 0 or 1');
                    }
                    track.indexes = [];
                } else {
                    if (number !== track.indexes[track.indexes.length - 1].number + 1) {
                        throw new Error('Invalid index number: ' + number + ', it should follow the last sequence');
                    }
                }

                track.indexes.push(new Index(number, time));
            }

            function parseIsrc(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    throw new Error('No track for adding isrc: ' + params);
                }

                track.isrc = params[0];
            }

            function parsePerformer(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    cuesheet.performer = params[0];
                } else {
                    track.performer = params[0];
                }
            }

            function parsePostgap(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    throw new Error('POSTGAP can only used in TRACK');
                }

                if (track.postgap) {
                    throw new Error('only one POSTGAP is allowed for a track');
                }

                track.postgap = parseTime(params[0]);
            }

            function parsePregap(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    throw new Error('PREGAP can only used in TRACK');
                }

                if (track.pregap) {
                    throw new Error('only one PREGAP is allowed for a track');
                }

                if (track.indexes && track.indexes.length > 0) {
                    throw new Error('PREGAP should be before any INDEX');
                }

                track.pregap = parseTime(params[0]);
            }

            function parseRem(params, cuesheet) {

                // Store the remark considering the last occurrence of FILE/TRACK command
                var lastOccurrences = cuesheet.options.lastOccurrences;
                var remTarget;
                if (lastOccurrences && (lastOccurrences['FILE'] || lastOccurrences['TRACK'])) {
                    if (!lastOccurrences['FILE'] || lastOccurrences['FILE'] < lastOccurrences['TRACK']) {
                        remTarget = cuesheet.getCurrentTrack();
                    } else {
                        remTarget = cuesheet.getCurrentFile();
                    }
                } else {
                    remTarget = cuesheet;
                }

                if (!remTarget.rem) {
                    remTarget.rem = [];
                }

                remTarget.rem.push(params.join(' '));
            }

            function parseSongWriter(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    cuesheet.songWriter = params[0];
                } else {
                    track.songWriter = params[0];
                }
            }

            function parseTitle(params, cuesheet) {
                var track = cuesheet.getCurrentTrack();

                if (!track) {
                    cuesheet.title = params[0];
                } else {
                    track.title = params[0];
                }
            }

            function parseTrack(params, cuesheet) {
                var number = parseInt(params[0], 10);
                // Auto create file ?
                if (cuesheet.options && cuesheet.options.autoCreateFile && !cuesheet.getCurrentFile()) {
                    cuesheet.newFile();
                }
                cuesheet.newTrack(number, params[1]);
            }

            function parseTime(timeSting) {
                var timePattern = /^(\d{2,}):(\d{2}):(\d{2})$/,
                    parts = timeSting.match(timePattern),
                    time = new Time();

                if (!parts) {
                    throw new Error('Invalid time format:' + timeSting);
                }

                time.min = parseInt(parts[1], 10);
                time.sec = parseInt(parts[2], 10);
                time.frame = parseInt(parts[3], 10);

                if (time.sec > 59) {
                    throw new Error('Time second should be less than 60: ' + timeSting);
                }

                if (time.frame > 74) {
                    throw new Error('Time frame should be less than 75: ' + timeSting);
                }

                return time;
            }

        }, {"./command": 2, "./cuesheet": 4, "fs": 1}], 4: [function (require, module, exports) {

            module.exports.CueSheet = CueSheet;
            module.exports.File = File;
            module.exports.Track = Track;
            module.exports.Index = Index;
            module.exports.Time = Time;

            function CueSheet() {
                this.catalog = null;
                this.cdTextFile = null;
                this.files = null;
                this.performer = null;
                this.songWriter = null;
                this.title = null;
                this.rems = null;
            }

            function File() {
                this.name = null;
                this.type = null;
                this.tracks = null;
            }

            function Track(number, type) {
                this.number = (number === undefined ? null : number);
                this.type = (type || null);
                this.title = null;
                this.flags = null;
                this.isrc = null;
                this.performer = null;
                this.songWriter = null;
                this.pregap = null;
                this.postgap = null;
                this.indexes = null;
            }

            function Index(number, time) {
                this.number = (number === undefined ? null : number);
                this.time = (time || null);
            }

            function Time(min, sec, frame) {
                this.min = min || 0;
                this.sec = sec || 0;
                this.frame = frame || 0;
            }

            CueSheet.prototype.getCurrentFile = function () {
                if (this.files && this.files.length > 0) {
                    return this.files[this.files.length - 1];
                } else {
                    return null;
                }
            }

            CueSheet.prototype.getCurrentTrack = function () {
                var file = this.getCurrentFile();

                if (file && file.tracks && file.tracks.length > 0) {
                    return file.tracks[file.tracks.length - 1];
                } else {
                    return null;
                }
            };

            CueSheet.prototype.newFile = function () {
                if (!this.files) {
                    this.files = [];
                }

                this.files.push(new File());

                return this;
            };

            CueSheet.prototype.newTrack = function (number, type) {
                var file = this.getCurrentFile();

                if (!file) {
                    throw new Error('No file for track: ' + number + type);
                }

                if (!file.tracks) {
                    file.tracks = [];
                }

                file.tracks.push(new Track(number, type));

                return this;
            };
        }, {}]
    }, {}, [3])(3)
});