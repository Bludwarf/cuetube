import {NotFoundError, Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class MemoryPersistence extends Persistence {

    public static readonly TITLE = 'Memory';

    collections: { [index: string]: Collection } = {};
    discs: { [index: string]: Disc } = {};

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

    async setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        await Promise.all(collectionsNames.map(collectionName => {
            const collection = new Collection(collectionName);
            return this.saveCollection(collection);
        }));
        return collectionsNames;
    }

    getCollectionNames(): Promise<string[]> {
        return Promise.resolve(Object.keys(this.collections));
    }

    getDiscIds(): Promise<string[]> {
        return Promise.resolve(Object.keys(this.discs));
    }

    postDisc(disc: Disc): Promise<Disc> {
        this.discs[disc.id] = disc;
        return Promise.resolve(disc);
    }

    async getDisc(discId: string): Promise<Disc> {
        const disc = this.discs[discId];
        if (!disc) {
            throw new NotFoundError(`Disque "${discId}" introuvable en mémoire`);
        }
        return disc;
    }

    protected async loadSyncState(): Promise<SyncState> {
        return new SyncState();
    }

    public async saveSyncState(): Promise<void> {
        // Rien à faire en mémoire
    }

    get connectedToGoogleDrive(): boolean {
        return false;
    }
}
