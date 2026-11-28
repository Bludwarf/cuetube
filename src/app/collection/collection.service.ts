import Collection from '../../Collection';
import {inject, Injectable} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {PersistedService} from '../../refacto-2026/persisted-service';

@Injectable({providedIn: 'root'})
export class CollectionService implements PersistedService {

    private collections: Collection[] = [];
    private persistenceService = inject(PersistenceService);

    // Lancé uniquement au démarrage de l'appli
    async load(): Promise<void> {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const collectionDtos = await persistence.getCollections2026();
        this.collections = collectionDtos.map(dto => {
            const collection = new Collection(dto.name);
            collection.pushDiscIds(...dto.discIds);
            return collection;
        });
    }

    getCollections() {
        return this.collections;
    }

    setCollections(collections: Collection[]) {
        this.collections = collections;
    }

    async save() {
        const collectionsDto = this.collections.map(collection => ({
            name: collection.name,
            discIds: collection.discIds,
        }));
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        await persistence.postCollections2026(collectionsDto);
    }
}

export interface CollectionDto {
    name: string;
    discIds: string[];
}
