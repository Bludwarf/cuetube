import {Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';

/**
 * Persistance pour augmenter largement les perfs d'une persistance distante avec une persistance locale.
 * Tout est lu localement.
 * Tout est écrit localement d'abord puis à distance en parallèle.
 */
export class LocalAndDistantPersistence<L extends Persistence, D extends Persistence> extends Persistence {

  public static readonly TITLE = 'LocalAndDistant';

  constructor(public local: L, public distant: D) {
    super(local.$http);
  }

  get title(): string {
    return LocalAndDistantPersistence.TITLE;
  }

  getCollection(collectionName: string): Promise<Collection> {
    return this.local.getCollection(collectionName);
  }

  getCollectionNames(): Promise<string[]> {
    return this.local.getCollectionNames();
  }

  getDiscIds(): Promise<string[]> {
    return this.local.getDiscIds();
  }

  getDisc(discId: string, discIndex: number): Promise<Disc> {
    return this.local.getDisc(discId, discIndex);
  }

  public saveCollection(collection: Collection): Promise<Collection> {
    return this.distant.saveCollection(collection)
      .then(savedCollection => this.local.saveCollection(collection));
  }

  postCollection(collection: Collection): Promise<Collection> {
    throw new Error('IllegalUsage');
  }

  deleteCollection(collectionName: string): Promise<void> {
    return this.distant.deleteCollection(collectionName)
      .then(() => this.local.deleteCollection(collectionName));
  }

  protected _deleteCollection(collectionName: string): Promise<void> {
    throw new Error('IllegalUsage');
  }

  public saveDisc(discId: string, disc): Promise<Disc> {
    return this.distant.saveDisc(discId, disc)
      .then(savedDisc => this.local.saveDisc(discId, disc));
  }

  postDisc(discId: string, disc): Promise<Disc> {
    throw new Error('IllegalUsage');
  }

  setCollectionNames(collectionsNames: string[]): Promise<string[]> {
    return this.distant.setCollectionNames(collectionsNames)
      .then(setNames => this.local.setCollectionNames(collectionsNames));
  }

  protected loadSyncState(): Promise<SyncState> {
    throw new Error('IllegalUsage');
  }

  public saveSyncState(): Promise<SyncState> {
    return this.distant.saveSyncState();
  }
}
