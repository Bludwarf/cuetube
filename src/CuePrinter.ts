/** Using same format than MusicBrainz Picard */

class CuePrinter {
    static print(cue: cuesheet.CueSheet): string {
        const PAD = "  ";
        const EOL = "\n";

        let data = "";

        if (cue.performer) data += "PERFORMER "+stringValue(cue.performer)+""+EOL;
        data += "TITLE \""+cue.title+"\""+EOL;
        // FIXME : le format exact doit être 'REM IDENTIFIANT_SANS_ESPACE VALEUR AVEC ESPACE'
        if (cue.rem) {
            cue.rem.forEach(rem => {
                data += "REM "+rem+EOL;
            });
        }

        // files
        for (let f = 0; f < cue.files.length; ++f) {
            const file = cue.files[f];

            if (file.name) {
                data += "FILE \"" + file.name + "\" " + (file.type || 'MP3') + EOL;
            }

            for (let t = 0; t < file.tracks.length; ++t) {
                const track = file.tracks[t];
                data += PAD+"TRACK "+pad2(track.number)+" "+(track.type||'AUDIO')+EOL;

                // performer
                if (track.performer) {
                    data += PAD+"PERFORMER "+stringValue(track.performer)+EOL;
                }

                if (track.title) data += PAD+PAD+"TITLE "+stringValue(track.title)+EOL;

                if (track.rem) {
                    track.rem.forEach(rem => {
                        data += PAD+"REM "+rem+EOL;
                    });
                }

                for (let i = 0; i < track.indexes.length; ++i) {
                    const index = track.indexes[i];
                    const time = index.time;
                    const timecode = pad2(time.min) + ":" + pad2(time.sec) + ":" + pad2(time.frame);
                    data += PAD+PAD+"INDEX "+pad2(index.number)+" "+timecode+EOL;
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
    if (string.match(/\s/)) return `"${string}"`;
    return string;
}