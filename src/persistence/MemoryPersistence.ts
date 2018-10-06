import {Persistence, SyncState} from '../persistence';
import {Disc} from '../disc';
import {HttpClient} from '@angular/common/http';
import {PlayerComponent} from '../app/player/player.component';
import {Collection} from '../Collection';

export class MemoryPersistence extends Persistence {

    public static readonly TITLE = 'Memory';

    collections: {[index: string]: Collection} = {};
    discs: {[index: string]: Disc} = {};

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

    getCollection(collectionName: string): Promise<Collection> {
        return Promise.resolve(this.collections[collectionName]);
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

    getDisc(discId: string, discIndex: number): Promise<Disc> {
        return Promise.resolve(this.discs[discId]);
    }

    protected loadSyncState(): Promise<SyncState> {
        return Promise.resolve(new SyncState());
    }

}
