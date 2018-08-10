import {Persistence} from '../persistence';
import {Disc} from '../disc';
import {HttpClient} from '@angular/common/http';
import {PlayerComponent} from '../app/player/player.component';
import {Collection} from '../Collection';

export class MemoryPersistence extends Persistence {

    collections: {[index: string]: Collection} = {};
    discs: {[index: string]: Disc} = {};

    constructor($http: HttpClient) {
        super($http);
    }

    get title(): string {
        return "Memory";
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
            return this.postCollection(collection);
        })).then(res => collectionsNames);
    }

    getCollectionNames(): Promise<string[]> {
        return Promise.resolve(Object.keys(this.collections));
    }

    postDisc(discId: string, disc): Promise<Disc> {
        this.discs[discId] = disc;
        this.syncState.discs.push(disc); // FIXME à remonter dans persistence
        return Promise.resolve(disc);
    }

    getDisc(discId: string, discIndex: number): Promise<Disc> {
        return Promise.resolve(this.discs[discId]);
    }

}
