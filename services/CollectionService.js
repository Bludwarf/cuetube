var path = require("path");
var fs = require('fs');

var root = path.resolve(__dirname, "..");
var dir = root + "/client/collections/";

module.exports = {
    getDiscsIds: function(collectionId, cb) {
        collectionId = collectionId.toLowerCase();
        var collectionFile = path.resolve(dir, collectionId + '.cues');
        fs.readFile(collectionFile, 'utf-8', (err, collectionContent) => {
            if (err) return cb(err);
            cb(null, collectionContent.split(/\r?\n/)); // FIXME : ignorer les lignes vides
        })
    },
    
    /**
     * Cherche tous les id de collections en listant tous les fichiers /client/collections/*.cues
     */
    getCollectionsIds: function(cb) {
        fs.readdir(dir, (err, files) => {
            if (err) return cb(err);
            
            var ids = [];
            for (var i = 0; i < files.length; ++i) {
                var file = files[i];
                if (file.match(/\.cues$/i)) {
                    ids.push(file.slice(0, -5));
                }
            }
            
            cb(null, ids);
        });
    }
}