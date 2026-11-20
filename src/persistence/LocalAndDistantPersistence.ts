import {Persistence, PersistenceWithPublicFields, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';

/**
 * Persistance pour augmenter largement les perfs d'une persistance distante avec une persistance locale.
 * Tout est lu localement.
 * Tout est écrit localement d'abord puis à distance en parallèle.
 */
export class LocalAndDistantPersistence<L extends Persistence,
    D extends Persistence> extends Persistence {

    public readonly local: L & PersistenceWithPublicFields;
    public readonly distant: D & PersistenceWithPublicFields;

    constructor(local: L, distant: D) {
        super(local.$http);
        this.local = local as L & PersistenceWithPublicFields;
        this.distant = distant as D & PersistenceWithPublicFields;
    }

    get title(): string {
        return LocalAndDistantPersistence.TITLE;
    }

    get connectedToGoogleDrive(): boolean {
        return this.local.connectedToGoogleDrive || this.distant.connectedToGoogleDrive;
    }

    public static readonly TITLE = 'LocalAndDistant';

    static persistenceNames(persistenceName: string): { localName: string, distantName: string } {
        const m = /LocalAndDistant\((.+)\)/.exec(persistenceName);
        if (m) {
            const params = m[1].trim().split(/\s*,\s*/);
            return {
                localName: params[0].slice(1, -1),
                distantName: params[1].slice(1, -1),
            };
        } else {
            throw new Error(`Nom de persistence invalide : ${persistenceName}`);
        }
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

    getDisc(discId: string): Promise<Disc> {
        return this.local.getDisc(discId);
    }

    public saveCollection(collection: Collection): Promise<Collection> {
        return this.distant.saveCollection(collection)
            .then(savedCollection => this.local.saveCollection(collection));
    }

    postCollection(collection: Collection): Promise<Collection> {
        throw new Error('IllegalUsage');
    }

    async deleteCollection(collectionName: string): Promise<void> {
        await this.distant.deleteCollection(collectionName);
        return await this.local.deleteCollection(collectionName);
    }

    protected _deleteCollection(collectionName: string): Promise<void> {
        throw new Error('IllegalUsage');
    }

    public async saveDisc(discId: string, disc): Promise<Disc> {
        await this.distant.saveDisc(discId, disc);
        return await this.local.saveDisc(discId, disc);
    }

    postDisc(discId: string, disc): Promise<Disc> {
        throw new Error('IllegalUsage');
    }

    async setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        const setNames = await this.distant.setCollectionNames(collectionsNames);
        return await this.local.setCollectionNames(collectionsNames);
    }

    protected async loadSyncState(): Promise<SyncState> {
        await this.distant.loadSyncState();
        return this.local.loadSyncState();
    }

    public saveSyncState(): Promise<SyncState> {
        return this.distant.saveSyncState();
    }
}
