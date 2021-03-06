import {Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {HttpClient} from '@angular/common/http';
import {Collection} from '../Collection';

export class LocalServerPersistence extends Persistence {

    public static readonly TITLE = 'LocalServer';

    constructor($http: HttpClient) {
        super($http);
    }

    get title(): string {
        return LocalServerPersistence.TITLE;
    }

    public getCollectionNames(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collectionNames`).toPromise().then(collectionNames => {
                resolve(collectionNames);
            }, resKO => {
                console.error('Error GET collectionNames != 200');
                return reject(resKO);
            });
        });
    }

    public getDiscIds(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/discIds`).toPromise().then(discIds => {
                resolve(discIds);
            }, resKO => {
                console.error('Error GET discIds != 200');
                return reject(resKO);
            });
        });
    }

    public setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.$http.post<string[]>(`/collectionNames`, collectionsNames).toPromise().then(res => {
                resolve(collectionsNames);
            }, resKO => {
                return reject(resKO);
            });
        });
    }

    public getCollection(collectionName: string): Promise<Collection> {
        return new Promise((resolve, reject) => {
            this.$http.get<string[]>(`/collection/${collectionName}/discs`).toPromise().then(discIds => {
                const collection = new Collection(collectionName);
                collection.discIds = discIds;
                resolve(collection);
            }, resKO => {
                console.error('Error GET collection != 200');
                return reject(resKO);
            });
        });
    }

    public postCollection(collection: Collection): Promise<Collection> {
        const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
        return new Promise((resolve, reject) => {
            this.$http.post<Collection>(`/collection/${collectionName}/discs`, collection.discIds).toPromise().then(res => {
                return resolve(collection);
            }, resKO => {
                console.error('Error POST collection != 200');
                return reject(resKO);
            });
        });
    }

  protected _deleteCollection(collectionName: string): Promise<void> {
    throw new Error('Not Implemented'); // FIXME
  }

  public getDisc(discId: string): Promise<Disc> {
        return new Promise((resolve, reject) => {
            this.$http.get('/' + discId + '.cue.json').toPromise().then(res => {
                const disc = super.createDisc(discId, res);
                resolve(disc);
            }, reject);
        });
    }

    // TODO : renvoyer plutôt le disc que le résultat du post
    public postDisc(discId: string, disc): Promise<Disc> {
        return new Promise((resolve, reject) => {
            this.$http.post(`/${discId}.cue.json`, disc).toPromise().then(resolve, reject);
        });
    }

    protected loadSyncState(): Promise<SyncState> {
        // FIXME implement
        throw new Error("LocalServerPersistence.loadSyncState TO IMPLEMENT");
    }

    saveSyncState(): Promise<SyncState> {
        // FIXME implement
        throw new Error("LocalServerPersistence.saveSyncState TO IMPLEMENT");
    }
}
