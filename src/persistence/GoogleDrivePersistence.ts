import {Persistence} from '../persistence';
import {Disc} from '../Disc';
import {CuePrinter} from '../CuePrinter';
import drive = gapi.client.drive;
import Player = YT.Player;
import {PlayerComponent} from '../app/player/player.component';
import {HttpClient} from '@angular/common/http';
import {Collection} from '../Collection';

export class GoogleDrivePersistence extends Persistence {

    private rootFolder: string = undefined;
    private collectionsFolder: string = undefined;
    private cuesFolder: string = undefined;

    /** exemple : subFolders['16xjNCGVHLYi2Z5J5xzkhcUs0']['Collections'] = (id du sous-dossier "Collections") */
    private subFolders: Map<string, {}> = new Map();

    private collectionsFiles: Map<string, gapi.client.drive.File> = new Map();
    private cuesFiles: Map<string, gapi.client.drive.File> = new Map(); // TODO : init

    private prefs = {
        googleDrive: {
            /**
             * Queries per 100 seconds per user : 1 000
             * Soit 10 req/s donc 1 req toutes les 100 ms
             * @see https://console.developers.google.com/apis/api/drive.googleapis.com/quotas?project=cuetube-bludwarf
             */
            minInterval: localStorage.getItem('googleDrive.minInterval')
        }
    };

    /**
     * Pour éviter de recevoir un 403 pour usage trop intensif de l'API Google Drive
     *
     * Exemple :
     * {
 "error": {
  "errors": [
   {
    "domain": "usageLimits",
    "reason": "userRateLimitExceeded",
    "message": "User Rate Limit Exceeded"
   }
  ],
  "code": 403,
  "message": "User Rate Limit Exceeded"
 }
}

     */
    private apiCall: {
        last: Date;
        minInterval: number;
        lastPromise?: Promise<number>;
        waiters: number;
        nextWaiterId: number;
    } = {
        last: undefined,
        /**
         * Queries per 100 seconds per user : 1 000
         * Soit 10 req/s donc 1 req toutes les 100 ms
         * @see https://console.developers.google.com/apis/api/drive.googleapis.com/quotas?project=cuetube-bludwarf
         */
        minInterval: this.prefs.googleDrive.minInterval && parseInt(this.prefs.googleDrive.minInterval, 10) || 100, // ms
        waiters: 0,
        nextWaiterId: 0
    };

    constructor($scope: PlayerComponent, $http: HttpClient) {
        super($scope, $http);
    }

    get title(): string {
        return 'Google Drive';
    }

    /**
     * @return {Promise<boolean>} true si init OK, false sinon
     */
    public init(params: any): Promise<boolean> {
        if (!params || !params.gapiClient) {
            throw new Error('Veuillez appeler init avec {gapiClient}');
        }
        return params.gapiClient.init().then(() => {

            if (!gapi.client.drive) {
                alert('Google Drive non initialisé');
                return Promise.resolve(false);
            }

            return Promise.resolve(true);
        });
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
        }, e => {
            const err : GoogleDriveError = e;
            if (errorContains(err, {reason: 'notFound', location: 'fileId'})) {
                if (confirm('Tu dois créér un dossier "CueTube" dans ton Drive mon gars sinon CueTube pourra pas l\'utiliser. ' +
                    + 'Appuie sur OK quand c\'est fait...')) {
                    return this.getFolders();
                } else {
                    throw err;
                }
            }
            console.error('Erreur GoogleDrivePersistence.getFolders inconnue :');
            console.error(err);
            throw err;
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
                return this.findGoogleFile(name, parentId, true).then(fileI => fieldObject[field] = fileI);
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
                const collectionsNames: string[] = [];
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
     * @return {Promise<gapi.client.Response<gapi.client.drive.FileList>>}
     */
    public findGoogleFiles(pattern: RegExp, folderGoogleId: string): Promise<gapi.client.drive.File[]> {
        return this.tempoApiCall().then(delay => {
            return gapi.client.drive.files.list({ // Step 5: Assemble the API request
                q: `'${folderGoogleId}' in parents and trashed != true` // https://developers.google.com/drive/v3/web/search-parameters
            });
        })
            .then(res => res.result.files) // Extraction des noms de fichiers dans le dossier
            .then(files => files.filter(file => file.name.match(pattern)));
    }

    setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return undefined;
    }

    private getFileContent(fileId: string): Promise<string> {
        return this.tempoApiCall().then(() => gapi.client.drive.files.get({ // Step 5: Assemble the API request
            fileId: fileId,
            alt: 'media'
        }))
            .then(res => res.body)
            .then(body => utf8Decode(body));
    }

    /**
     * Supprimer automatiquement les lignes vides
     * @param {string} fileId
     * @return {Promise<string[]>}
     */
    private getFileLines(fileId: string): Promise<string[]> {
        return this.getFileContent(fileId)
            .then(content => content.split(/\r?\n/))
            .then(lines => lines.filter(line => line.trim()));
    }

    getCollection(collectionName: string): Promise<Collection> {

        return this.getCollectionFile(collectionName)
            .then(file => {
                // Collection déjà connue ?
                if (file) {
                    return this.getFileLines(file.id);
                } else {
                    return [];
                }
            })
            // Création de l'objet collection
            .then(discIds => {
                return {
                    name: collectionName,
                    discIds: discIds
                };
            });
    }


    private getCollectionFile(collectionName: string): Promise<drive.File> {
        // Fichier Google Drive connu ?
        const file = this.collectionsFiles.get(collectionName);
        if (file) {
            return Promise.resolve(file);
        } else {
            return this.getFolders()
                // Recherche du fichier collection
                .then(folders => this.findGoogleFile(`${collectionName}.cues`, folders.collectionsFolder.id))
                .then(fileI => {
                    this.collectionsFiles.set(collectionName, fileI); // cache
                    return fileI;
                });
        }
    }

    /**
     * https://developers.google.com/drive/v3/web/appdata
     */
    postCollection(collection: Collection): Promise<Collection> {

        const content = collection.discIds.join('\r\n');
        const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
        const filename = `${collectionName}.cues`;
        let folder: drive.File;
        return this.getFolders()
            // Fichier existant ?
            .then(folders => {
                folder = folders.collectionsFolder;
                return this.getCollectionFile(collectionName);
            })
            .catch(err => {
                // La collection n'existe pas encore
                return null;
            })
            // TODO : en attendant de pouvoir commencer this.upload par this.tempoApiCall()
            .then(file => {
                return this.tempoApiCall().then(delay => {
                    return file;
                });
            })
            .then(file => this.upload({
                id: file ? file.id : undefined,
                name: filename,
                mimeType: 'text/plain',
                // description: `Collection ${collectionName} dans CueTube`,
                parents: [folder.id]
            }, content))
            .then(file => {
                console.log(`Collection ${collectionName} sauvegardée dans Google Drive`, file);
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
    private upload(metadata: gapi.client.drive.File, data: string): gapi.client.Request<gapi.client.drive.File> {

        // TODO : this.tempoApiCall()

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
        } else {

            const boundary = '-------314159265358979323846';
            const delimiter = '\r\n--' + boundary + '\r\n';
            const close_delim = '\r\n--' + boundary + '--';

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

        return this.getCueFile(discId) // Fichier Google Drive connu ?
            .then(file => this.getFileContent(file.id))
            .then(content => super.createDisc(discId, discIndex, CueParser.parse(content)));
    }

    private getCueFile(discId: string): Promise<drive.File> {
        const file = this.cuesFiles.get(discId);
        if (file) {
            return Promise.resolve(file);
        } else {
            return this.getDiscFolder(discId)
                // Recherche du fichier cue
                .then(folder => this.findGoogleFile(discId + '.cue', folder.id))
                .then(fileI => {
                    this.cuesFiles.set(discId, fileI); // cache
                    return fileI;
                });
        }
    }

    private getDiscFolder(discId: string): Promise<drive.File> {
        return this.getFolders()
            // Recherche des sous-dossiers
            .then(folders => this.getGoogleFolders([
                discId[0].toUpperCase(),
                discId[1].toUpperCase(),
                discId[2].toUpperCase()
            ], folders.cuesFolder.id))
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
            if (names.length === 1) {
                return Promise.resolve(files);
            } else {
                const nextFieldObject = subFolders[name];
                return this.getGoogleFolders(names.slice(1), file.id, files, nextFieldObject);
            }
        });
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
        return this.tempoApiCall().then(delay => {
                return gapi.client.drive.files.list({
                    q: q
                });
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
                if (files.length > 1) { throw new Error(`Plusieurs disques ${name} trouvés dans Google Drive : ${files.length}`); }
                return files[0];
            });
    }

    /**
     * Attente si nécessaire entre deux appels api Google Drive
     * @param previousDelay {?number} délai déjà attendu
     * @param waiterIdParam {?number} id du waiter si on avait déjà attendu, utilisé <b>uniquement</b> en interne, ne pas utiliser !
     * @return {Promise<number>} : le temps total attendu
     */
    public tempoApiCall(previousDelay: number = 0, waiterIdParam?: number): Promise<number> {

        const consoleStyle = `background: no-repeat left center url(https://cdn.iconscout.com/public/images/icon/free/png-128/` +
          `google-drive-social-media-logo-3e5f787c082474e3-128x128.png);
                    background-size: 16px;
                    padding-left: 20px;`;

        // Promise déjà en attente ? => on se place derrière cette promise TODO
        const lastPromise : Promise<number> = /*this.apiCall.lastPromise ||*/ Promise.resolve(0);
        return lastPromise.then(lastPromiseDelay => {
            const now = new Date();
            if (!this.apiCall.last || waiterIdParam !== undefined) {
                if (waiterIdParam !== undefined) {
                    console.log(`%c tempo GoogleDrive terminée : ${previousDelay}ms pour le waiter ${waiterIdParam}`, consoleStyle);
                }
                this.apiCall.last = now;
                return Promise.resolve(previousDelay);
            } else {
                // src : https://stackoverflow.com/a/22707551/
                const delay = this.apiCall.last.getTime() + this.apiCall.minInterval * (this.apiCall.waiters + 1) - now.getTime();
                if (delay <= 0) {
                    console.log(`%c tempo GoogleDrive écoulée : ${previousDelay}ms pour le waiter ${waiterIdParam}`, consoleStyle);
                    this.apiCall.last = now;
                    return Promise.resolve(previousDelay);
                } else {
                    //this.apiCall.last = new Date(now.getTime() + delay);
                    ++this.apiCall.waiters;
                    const waiterId = this.apiCall.nextWaiterId++;
                    if (waiterIdParam !== undefined) {
                        console.warn(`%c le waiter ${waiterIdParam} passe une nouvelle fois en attente : ${waiterId}`, consoleStyle);
                    }
                    const persist = this;
                    const promise : Promise<number> = new Promise(function (resolve) {
                        console.debug(`%c tempo GoogleDrive : +${delay}ms... pour le waiter ${waiterId}`, consoleStyle);
                        setTimeout(() => {
                            --persist.apiCall.waiters;
                            if (persist.apiCall.waiters) {
                                console.debug(`%c ${persist.apiCall.waiters} promises encore en attente derrière le waiter ${waiterId}`,
                                  consoleStyle);
                            }
                            persist.tempoApiCall(previousDelay + delay, waiterId).then(delay0 => resolve(delay0));
                        }, delay);
                    });
                    this.apiCall.lastPromise = promise;
                    return promise;
                }
            }
        });
    }

    postDisc(discId: string, disc: Disc): Promise<any> {
        const content = CuePrinter.print(disc.cuesheet);
        let discFolder: drive.File;
        return this.getDiscFolder(discId)
            .then((folder) => {
                discFolder = folder;
                return this.getCueFile(discId);
            })
            .catch(err => {
                // Le disque n'existe pas encore
                return null;
            })
            // TODO : en attendant de pouvoir commencer this.upload par this.tempoApiCall()
            .then(file => {
                return this.tempoApiCall().then(delay => {
                    return file;
                });
            })
            .then(file => this.upload({
                id: file ? file.id : undefined,
                name: `${discId}.cue`,
                description: disc.title,
                parents: [discFolder.id]
            }, content))
            .then(file => {
                console.log(`Disque ${disc.title} sauvegardé dans Google Drive`, file);
                return disc;
            });
    }

}

interface GoogleDriveError {
    result: GoogleDriveErrorResult;
    /** result en string */
    body: string;
    /** map : nom du header en minuscule, valeur */
    'headers': string;
    /** 404 par exemple */
    'status': number;
    'statusText': null;
}

interface GoogleDriveErrorResult {
    error: {
        'errors': GoogleDriveErrorDetail[],
        'code': number; // 404,
        'message': string; // "File not found: ."
    };
}

interface GoogleDriveErrorDetail {
    /** par exemple "global" */
    'domain'?: string;
    /** par exemple "notFound" */
    'reason'?: string;
    /** par exemple "File not found: ." */
    'message'?: string;
    /** par exemple "parameter" */
    'locationType'?: string;
    /** par exemple "fileId" */
    'location'?: string;
}

function errorContains(error : GoogleDriveError, errorDetail : GoogleDriveErrorDetail) {
    if (!error || !error.result || !error.result.error || !error.result.error.errors) {
        return false;
    }

    return error.result.error.errors.find(currentDetail => equalsOnlyDefinedFields(currentDetail, errorDetail));
}

function equalsOnlyDefinedFields(actual, expected) {
    for (const key in expected) {
        if (expected.hasOwnProperty(key) && expected[key] !== undefined && expected[key] !== actual[key]) {
            return false;
        }
    }
    return true;
}

/**
 * Encodes multi-byte Unicode string into utf-8 multiple single-byte characters
 * (BMP / basic multilingual plane only).
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars.
 *
 * Can be achieved in JavaScript by unescape(encodeURIComponent(str)),
 * but this approach may be useful in other languages.
 *
 * @param   {string} unicodeString - Unicode string to be encoded as UTF-8.
 * @returns {string} UTF8-encoded string.
 *
 * @src https://gist.github.com/chrisveness/bcb00eb717e6382c5608
 */
function utf8Encode(unicodeString) {
  if (typeof unicodeString !== 'string') {
    throw new TypeError('parameter ‘unicodeString’ is not a string');
  }

  const utf8String = unicodeString.replace(
    /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
    function(c) {
      const cc = c.charCodeAt(0);
      return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f); }
  ).replace(
    /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
    function(c) {
      const cc = c.charCodeAt(0);
      return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f); }
  );
  return utf8String;
}

/**
 * Decodes utf-8 encoded string back into multi-byte Unicode characters.
 *
 * Can be achieved JavaScript by decodeURIComponent(escape(str)),
 * but this approach may be useful in other languages.
 *
 * @param   {string} utf8String - UTF-8 string to be decoded back to Unicode.
 * @returns {string} Decoded Unicode string.
 *
 * @src https://gist.github.com/chrisveness/bcb00eb717e6382c5608
 */
function utf8Decode(utf8String) {
  if (typeof utf8String !== 'string') {
    throw new TypeError('parameter ‘utf8String’ is not a string');
  }

  // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
  const unicodeString = utf8String.replace(
    /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
    function(c) {  // (note parentheses for precedence)
      const cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | ( c.charCodeAt(2) & 0x3f);
      return String.fromCharCode(cc); }
  ).replace(
    /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
    function(c) {  // (note parentheses for precedence)
      const cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
      return String.fromCharCode(cc); }
  );
  return unicodeString;
}
