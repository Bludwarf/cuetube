"use strict";
/// <reference path="../../node_modules/@types/gapi.client.drive/index.d.ts" />
/// <reference path="../@types/GoogleDrive.d.ts" />
const CuePrinter = require("../CuePrinter");
class GoogleDrivePersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
        this.rootFolderId = '16xjNCGVHLYi2Z5J5xzkhcUs0-joFzcka';
        this.collectionsFolder = null;
        this.cuesFolder = null;
        /** exemple : subFolders['16xjNCGVHLYi2Z5J5xzkhcUs0']['Collections'] = (id du sous-dossier "Collections") */
        this.subFolders = new Map();
        this.collectionsFiles = new Map();
        this.cuesFiles = new Map(); // TODO : init
    }
    getFolders() {
        return Promise.all([
            this.getOrFindGoogleFolder('Collections', this.rootFolderId, 'collectionsFolder'),
            this.getOrFindGoogleFolder('Disques', this.rootFolderId, 'cuesFolder')
        ]).then(results => ({
            collectionsFolder: results[0],
            cuesFolder: results[1]
        }));
    }
    getOrFindGoogleFolder(name, parentId, field, fieldObject = this) {
        return Promise.resolve(fieldObject[field]).then(file => {
            if (file) {
                return file;
            }
            else {
                return this.findGoogleFile(name, parentId).then(file => fieldObject[field] = file);
            }
        });
    }
    /**
     * La connexion est gérée par Controller.js + service GapiClient
     * @deprecated
     */
    getConnection() {
        // alert('getConnection');
        // const p = gapi.client.init({
        //
        //     // Client ID and API key from the Developer Console
        //     apiKey: 'AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE',
        //     clientId: '873045101562-3t98pn5qlml130icgp9e8q5tqsqsao76.apps.googleusercontent.com',
        //
        //     // Array of API discovery doc URLs for APIs used by the quickstart
        //     discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        //
        //     // Authorization scopes required by the API; multiple scopes can be
        //     // included, separated by spaces.
        //     // TODO : utiliser plutôt le dossier https://developers.google.com/drive/v2/web/appdata
        //     scope: 'https://www.googleapis.com/auth/drive'
        // }).then(() => {
        //     alert('getConnection isSignedIn');
        //     const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        //     if (!isSignedIn) {
        //         return gapi.auth2.getAuthInstance().signIn().then(() => {return});
        //     }
        // }, reason => {
        //     console.error(name, 'getConnection Google Drive error:', reason.result.error.message);
        // });
        // alert('return p');
        // return p;
        return Promise.resolve();
    }
    getCollectionNames() {
        return this.getFolders()
            .then(folders => this.findGoogleFiles(/.+\.cues/, folders.collectionsFolder.id))
            .then(files => {
            const collectionsNames = [];
            files.forEach(file => {
                const collectionName = file.name.slice(0, -5);
                collectionsNames.push(collectionName);
                // Sauvegarde de l'id dans Google Drive de la collection
                this.collectionsFiles.set(collectionName, file);
            });
            return collectionsNames;
        });
    }
    /**
     *
     * @param {string} pattern exemple /.*\.cue/
     * @param folderGoogleId id du dossier parent dans Google Drive
     * @return {PromiseLike<gapi.client.Response<gapi.client.drive.FileList>>}
     */
    findGoogleFiles(pattern, folderGoogleId) {
        return gapi.client.drive.files.list({
            q: `'${folderGoogleId}' in parents and trashed != true` // https://developers.google.com/drive/v3/web/search-parameters
        })
            .then(res => res.result.files) // Extraction des noms de fichiers dans le dossier
            .then(files => files.filter(file => file.name.match(pattern)));
    }
    setCollectionNames(collectionsNames) {
        return undefined;
    }
    getFileContent(fileId) {
        return this.getConnection().then(() => gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        })).then(res => res.body);
    }
    getFileLines(fileId) {
        return this.getFileContent(fileId).then(content => content.split(/\r?\n/));
    }
    getCollection(collectionName) {
        return this.getFileLines(this.collectionsFiles.get(collectionName).id)
            .then(discIds => {
            return {
                name: collectionName,
                discIds: discIds
            };
        });
    }
    /**
     * https://developers.google.com/drive/v3/web/appdata
     */
    postCollection(collection) {
        const content = collection.discIds.join('\r\n');
        return this.getFolders()
            .then(folders => this.upload({
            name: `${collection.name}.cues`,
            description: `Collection ${collection.name} dans CueTube`,
            parents: [folders.collectionsFolder.id]
        }, content))
            .then(file => {
            console.log(`Collection ${collection.name} sauvegardée dans Google Drive`, file);
            return collection;
        });
    }
    /**
     *
     * @param {string} metadata https://developers.google.com/drive/v3/reference/files (par exemple {name: 'fichier.cue'})
     * @param {string} data
     * @return {Request<T>}
     *
     * @author https://stackoverflow.com/a/35182924
     * @author bludwarf@gmail.com
     */
    upload(metadata, data) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const contentType = 'application/x-cue'; // https://www.filesuffix.com/en/extension/cue
        const multipartRequestBody = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n\r\n' +
            data +
            close_delim;
        return gapi.client.request({
            'path': '/upload/drive/v3/files',
            'method': 'POST',
            'params': { 'uploadType': 'multipart' },
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
    }
    getDisc(discId, discIndex) {
        return this.getConnection()
            .then(() => {
            const file = this.cuesFiles.get(discId);
            if (file) {
                return file;
            }
            else {
                return this.getFolders()
                    .then(folders => this.getOrFindGoogleFolders([discId[0], discId[1], discId[2]], folders.cuesFolder.id))
                    .then(subFolders => this.findGoogleFile(discId + '.cue', subFolders[2].id))
                    .then(file => {
                    this.cuesFiles.set(discId, file); // cache
                    return file;
                });
            }
        })
            .then(file => this.getFileContent(file.id))
            .then(content => super.createDisc(discId, discIndex, CueParser.parse(content)));
    }
    getOrFindGoogleFolders(names, parentId, files = [], fieldObject = this) {
        // Création des sous-dossiers dans le cache
        if (!this.subFolders.has(parentId)) {
            this.subFolders.set(parentId, {});
        }
        const subFolders = this.subFolders.get(parentId);
        const name = names[0];
        return this.getOrFindGoogleFolder(name, parentId, name, subFolders).then(file => {
            files.push(file);
            if (names.length == 1) {
                return Promise.resolve(files);
            }
            else {
                const nextFieldObject = subFolders[name];
                return this.getOrFindGoogleFolders(names.slice(1), file.id, files, nextFieldObject);
            }
        });
    }
    /**
     *
     * @param {string} name exemple "monDisque.cue"
     * @param folderGoogleId id du dossier parent dans Google Drive
     * @return {PromiseLike<gapi.client.Response<gapi.client.drive.FileList>>}
     */
    findGoogleFile(name, folderGoogleId) {
        let q = `name = '${name}' and trashed != true`;
        if (folderGoogleId) {
            q += ` and '${folderGoogleId}' in parents`;
        }
        return gapi.client.drive.files.list({
            q: q
        })
            .then(res => res.result.files)
            .then(files => {
            if (!files || !files.length)
                throw new Error(`Fichier ${name} introuvable dans Google Drive`);
            if (files.length > 1)
                throw new Error(`Plusieurs disques ${name} trouvés dans Google Drive : ${files.length}`);
            return files[0];
        });
    }
    postDisc(discId, disc) {
        const content = CuePrinter.print(disc.cuesheet);
        return this.getFolders()
            .then(folders => this.upload({
            name: `${discId}.cue`,
            description: `Disque ${disc.title} (id YouTube : ${discId}) dans CueTube`,
            parents: [folders.cuesFolder.id]
        }, content))
            .then(file => {
            console.log(`Disque ${disc.title} sauvegardé dans Google Drive`, file);
            return disc;
        });
    }
}
module.exports = GoogleDrivePersistence;
//# sourceMappingURL=GoogleDrivePersistence.js.map