const path = require("path");
const fs = require('fs');
const converter = require("../maquette/m3u-convert");
const packageInfos = require("../package.json");

const root = path.resolve(__dirname, "..");
const dir = root + "/client/cues/";

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
let cueSheets = {};

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
        const cueFile = dir + cueName;
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
                const cueTxtFile = dir + cueName + ".txt";
                console.info("Extraction des pistes depuis le fichier " + cueTxtFile + "...");
                this.extractTracks(cueTxtFile, (err, tracks) => {
                    if (err) return cb(err);
                    const cue = {
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
                  rem: null }
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
            const cue = {
                title: cuesheet.title,
                performer: cuesheet.performer,
                file: {
                    path: cuesheet.files[0].name,
                    type: cuesheet.files[0].type
                },
                tracks: (function convertTracks(pTracks) {
                    const tracks = [];
                    pTracks.forEach(function(pTrack) {
                        const time = pTrack.indexes[0].time;
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

  /**
   *
   * @param cueFile
   * @param cue {cuesheet.CueSheet}
   * @param cb
   * @return {*}
   */
    writeCueFile: function(cueFile, cue, cb) {
        if (!cue.title) return cb(new Error("Impossible de créer une cuesheet sans title"));
        console.info("CueService#writeCueFile : création de la cuesheet "+cue.title);
        const PAD = "  ";
        const EOL = "\n";
        
        let data = "REM COMMENT \"Generated by cuetube "+packageInfos.version+" - " + new Date() + "\"" + EOL;
        data += "TITLE \""+cue.title+"\""+EOL;
        if (cue.rem) {
            cue.rem.forEach(rem => {
              data += "REM "+rem+EOL;
            });
        }
        if (cue.performer) data += "PERFORMER \""+cue.performer+"\""+EOL;
        
        // files
        for (let f = 0; f < cue.files.length; ++f) {
            const file = cue.files[f];
            
            data += "FILE \""+file.name+"\" "+file.type+EOL;

            for (let t = 0; t < file.tracks.length; ++t) {
                const track = file.tracks[t];
                data += PAD+"TRACK "+pad2(track.number)+" "+track.type+EOL;
                if (track.title) data += PAD+PAD+"TITLE \""+track.title+"\""+EOL;

                // performer
                if (track.performer) {
                    data += PAD+"PERFORMER "+track.performer+EOL;
                }
                
                for (let i = 0; i < track.indexes.length; ++i) {
                    const index = track.indexes[i];
                    const time = index.time;
                    const timecode = pad2(time.min) + ":" + pad2(time.sec) + ":" + pad2(time.frame);
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
            const lines = input.split("\n");
            const tracks = [];
            let number = 0;
            lines.forEach(function(line) {
                
                // On recherche n'importe où une info sur le temps
                const drx = /\d+(?::\d+)+/;
                const mid = drx.exec(line);
                const timeStr = mid[0];
                
                const times = timeStr.split(":");
                let hours = 0, mins, secs;
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
                const track = createTrack(number, line.replace(mid, "").trim(), hours * 60 + mins, secs);
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
        const targetFile = dir + cueName;
        
        // Fichier déjà existant ?
        fs.access(targetFile, fs.R_OK, (err) => {
            if (!err) return cb(null, targetFile);
        
            this.getCue(cueName, options, function(err, cue) {
                if (err) return cb(err);
                
                console.info("Génération du fichier " + targetFile + "...");
                // Formatteur
                let cueFileContent = 'TITLE "' + cue.title + '"\n'
                    + 'PERFORMER "'+cue.performer+'"\n'
                    + 'FILE "'+cue.file.path+'" '+cue.file.type+'\n'
                    
                const tracks = cue.tracks;
                for (let i = 0; i < tracks.length; ++i) {
                    const track = tracks[i];
                    const number = (i < 10 ? "0" : "") + (i+1);
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
        const last = tracks[tracks.length - 1];
        if (time >= last.time) return tracks.length - 1;
    
        for (let i = 0; i < tracks.length; ++i) {
            const track = tracks[i];
            if (time < track.time) return i - 1;
        }
        return -1;
    },
    
    // TODO : faire un getter
    getTrackTimeSeconds: function(track) {
        const time = track.indexes[track.indexes.length - 1].time;
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
            
            const discsIds = [];
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                if (file.match(/\.cue$/i)) {
                    discsIds.push(file.slice(0, -4));
                }
            }
            
            cb(null, discsIds);
        });
    }
}