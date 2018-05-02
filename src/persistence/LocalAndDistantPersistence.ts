import {Persistence} from '../persistence';
import {Disc} from '../disc';
import {Collection} from '../Collection';

/**
 * Persistance pour augmenter largement les perfs d'une persistance distante avec une persistance locale.
 * Tout est lu localement.
 * Tout est écrit localement d'abord puis à distance en parallèle.
 */
export class LocalAndDistantPersistence<L extends Persistence,D extends Persistence> extends Persistence {

    constructor(public local: L, public distant: D) {
        super(local.$scope, local.$http);
    }

    get title(): string {
        return 'LocalAndDistant';
    }

    getCollection(collectionName: string): Promise<Collection> {
        return this.local.getCollection(collectionName);
    }

    getCollectionNames(): Promise<string[]> {
        return this.local.getCollectionNames();
    }

    getDisc(discId: string, discIndex: number): Promise<Disc> {
        return this.local.getDisc(discId, discIndex);
    }

    postCollection(collection: Collection): Promise<Collection> {
        this.distant.postCollection(collection);
        return this.local.postCollection(collection);
    }

    postDisc(discId: string, disc): Promise<Disc> {
        this.distant.postDisc(discId, disc);
        return this.local.postDisc(discId, disc);
    }

    setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        this.distant.setCollectionNames(collectionsNames);
        return this.local.setCollectionNames(collectionsNames);
    }
}
