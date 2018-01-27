/// <reference path="../@types/gapi.client.drive/index.d.ts" />
/// <reference path="../@types/GoogleDrive.d.ts" />

import CuePrinter = require('../CuePrinter');
import drive = gapi.client.drive;

class GoogleDrivePersistence extends Persistence {

    private rootFolder = undefined;
    private collectionsFolder = undefined;
    private cuesFolder = undefined;

    /** exemple : subFolders['16xjNCGVHLYi2Z5J5xzkhcUs0']['Collections'] = (id du sous-dossier "Collections") */
    private subFolders: Map<string, {}> = new Map();

    private collectionsFiles: Map<string, gapi.client.drive.File> = new Map();
    private cuesFiles: Map<string, gapi.client.drive.File> = new Map(); // TODO : init

    constructor($scope: IPlayerScope, $http: ng.IHttpService) {
        super($scope, $http);
    }

    private getFolders(): Promise<{
        collectionsFolder: drive.File,
        cuesFolder: drive.File
    }> {
        return this.getGoogleFolder('CueTube', null, 'rootFolder').then(rootFolder => {
            return Promise.all([
                this.getGoogleFolder('Collections', rootFolder.id, 'collectionsFolder'),
                this.getGoogleFolder('Disques', rootFolder.id, 'cuesFolder')
            ]).then(results => ({
                collectionsFolder: results[0],
                cuesFolder: results[1]
            }));
        });
    }

    /**
     * On crée automatiquement le dossier s'il n'existe pas
     * @param {string} name
     * @param {string} parentId
     * @param field
     * @param fieldObject
     * @return {Promise<gapi.client.drive.File>}
     */
    private getGoogleFolder(name: string, parentId: string, field: any, fieldObject : any = this): Promise<drive.File> {
        return Promise.resolve(fieldObject[field]).then(file => {
            if (file) {
                return file;
            } else {
                return this.findGoogleFile(name, parentId, true).then(file => fieldObject[field] = file);
            }
        });
    }

    /**
     * La connexion est gérée par Controller.js + service GapiClient
     * @deprecated
     */
    private getConnection(): Promise<void> {
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

    getCollectionNames(): Promise<string[]> {
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
            })
    }

    /**
     *
     * @param {string} pattern exemple /.*\.cue/
     * @param folderGoogleId id du dossier parent dans Google Drive
     * @return {Promise<gapi.client.Response<gapi.client.drive.FileList>>}
     */
    public findGoogleFiles(pattern: RegExp, folderGoogleId: string): Promise<gapi.client.drive.File[]> {
        return gapi.client.drive.files.list({ // Step 5: Assemble the API request
            q: `'${folderGoogleId}' in parents and trashed != true` // https://developers.google.com/drive/v3/web/search-parameters
        })
            .then(res => res.result.files) // Extraction des noms de fichiers dans le dossier
            .then(files => files.filter(file => file.name.match(pattern)));
    }

    setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return undefined;
    }

    private getFileContent(fileId: string): Promise<string> {
        return this.getConnection().then(() => gapi.client.drive.files.get({ // Step 5: Assemble the API request
            fileId: fileId,
            alt: 'media'
        })).then(res => res.body);
    }

    private getFileLines(fileId: string): Promise<string[]> {
        return this.getFileContent(fileId).then(content => content.split(/\r?\n/));
    }

    getCollection(collectionName: string): Promise<Collection> {
        return this.getFileLines(this.collectionsFiles.get(collectionName).id)
            // Création de l'objet collection
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
    postCollection(collection: Collection): Promise<Collection> {

        const content = collection.discIds.join('\r\n');
        const filename = `${collection.name}.cues`;
        let folder;
        return this.getFolders()
            // Fichier existant ?
            .then(folders => {
                folder = folders.collectionsFolder;
                return this.findGoogleFile(filename, folder.id);
            })
            .catch(err => {
                // La collection n'existe pas encore
                return null;
            })
            .then(file => this.upload({
                id: file ? file.id : undefined,
                name: filename,
                description: `Collection ${collection.name} dans CueTube`,
                parents: [folder.id]
            }, content))
            .then(file => {
                console.log(`Collection ${collection.name} sauvegardée dans Google Drive`, file);
                return collection;
            });
    }

    /**
     * Création ou modification si metadata.id
     * @param {string} metadata https://developers.google.com/drive/v3/reference/files (par exemple {name: 'fichier.cue'})
     * @param {string} data
     * @return {Request<T>}
     *
     * @author https://stackoverflow.com/a/35182924
     * @author bludwarf@gmail.com
     *
     * @see https://developers.google.com/drive/v3/web/multipart-upload
     */
    private upload(metadata: gapi.client.drive.File, data: string): gapi.client.HttpRequest<gapi.client.drive.File> {

        // UPDATE
        if (metadata.id) {
            return gapi.client.request({
                path: '/upload/drive/v3/files/' + metadata.id,
                method: 'PATCH',
                params: {
                    uploadType: 'media'
                },
                body: data
            });
        }

        // CREATE
        else {

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const contentType = 'application/x-cue'; // https://www.filesuffix.com/en/extension/cue
            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n\r\n' +
                data +
                close_delim;

            return gapi.client.request({
                'path': '/upload/drive/v3/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });

        } // CREATE
    }

    getDisc(discId: string, discIndex: number): Promise<Disc> {

        return this.getConnection()
            // Fichier Google Drive connu ?
            .then(() => {
                const file = this.cuesFiles.get(discId);
                if (file) {
                    return file;
                } else {
                    return this.getDiscFolder(discId)
                        // Recherche du fichier cue
                        .then(folder => this.findGoogleFile(discId + '.cue', folder.id))
                        .then(file => {
                            this.cuesFiles.set(discId, file); // cache
                            return file;
                        });
                }
            })
            .then(file => this.getFileContent(file.id))
            .then(content => super.createDisc(discId, discIndex, CueParser.parse(content)));
    }

    private getDiscFolder(discId: string): Promise<drive.File> {
        return this.getFolders()
            // Recherche des sous-dossiers
            .then(folders => this.getGoogleFolders([discId[0], discId[1], discId[2]], folders.cuesFolder.id))
            .then(subFolders => subFolders[2]);
    }

    private getGoogleFolders(names: string[], parentId: string, files: drive.File[] = [], fieldObject = this): Promise<drive.File[]> {
        // Création des sous-dossiers dans le cache
        if (!this.subFolders.has(parentId)) {
            this.subFolders.set(parentId, {});
        }
        const subFolders = this.subFolders.get(parentId);

        const name = names[0];
        return this.getGoogleFolder(name, parentId, name, subFolders).then(file => {
            files.push(file);
            if (names.length == 1) {
                return Promise.resolve(files);
            } else {
                const nextFieldObject = subFolders[name];
                return this.getGoogleFolders(names.slice(1), file.id, files, nextFieldObject);
            }
        })
    }

    /**
     * @param {string} name exemple "monDisque.cue"
     * @param folderGoogleId id du dossier parent dans Google Drive
     * @param autoCreate Crée automatiquement le dossier/fichier s'il n'existe pas
     * @return {Promise<gapi.client.Response<gapi.client.drive.FileList>>}
     */
    public findGoogleFile(name: string, folderGoogleId?: string, autoCreate: boolean = false): Promise<gapi.client.drive.File> {
        let q = `name = '${name}' and trashed != true`;
        if (folderGoogleId) {
            q += ` and '${folderGoogleId}' in parents`;
        }
        return gapi.client.drive.files.list({
            q: q
        })
            .then(res => res.result.files)
            // Fichier trouvé ?
            .then(files => {
                if (!files || !files.length) {
                    if (!autoCreate) {
                        throw new Error(`Fichier ${name} introuvable dans Google Drive`);
                    } else {
                        console.log(`Création du fichier/dossier ${name} dans Google Drive`);
                        return gapi.client.drive.files.create({
                            resource: {
                                'name': name,
                                'mimeType': 'application/vnd.google-apps.folder',
                                'parents': [folderGoogleId]
                            },
                            fields: 'id'
                        }).then(res => res.result);
                    }
                }
                if (files.length > 1) throw new Error(`Plusieurs disques ${name} trouvés dans Google Drive : ${files.length}`);
                return files[0];
            });
    }

    postDisc(discId: string, disc: Disc): Promise<any> {
        const content = CuePrinter.print(disc.cuesheet);
        let discFolder;
        return this.getDiscFolder(discId)
            // Recherche du fichier cue
            .then(folder => {
                discFolder = folder;
                return this.findGoogleFile(discId + '.cue', folder.id);
            })
            .catch(err => {
                // Le disque n'existe pas encore
                return null;
            })
            .then(file => this.upload({
                id: file ? file.id : undefined,
                name: `${discId}.cue`,
                description: `Disque ${disc.title} (id YouTube : ${discId}) dans CueTube`,
                parents: [discFolder.id]
            }, content))
            .then(file => {
                console.log(`Disque ${disc.title} sauvegardé dans Google Drive`, file);
                return disc;
            });
    }

}

export = GoogleDrivePersistence;