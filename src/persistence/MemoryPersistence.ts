import {Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {HttpClient} from '@angular/common/http';
import {Collection} from '../Collection';

export class MemoryPersistence extends Persistence {

  public static readonly TITLE = 'Memory';

  collections: { [index: string]: Collection } = {};
  discs: { [index: string]: Disc } = {};
  private syncState = new SyncState();

  constructor($http: HttpClient) {
    super($http);
  }

  get title(): string {
    return MemoryPersistence.TITLE;
  }

  postCollection(collection: Collection): Promise<Collection> {
    this.collections[collection.name] = collection;
    return Promise.resolve(collection);
  }

  protected async _deleteCollection(collectionName: string): Promise<void> {
    delete this.collections[collectionName];
  }

  getCollection(collectionName: string): Promise<Collection> {
    return Promise.resolve(this.collections[collectionName] || new Collection(collectionName));
  }

  setCollectionNames(collectionsNames: string[]): Promise<string[]> {
    return Promise.all(collectionsNames.map(collectionName => {
      const collection = new Collection(collectionName);
      return this.saveCollection(collection);
    })).then(res => collectionsNames);
  }

  getCollectionNames(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.collections));
  }

  getDiscIds(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.discs));
  }

  postDisc(discId: string, disc): Promise<Disc> {
    this.discs[discId] = disc;
    return Promise.resolve(disc);
  }

  getDisc(discId: string): Promise<Disc> {
    return Promise.resolve(this.discs[discId]);
  }

  protected loadSyncState(): Promise<SyncState> {
    return Promise.resolve(this.syncState);
  }

  public async saveSyncState(): Promise<SyncState> {
    console.log(`syncState "sauvegardé" : ${JSON.stringify(this.syncState, null, 4)}`);
    return this.syncState;
  }

}
