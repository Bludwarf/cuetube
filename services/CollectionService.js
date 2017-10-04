const path = require("path");
const fs = require('fs');

const root = path.resolve(__dirname, "..");
const dir = root + "/client/collections/";

module.exports = {
    getDiscsIds: function(collectionId, cb) {
        collectionId = collectionId.toLowerCase();
        const collectionFile = path.resolve(dir, collectionId + '.cues');
        fs.readFile(collectionFile, 'utf-8', (err, collectionContent) => {
            if (err) return cb(err);
            const lines = collectionContent.split(/\r?\n/);
            const nonEmptyLines = [];
            lines.forEach(function(line) {
                if (line.trim()) nonEmptyLines.push(line);
            });
            cb(null, nonEmptyLines);
        })
    },
    
    /**
     * Cherche tous les id de collections en listant tous les fichiers /client/collections/*.cues
     */
    getCollectionsIds: function(cb) {
        fs.readdir(dir, (err, files) => {
            if (err) return cb(err);
            
            const ids = [];
            for (let i = 0; i < files.length; ++i) {
                const file = files[i];
                if (file.match(/\.cues$/i)) {
                    ids.push(file.slice(0, -5));
                }
            }
            
            cb(null, ids);
        });
    },
    
    setDiscsIds: function(collectionId, discIds, cb) {
        collectionId = collectionId.toLowerCase();
        const collectionFile = path.resolve(dir, collectionId + '.cues');
        const content = discIds.join("\n");
        fs.writeFile(collectionFile, content, cb);
    },

    getCollectionNames: function(cb) {
        const rx = /^(.+)\.cues$/;
        const collectionNames = [];
        fs.readdir(dir, (err, filenames) => {
            filenames.forEach(filename => {
                const m = rx.exec(filename);
                if (m) {
                    const name = m[1];
                    if (name !== '_default_') {
                        collectionNames.push(name);
                    }
                }
            });
            collectionNames.sort((a, b) => {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            cb(null, collectionNames);
        });
    },
};