import {NotFoundError, Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';
import {Injectable} from '@angular/core';

const COLLECTIONS_NAMES = 'collectionsNames';

@Injectable({providedIn: 'root'})
export class LocalStoragePersistence extends Persistence {

    get title(): string {
        return LocalStoragePersistence.TITLE;
    }

    get connectedToGoogleDrive(): boolean {
        return false;
    }

    public static readonly TITLE = 'LocalStorage';
    static DEFAULT_COLLECTION = '_DEFAULT_'; // FIXME utiliser la constante de player.component

    static getDiscId(key: string): string {
        const m = key.match(/^disc\.([^.]+)\.cuesheet$/);
        return m ? m[1] : undefined;
    }

    /**
     * @param {string} key
     * @return undefined si item inconnu
     */
    public getItem<T>(key: string): T {
        const item = localStorage.getItem(key);
        if (item) {
            return JSON.parse(item);
        } else {
            return undefined;
        }
    }

    /**
     *
     * @param {string} key
     * @param value si null alors supprime l'item
     */
    public setItem<T>(key: string, value: T) {
        if (value) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.removeItem(key);
        }
    }

    public async getCollectionNames(): Promise<string[]> {
        const knownNames = this.getItem<string[]>(COLLECTIONS_NAMES);
        if (knownNames) {
            return knownNames;
        }

        const rx = /^collection\.(.+)/;
        const names: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const m = rx.exec(key);
            if (m) {
                const name = m[1];
                if (name !== LocalStoragePersistence.DEFAULT_COLLECTION) {
                    names.push(name);
                }
            }
        }

        try {
            await this.setCollectionNames(names);
        } catch (e) {
            console.warn('Impossible de sauvegarder la liste des collections. Cause :', e);
        }

        return names;
    }

    public async getDiscIds(): Promise<string[]> {
        const knownIds = this.getItem<string[]>('discIds');
        if (knownIds) {
            return knownIds;
        }

        const rx = /^disc\.(.+).cuesheet/;
        const ids: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const m = rx.exec(key);
            if (m) {
                const name = m[1];
                ids.push(name);
            }
        }

        try {
            this.setDiscIds(ids);
        } catch (e) {
            console.warn('Impossible de sauvegarder la liste des ids de disques. Cause :', e);
        }

        return ids;
    }

    public async setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        this.setItem(COLLECTIONS_NAMES, collectionsNames);
        return collectionsNames;
    }

    public setDiscIds(discsIds: string[]): string[] {
        this.setItem('discIds', discsIds);
        return discsIds;
    }

    public getCollectionItemName(collectionName: string): string {
        return `collection.${collectionName}`;
    }

    public async getCollection(collectionName: string): Promise<Collection> {
        const json = localStorage.getItem(this.getCollectionItemName(collectionName));
        if (!json) {
            return undefined;
        }
        const object = JSON.parse(json);
        const collection = new Collection(collectionName);
        collection.discIds = object.discIds;
        return collection;
    }

    public async postCollection(collection: Collection): Promise<Collection> {
        const collectionName = collection.name ? collection.name : Persistence.DEFAULT_COLLECTION;
        this.setItem(this.getCollectionItemName(collectionName), collection);
        const collectionNames = await this.getCollectionNames();
        if (collectionNames.indexOf(collectionName) === -1) {
            collectionNames.push(collectionName);
            try {
                this.setCollectionNames(collectionNames);
            } catch (e) {
                console.warn('Impossible de sauvegarder la liste des collections. Cause :', e);
            }
        }
        return collection;
    }

    protected async _deleteCollection(collectionName: string): Promise<void> {
        localStorage.removeItem(this.getCollectionItemName(collectionName));
    }

    public async getDisc(discId: string): Promise<Disc> {
        const json = localStorage.getItem(`disc.${discId}.cuesheet`);
        if (!json) {
            throw new NotFoundError(`Le disque ${discId} n'a pas été trouvé dans le LocalStorage`);
        }
        const data = JSON.parse(json);
        return super.createDisc(discId, data);
    }

    public async postDisc(disc: Disc): Promise<Disc> {
        const discId = disc.id;
        localStorage.setItem(`disc.${discId}.cuesheet`, JSON.stringify(disc.cuesheet)); // TODO à mettre dans un service
        const discIds = await this.getDiscIds();
        if (discIds.indexOf(discId) === -1) {
            discIds.push(discId);
            try {
                this.setDiscIds(discIds);
            } catch (e) {
                console.warn('Impossible de sauvegarder la liste des ids de disques. Cause :', e);
            }
        }
        return disc;
    }

    protected async loadSyncState(): Promise<SyncState> {
        return SyncState.load(localStorage.getItem('syncState'));
    }

    async saveSyncState(syncState: SyncState): Promise<void> {
        localStorage.setItem('syncState', JSON.stringify(syncState));
    }
}
