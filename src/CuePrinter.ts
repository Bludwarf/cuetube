/** Using same format than MusicBrainz Picard */

///<reference path='@types/utils.d.ts'/>
// require("./utils");

// FIXME : comment importer utils.js dans le CuePrinter (client) quand on est dans CueService (serveur) ?
function pad2(i: any) {
    if (!i) {
      return '00';
    }
    return (i < 10 ? '0' : '') + i;
}

export class CuePrinter {
    // TODO avoir la version courante en page statique (purement client)
    /**
     * Attention on remplace ou ajoute un commentaire pour indique la date de génération par CueTube
     * @param {cuesheet.CueSheet} cue
     * @param {{version: string}} packageInfos
     * @return {string}
     */
    static print(cue: cuesheet.CueSheet, packageInfos = {version: '*.*.*'}): string {

        // Ajout ou remplacement de la date de génération du fichier (#85)
        const genComment = `COMMENT "Generated by cuetube ${packageInfos.version} - ${new Date()}"`;
        let genCommentIndex = -1;
        if (cue.rem) {
            genCommentIndex = cue.rem.findIndex(rem => rem.indexOf('Generated by cuetube ') !== -1);
        } else {
            cue.rem = [];
        }
        if (genCommentIndex !== -1) {
            cue.rem[genCommentIndex] = genComment;
        } else {
            cue.rem.push(genComment);
        }

        const PAD = '  ';
        const EOL = '\n';

        let data = '';

        if (cue.performer) { data += 'PERFORMER ' + stringValue(cue.performer) + '' + EOL; }
        data += 'TITLE "' + cue.title + '"' + EOL;
        // FIXME : le format exact doit être 'REM IDENTIFIANT_SANS_ESPACE VALEUR AVEC ESPACE'
        if (cue.rem) {
            cue.rem.forEach(rem => {
                data += 'REM ' + rem + EOL;
            });
        }

        // files
        if (cue.files) {
            for (let f = 0; f < cue.files.length; ++f) {
                const file = cue.files[f];

                if (file.name) {
                    data += 'FILE "' + file.name + '" ' + (file.type || 'MP3') + EOL;
                }

                for (let t = 0; t < file.tracks.length; ++t) {
                    const track = file.tracks[t];
                    data += PAD + 'TRACK ' + pad2(track.number) + ' ' + (track.type || 'AUDIO') + EOL;

                    // performer
                    if (track.performer) {
                        data += PAD + 'PERFORMER ' + stringValue(track.performer) + EOL;
                    }

                    if (track.title) {
                        data += PAD + PAD + 'TITLE ' + stringValue(track.title) + EOL;
                    }

                    if (track.rem) {
                        track.rem.forEach(rem => {
                            data += PAD + 'REM ' + rem + EOL;
                        });
                    }

                    for (let i = 0; i < track.indexes.length; ++i) {
                        const index = track.indexes[i];
                        const time = index.time;
                        const timecode = pad2(time.min) + ':' + pad2(time.sec) + ':' + pad2(time.frame);
                        data += PAD + PAD + 'INDEX ' + pad2(index.number) + ' ' + timecode + EOL;
                    }
                }
            }
        }

        return data;
    }
}

/**
 * @param {string} string
 * @return {string} la chaîne string entre quotes si elle contient des espaces (ou assimilé)
 */
function stringValue(string: string): string {
    if (string.match(/\s/)) { return `"${string}"`; }
    return string;
}
