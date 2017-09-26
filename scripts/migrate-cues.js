const path = require("path");
const fs = require('fs');
const mkdirp = require('mkdirp');

const root = path.resolve(__dirname, "..");
const dir = root + "/client/cues/";

// On prend tous les fichiers cue à la racine et on les met dans des dossiers comme cuetube-cues
fs.readdir(dir, (err, filenames) => {
    filenames.forEach(filename => {
        const src = path.join(dir, filename);
        const outDir = path.join(dir, encode(filename[0]), encode(filename[1]), encode(filename[2]));
        const dest = path.join(outDir, filename);
        mkdirp.sync(outDir);
        fs.createReadStream(src).pipe(fs.createWriteStream(dest));
        console.log(`${src} copié vers ${dest}`);
    });
});

function encode(char) {
    return char.toUpperCase();
}