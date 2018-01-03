/// <reference path="../../node_modules/@types/gapi.client.drive/index.d.ts" />
/// <reference path="../@types/GoogleDrive.d.ts" />
class GoogleDrivePersistence extends Persistence {
    constructor($scope, $http) {
        super($scope, $http);
        this.collectionsFolderId = '13TgKHinU3mYX35ZqUlb7rOUz-hIxRoAx'; // TODO param
        this.collectionsFiles = new Map();
        this.cuesFolderId = '1WKl0QTL-qjKwQXmuZJWzSwZrzf0xxsYo'; // TODO param
        this.cuesFiles = new Map(); // TODO : init
    }
    // la connexion est gérée par Controller.js + service GapiClient
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
        return this.getConnection()
            .then(() => gapi.client.drive.files.list({
            q: `'${this.collectionsFolderId}' in parents`
        }))
            .then(res => res.result.files)
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
    postCollection(collection) {
        return undefined;
    }
    getDisc(discId, discIndex) {
        return this.getConnection()
            .then(() => {
            const file = this.cuesFiles.get(discId);
            if (file) {
                return file;
            }
            else {
                return gapi.client.drive.files.list({
                    q: `'${this.cuesFolderId}' in parents and name = '${discId}.cue'`
                })
                    .then(res => res.result.files)
                    .then(files => {
                    if (!files || !files.length)
                        throw new Error(`Aucun disque ${discId}.cue trouvé dans Google Drive`);
                    if (files.length > 1)
                        throw new Error(`Plusieurs disques ${discId}.cue trouvés dans Google Drive : ${files.length}`);
                    const file = files[0];
                    this.cuesFiles.set(discId, file); // cache
                    return file;
                });
            }
        })
            .then(file => this.getFileContent(file.id))
            .then(content => super.createDisc(discId, discIndex, CueParser.parse(content)));
    }
    postDisc(discId, disc) {
        return undefined;
    }
}
//# sourceMappingURL=GoogleDrivePersistence.js.map