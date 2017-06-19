var path = require("path");
var fs = require('fs');
var converter = require("../maquette/m3u-convert");
var package = require("../package.json");

var root = path.resolve(__dirname, "..");
var dir = root + "/client/cues/";

function pad2(i) {
    return (i < 10 ? "0" : "") + i;
}

function createTrack(number, title, min, sec) {
    console.log("min="+min);
    return {
        number: number,
        type: "AUDIO",
        title: title,
        indexes: [{
            number: 1,
            time: {
                min: min,
                sec: sec,
                frame: Math.round((sec % 1)*75) // frame = 1/75 de sec
            }/*,
            get index() {
                return pad2(this.time.min) + ":" + pad2(this.time.sec) + ":" + pad2(this.time.frame); // TODO : INDEX 00:00:FRAME
            }*/
        }]/*,
        time: time.min * 60 + time.sec, // TODO : frame en secondes
        */
    };
}

function saveJsonCue(cue, jsonFile) {
    return fs.writeFile(jsonFile, JSON.stringify(cue, null, 4), function(err) {
        if (err) return console.error("Impossible d'écrire le fichier "+jsonFile+" : "+err.message);
        console.log("Fichier "+jsonFile+" sauvegardé");
    });
}

/** Objets CueSheet parsés, rangés par cueName */
var cueSheets = {};

module.exports = {
    
    /**
     * @param cueName avec extension ".cue" : exemple "Dg0IjOzopYU.cue"
     * = extractTracks() sans recréer le fichier JSON
     * @param cb {function(Error, CueSheet)}
     */
    getCue: function(cueName, options, cb) {
        
        // CueSheet déjà en mémoire ?
        if (cueSheets[cueName])
            return cb(null, cueSheets[cueName]);
        
        // Si un fichier cue existe on l'utilise
        var cueFile = dir + cueName;
        try {
            fs.access(cueFile, fs.R_OK, (err) => {
                if (!err) 
                    return this.parseCueFile(cueFile, (err, cue) => {
                        if (err) return cb(err);
                        cb(null, cue);
                        
                        // On sauvegarde l'objet pour plus tard
                        cueSheets[cueName] = cue;
                    });
                
                // fichier cue non existant
                // création
                var cueTxtFile = dir + cueName + ".txt";
                console.info("Extraction des pistes depuis le fichier " + cueTxtFile + "...");
                this.extractTracks(cueTxtFile, (err, tracks) => {
                    if (err) return cb(err);
                    var cue = {
                      title: options.title,
                      performer: options.performer,
                      files: [{
                          name: options.file,
                          type: options.type,
                          tracks: tracks
                      }]
                    };
                    cb(null, cue);
                    
                    // On sauvegarde l'objet cue pour plus tard
                    cueSheets[cueName] = cue;
                    
                    // Sauvegarde du fichier cue
                    console.log("Création du fichier cue "+cueFile+" ...");
                    this.writeCueFile(cueFile, cue, (err) => {
                        if (err) console.error("Erreur d'écriture du fichier "+cueFile+ " : "+err.message);
                        else console.log("Fichier "+cueFile+ " créé");
                    });
                });
            });
        } 
        catch (err) {
            cb(err);
        }
    },
    
    parseCueFile: function(cueFile, cb) {
        console.log("Parsing de la cuesheet " + cueFile);
        
        try {
            /**
             * Exemple de parsing 
             * 
             * CueSheet {
                  catalog: null,
                  cdTextFile: null,
                  files: 
                   [ File {
                       name: 'https://www.youtube.com/watch?v=Dg0IjOzopYU',
                       type: 'MP3',
                       tracks: [Object] } ],
                  performer: 'Luigi',
                  songWriter: null,
                  title: 'Minecraft FULL SOUNDTRACK (2016)',
                  rems: null }
            */
            /**
             * Track {
                number: 28,
                type: 'AUDIO',
                title: '- End',
                flags: null,
                isrc: null,
                performer: null,
                songWriter: null,
                pregap: null,
                postgap: null,
                indexes: [ [Object] ] }
             */
             /**
              * Index { number: 1, time: Time { min: 0, sec: 0, frame: 0 } }
              */
             // "spec" : http://wiki.hydrogenaud.io/index.php?title=Cue_sheet
            const parser = require('cue-parser'); // https://www.npmjs.com/package/cue-parser
            
            var cuesheet = parser.parse(cueFile);
            /*fs.writeFile(root + '/samples/cue-parser/cuesheet1.json', JSON.stringify(cuesheet, null, 4), (err) => {
                console.log("error write parsed : "+err);
            });
            var cue = {
                title: cuesheet.title,
                performer: cuesheet.performer,
                file: {
                    path: cuesheet.files[0].name,
                    type: cuesheet.files[0].type
                },
                tracks: (function convertTracks(pTracks) {
                    var tracks = [];
                    pTracks.forEach(function(pTrack) {
                        var time = pTrack.indexes[0].time;
                        tracks.push(createTrack(pTrack.title, time));
                    });
                    return tracks;
                })(cuesheet.files[0].tracks)
            };*/
            
            cb(null, cuesheet);
        }
        catch (e) {
            cb(e);
        }
    },
    
    writeCueFile: function(cueFile, cue, cb) {
        if (!cue.title) return cb(new Error("Impossible de créer une cuesheet sans title"));
        console.info("CueService#writeCueFile : création de la cuesheet "+cue.title);
        var PAD = "  ";
        var EOL = "\n";
        
        var data = "REM COMMENT Generated by cuetube "+package.version+" - " + new Date() + EOL;
        data += "TITLE \""+cue.title+"\""+EOL;
        if (cue.performer) data += "PERFORMER \""+cue.performer+"\""+EOL;
        
        // files
        for (var f = 0; f < cue.files.length; ++f) {
            var file = cue.files[f];
            
            data += "FILE \""+file.name+"\" "+file.type+EOL;
            
            for (var t = 0; t < file.tracks.length; ++t) {
                var track = file.tracks[t];
                data += PAD+"TRACK "+pad2(track.number)+" "+track.type+EOL;
                if (track.title) data += PAD+PAD+"TITLE \""+track.title+"\""+EOL;

                // performer
                if (track.performer) {
                    data += PAD+"PERFORMER "+track.performer+EOL;
                }
                
                for (var i = 0; i < track.indexes.length; ++i) {
                    var index = track.indexes[i];
                    var time = index.time;
                    var timecode = pad2(time.min) + ":" + pad2(time.sec) + ":" + pad2(time.frame);
                    data += PAD+PAD+"INDEX "+pad2(index.number)+" "+timecode+EOL;
                }
            }
        }

        // cache
        cueSheets[path.basename(cueFile)] = cue;
        
        fs.writeFile(cueFile, data, 'utf-8', (err) => {
            if (err)
                console.error("CueService#writeCueFile : KO");
            else
                console.info("CueService#writeCueFile : OK");
            return cb(err);
        });
    },
    
    /**
     * Conversion fichier .cue.txt en liste de tracks JSON
     * @param cb {function(Error, track[])}
     */
    extractTracks: function(cueTxtFile, cb) {
        fs.readFile(cueTxtFile, 'utf-8', function(err, input) {
        	if (err) return cb(err);
        
            // Parseur
            var lines = input.split("\n");
            var tracks = [];
            var number = 0;
            lines.forEach(function(line) {
                
                // On recherche n'importe où une info sur le temps
                var drx = /\d+(?::\d+)+/;
                var mid = drx.exec(line);
                var timeStr = mid[0];
                
                var times = timeStr.split(":");
                var hours = 0, mins, secs;
                if (times.length == 3) {
                    hours = times[0] * 1;
                    mins = times[1] * 1;
                    secs = times[2] * 1;
                } else {
                    mins = times[0] * 1;
                    secs = times[1] * 1;
                }
                
                ++number;
                console.log("times:"+times);
                var track = createTrack(number, line.replace(mid, "").trim(), hours * 60 + mins, secs);
                tracks.push(track);
            });
            
            cb(null, tracks);
        });
    },
    
    /**
     * @param name : exemple "minecraft.cue"
     * @param cb : function(Error, targetFile)
     */
    getCueFile: function(cueName, options, cb) {
        var targetFile = dir + cueName;
        
        // Fichier déjà existant ?
        fs.access(targetFile, fs.R_OK, (err) => {
            if (!err) return cb(null, targetFile);
        
            this.getCue(cueName, options, function(err, cue) {
                if (err) return cb(err);
                
                console.info("Génération du fichier " + targetFile + "...");
                // Formatteur
                var cueFileContent = 'TITLE "' + cue.title + '"\n'
                    + 'PERFORMER "'+cue.performer+'"\n'
                    + 'FILE "'+cue.file.path+'" '+cue.file.type+'\n'
                    
                var tracks = cue.tracks;
                for (var i = 0; i < tracks.length; ++i) {
                    var track = tracks[i];
                    var number = (i < 10 ? "0" : "") + (i+1);
                    cueFileContent += "  TRACK "+number+" AUDIO\n"
                        + '    TITLE "'+track.title+'"\n'
                        + '    INDEX 01 '+track.index + '\n';
                }
                
                fs.writeFile(targetFile, cueFileContent, function(err) {
                    if (err) return cb(err);
                    return cb(null, targetFile);
                })
            })
        });
        
    },
    
    /**
     * @param time {number}
     * @param track {track[]}
     * @return la piste (track) courante quand on se trouve à l'instant 'time'
     */
    getTrackIndex: function(time, tracks) {
        var last = tracks[tracks.length - 1];
        if (time >= last.time) return tracks.length - 1;
    
        for (var i = 0; i < tracks.length; ++i) {
            var track = tracks[i];
            if (time < track.time) return i - 1;
        }
        return -1;
    },
    
    // TODO : faire un getter
    getTrackTimeSeconds: function(track) {
        var time = track.indexes[track.indexes.length - 1].time;
        return time.min * 60 + time.sec + time.frame * .75;
    },
    
    reload: function() {
        cueSheets = {};
        console.log("CueService rechargé");
    },
    
    /**
     * Cherche tous les id de disques en listant tous les fichiers /client/cues/*.cue
     */
    getDiscsIds: function(cb) {
        fs.readdir(dir, (err, files) => {
            if (err) return cb(err);
            
            var discsIds = [];
            for (var i = 0; i < files.length; ++i) {
                var file = files[i];
                if (file.match(/\.cue$/i)) {
                    discsIds.push(file.slice(0, -4));
                }
            }
            
            cb(null, discsIds);
        });
    }
}