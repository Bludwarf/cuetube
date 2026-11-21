///<reference path="../@types/CueParser.d.ts"/> // TODO à remplacer par une ts config plus propre
import {NotFoundError, Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';
import {StringUtils} from '../StringUtils';
import Queue from 'promise-queue';
import {errorContains, GoogleDriveError} from './google-drive-types';
import {inject, Injectable} from '@angular/core';
import {GapiClientService} from '../app/gapi-client.service';

/**
 * Stockage Google Files, mais avec un seul fichier par type d'objets
 */
@Injectable({providedIn: 'root'})
export class SingleFilesGoogleDrivePersistence extends Persistence {

    public static readonly TITLE = 'Single Files Google Drive';

    private syncStateFile: gapi.client.drive.File = undefined;

    private googleFiles: Record<string, gapi.client.drive.File> = {};
    private googleFilesDataPromises: Record<string, Promise<any>> = {};

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

    private readonly gapiClient = inject(GapiClientService);

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
        queue: Queue;
    } = {
        queue: new Queue(1, Infinity, {
            /**
             * Queries per 100 seconds per user : 1 000
             * Soit 10 req/s donc 1 req toutes les 100 ms
             * @see https://console.developers.google.com/apis/api/drive.googleapis.com/quotas?project=cuetube-bludwarf
             */
            interval: this.prefs.googleDrive.minInterval && parseInt(this.prefs.googleDrive.minInterval, 10) || 100, // ms
        })
    };

    get title(): string {
        return SingleFilesGoogleDrivePersistence.TITLE;
    }

    /**
     * @return true si init OK, false sinon
     */
    public async init(): Promise<boolean> {
        await this.gapiClient.init();
        if (!gapi.client.drive) {
            alert('Google Drive non initialisé');
            return false;
        }
        return true;
    }

    setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return undefined; // TODO
    }

    async getCollectionNames(): Promise<string[]> {
        const collections = await this.getCollectionsData();
        return Object.keys(collections);
    }

    async getDiscIds(): Promise<string[]> {
        const discs = await this.getDiscsData();
        return Object.keys(discs);
    }

    async getAllDiscs(): Promise<Disc[]> {
        const discsData = await this.getDiscsData();
        const discs: Disc[] = [];
        for (const discId in discsData) {
            discs.push(this.createDiscFromData(discId, discsData[discId]));
        }
        return discs;
    }

    async getCollection(collectionName: string): Promise<Collection> {
        const collections = await this.getCollectionsData();
        const discIds = collections[collectionName];
        if (!discIds) {
            throw new NotFoundError(`Collection "${collectionName}" introuvable dans Google Drive`);
        }
        const collection = new Collection(collectionName);
        collection.discIds = discIds;
        return collection;
    }

    /**
     * https://developers.google.com/drive/v3/web/appdata
     */
    async postCollection(collection: Collection): Promise<Collection> {
        // TODO
        return collection;
    }

    protected _deleteCollection(collectionName: string): Promise<void> {
        throw new Error('Not Implemented'); // FIXME
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

        // TODO : this.gapiCall()

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

    async getDisc(discId: string): Promise<Disc> {
        const discsData = await this.getDiscsData();
        const discData = discsData[discId];
        if (!discData) {
            throw new NotFoundError(`Disque "${discId}" introuvable dans Google Drive persistence`);
        }
        return this.createDiscFromData(discId, discData);
    }

    private createDiscFromData(discId: string, discData: string) {
        const jsonCuesheet = JSON.parse(discData);
        return super.createDisc(discId, jsonCuesheet);
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
        return this.gapiCall(gapi.client.drive.files.list({
            q: q
        }), `findGoogleFile("${name}", "${folderGoogleId}")`)
            .then(res => res.result.files)
            // Fichier trouvé ?
            .then(files => {
                if (!files || !files.length) {
                    if (!autoCreate) {
                        throw new Error(`Fichier ${name} introuvable dans le dossier "${folderGoogleId}" de Google Drive`);
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
                if (files.length > 1) {
                    throw new Error(`Plusieurs disques ${name} trouvés dans Google Drive : ${files.length}`);
                }
                return files[0];
            });
    }

    /**
     * Attente si nécessaire entre deux appels api Google Drive
     * @param req {gapi.client.Request<T>} requête Google à envoyer à Google Drive en évitant de dépasser les quotas
     * @param msg message pour les logs
     * @return {Promise<number>} : le temps total attendu
     */
    public async gapiCall<T>(req: gapi.client.Request<T>, msg?: string): Promise<gapi.client.Response<T>> {

        const consoleStyle = `background: no-repeat left center url(https://cdn.iconscout.com/public/images/icon/free/png-128/` +
            `google-drive-social-media-logo-3e5f787c082474e3-128x128.png);
                    background-size: 16px;
                    padding-left: 20px;`;
        console.log(`%c Appel à GoogleDrive` + (msg ? ' : ' + msg : ''), consoleStyle);
        try {
            return await this.apiCall.queue.add(() => req);
        } catch (err) {
            console.error('Erreur gapiCall:', err);
            throw err;
        }
    }

    async postDisc(disc: Disc): Promise<Disc> {
        const discsData = await this.getDiscsData();
        discsData[disc.id] = disc.toJSON();
        await this.saveGoogleFileData('Disques.json', 'cuesFile', discsData);
        return disc;
    }

    protected async loadSyncState(): Promise<SyncState> {
        if (!this.syncStateFile) {
            const rootFolder = await this.getRootFolder();
            this.syncStateFile = await this.findGoogleFile('syncState.json', rootFolder.id);
        }
        const syncStateContent = await this.getFileContent(this.syncStateFile.id);
        return SyncState.load(syncStateContent);
    }

    public async saveSyncState(syncState: SyncState): Promise<void> {

        let rootFolder: gapi.client.drive.File, content: string;
        const filename = 'syncState.json';
        let file1: gapi.client.drive.File | null;
        try {
            rootFolder = await this.getRootFolder();
            content = JSON.stringify(syncState);

            // Fichier existant ?
            file1 = await this.findGoogleFile(filename, rootFolder.id); // TODO cache comme les collection ou les disques
        } catch (err) {
            // Le fichier n'existe pas encore
            file1 = null;
        }
        const file2: gapi.client.Response<gapi.client.drive.File> = await this.gapiCall(this.upload({
            id: file1 ? file1.id : undefined,
            name: filename,
            mimeType: 'text/plain',
            parents: [rootFolder.id]
        }, content), `saveSyncState`);
        console.log(`SyncState sauvegardé dans Google Drive`, file2);
    }

    get connectedToGoogleDrive(): boolean {
        return true;
    }

    private getCollectionsData(): Promise<Collections> {
        return this.getDataFromGoogleFile('Collections.json', 'collectionsFile');
    }

    private getDiscsData(): Promise<Discs> {
        return this.getDataFromGoogleFile('Disques.json', 'cuesFile');
    }

    private async tryToGetRootFolder(): Promise<gapi.client.drive.File> {
        try {
            return await this.getRootFolder();
        } catch (e) {
            const err: GoogleDriveError = e;
            if (errorContains(err, {reason: 'notFound', location: 'fileId'})) {
                if (confirm('Tu dois créér un dossier "CueTube" dans ton Drive mon gars sinon CueTube pourra pas l\'utiliser. ' +
                    +'Appuie sur OK quand c\'est fait...')) {
                    return this.tryToGetRootFolder();
                } else {
                    throw err;
                }
            }
            console.error('Erreur GoogleDrivePersistence.getFolders inconnue :');
            console.error(err);
            throw err;
        }
    }

    private getRootFolder(): Promise<gapi.client.drive.File> {
        return this.getGoogleFile('CueTube', null, 'rootFolder');
    }

    private async getDataFromGoogleFile<I, T extends Record<string, I>>(name: string, field: string): Promise<T> {
        if (!(field in this.googleFilesDataPromises)) {
            // On stocke la Promise et pas la donnée, pour éviter des races conditions (à cause d'un Promise.all, par exemple)
            this.googleFilesDataPromises[field] = this.loadGoogleFileData<I, T>(name, field)
                .catch(e => {
                    // Ne pas garder une promesse en échec dans le cache
                    delete this.googleFilesDataPromises[field];
                    throw e;
                });
        }
        return this.googleFilesDataPromises[field];
    }

    private async loadGoogleFileData<I, T extends Record<string, I>>(name: string, field: string): Promise<T> {
        const rootFolder = await this.tryToGetRootFolder();
        const googleFile = await this.getGoogleFile(name, rootFolder.id, field);
        const content = await this.getFileContent(googleFile.id);
        return (content ? JSON.parse(content) : {}) as T;
    }

    private async saveGoogleFileData<I, T extends Record<string, I>>(name: string, field: string, data: T): Promise<void> {
        const rootFolder = await this.tryToGetRootFolder();
        const googleFile = await this.getGoogleFile(name, rootFolder.id, field);
        const content = JSON.stringify(data);
        await this.setFileContent(googleFile, content);
    }

    /**
     * On crée automatiquement le dossier s'il n'existe pas, on met en cache le dossier trouvé
     * @param {string} name
     * @param {string} parentId
     * @param field
     * @return {Promise<gapi.client.drive.File>}
     */
    private async getGoogleFile(name: string, parentId: string, field: string): Promise<gapi.client.drive.File> {
        let file: gapi.client.drive.File = this.googleFiles[field];
        if (file) {
            return file;
        } else {
            file = await this.findGoogleFile(name, parentId, true);
            this.googleFiles[field] = file;
            return file;
        }
    }

    private async getFileContent(fileId: string): Promise<string> {
        const res = await this.gapiCall(gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        }), `getFileContent("${fileId}")`);
        const body = res.body;
        return StringUtils.utf8Decode(body);
    }

    private async setFileContent(file: gapi.client.drive.File, content: string): Promise<void> {
        await this.gapiCall(this.upload(file, content), `setFileContent("${file.name}")"`);
    }

}

type Collections = Record<string, CollectionData>;
type CollectionData = string[];

type Discs = Record<string, DiscData>;
/** string contenant l'objet jsonCuesheet au format JSON */
type DiscData = string;
