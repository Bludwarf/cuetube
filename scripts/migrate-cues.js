const path = require("path");
const fs = require('fs');
const mkdirp = require('mkdirp');
// const CueService = require('../services/CueService');

const root = path.resolve(__dirname, "..");
const dir = "C:\\Users\\m.lavigne\\Desktop\\Disques-20260115T080945Z-1-001\\Disques";
const moveMode = true;

// On prend tous les fichiers cue à la racine et on les met dans des dossiers comme cuetube-cues
fs.readdir(dir, (err, filenames) => {
    filenames.forEach(filename => {
        const src = path.join(dir, filename);
        if (src.endsWith(".cue")) {
            const outDir = path.join(dir, encode(filename[0]), encode(filename[1]), encode(filename[2]));
            const dest = CueServiceGetPath(filename);
            mkdirp.sync(outDir);

            if (moveMode) {
                fs.renameSync(src, dest)
            } else {
                fs.createReadStream(src).pipe(fs.createWriteStream(dest));
            }

            const actionName = moveMode ? 'déplacé' : 'copié';
            console.log(`${src} ${actionName} vers ${dest}`);
        }
    });
});

// TODO : pour éviter d'avoir à corriger les dépendances de la source : services/CueService.js
function CueServiceGetPath(filename) {
    const outDir = path.join(dir, encode(filename[0]), encode(filename[1]), encode(filename[2]));
    return path.join(outDir, filename);
}

function encode(char) {
    return char.toUpperCase();
}
