import {Component, inject} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {DiscService} from '../../refacto-2026/disc.service';
import {YouTubeMappedDiscService} from '../../refacto-2026/you-tube-mapped-disc.service';
import {hideLoader} from '../app.component';
import Collection from '../../Collection';
import {localComparing} from '../../utils/comparators';
import {Disc} from '../../disc';
import _ from 'underscore';
import {GoogleDrivePersistence} from '../../google/GoogleDrivePersistence';
import {NotFoundError, Persistence} from '../../persistence';
import {CollectionService} from '../collection/collection.service';

@Component({
    selector: 'app-convert-all-collections',
    imports: [],
    templateUrl: './convert-all-collections.component.html',
    styleUrl: './convert-all-collections.component.css',
})
export class ConvertAllCollectionsComponent {
    protected allNewCollections: Collection[];
    private readonly persistenceService = inject(PersistenceService);
    private readonly googleDrivePersistence = inject(GoogleDrivePersistence);
    private discService = inject(DiscService);
    private mappedDiscService = inject(YouTubeMappedDiscService);
    private collectionService = inject(CollectionService);

    ngOnInit(): void {
        hideLoader();
    }

    protected async loadAllOldCollections() {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        await this.googleDrivePersistence.init();
        const oldCollectionsByName = await persistence.getAllCollectionsByNames();
        const allOldDiscs = await persistence.getAllDiscs();
        const allOldDiscsById = _.groupBy(allOldDiscs, disc => disc._id);

        const allNewCollections: Collection[] = [];

        for (const collectionName in oldCollectionsByName) {
            console.group(`Traitement collection ${collectionName}...`);
            const oldCollection = oldCollectionsByName[collectionName];
            if (!oldCollection) {
                throw new Error(`Collection ${collectionName} not found`);
            }

            const newCollection = new Collection(oldCollection.name);

            for (const oldDiscId of oldCollection.discIds) {
                const oldDisc = await this.getOldDisc(oldDiscId, persistence);
                if (oldDisc) {
                    const newDiscId = this.getNewDiscId(oldDisc);
                    newCollection.push(newDiscId);
                }
            }

            allNewCollections.push(newCollection);

            console.groupEnd();
        }

        allNewCollections.sort(localComparing(c => c.name));
        this.allNewCollections = allNewCollections;

        this.collectionService.setCollections(this.allNewCollections);
    }

    private async getOldDisc(oldDiscId: string, persistence: Persistence) {
        try {
            return await persistence.getDisc(oldDiscId);
        } catch (error) {
            if (error instanceof NotFoundError) {
                try {
                    return await this.googleDrivePersistence.getDisc(oldDiscId);
                } catch (googleDriverError) {
                    console.error(`On n'arrive pas à récupérer le disque ${oldDiscId} (même depuis Google Drive)`, googleDriverError);
                }
            } else {
                throw error;
            }
        }
    }

    protected async saveAllNewCollections() {
        await this.collectionService.save();
    }

    private getNewDiscId(oldDisc: Disc): string {
        const videoIdSet = new Set(oldDisc.files.map(file => file.videoId));
        for (const videoId of videoIdSet) {
            const newDiscId = this.mappedDiscService.getFirstDiscIdMappedToVideoId(videoId);
            if (newDiscId) {
                return newDiscId;
            } else {
                console.error(`Aucun disque mappé à la vidéo ${videoId}`);
            }
        }
        console.error(`Aucun disque mappé à l'ancien disque ${oldDisc.id}`);
    }
}

export function convertCollection(oldCollection: Collection, allOldDiscsById: Record<string, Disc[]>, mappedDiscService: YouTubeMappedDiscService): Collection {
    const newCollection = new Collection(oldCollection.name);
    for (const oldDiscId of oldCollection.discIds) {
        const oldDiscs = allOldDiscsById[oldDiscId];
        if (oldDiscs?.length !== 1) {
            console.error(`On s'attend à trouver un disque et un seul pour ${oldDiscId}`);
            continue;
        }
        const oldDisc = oldDiscs[0];

        for (const file of oldDisc.files) {
            const videoId = file.videoId;
            const newDiscId = mappedDiscService.getFirstDiscIdMappedToVideoId(videoId);
            if (!newDiscId) {
                console.error(`Aucun disque trouvé pour la vidéo ${videoId}`);
                continue;
            }
            newCollection.discIds.push(newDiscId);
        }
    }
    return newCollection;
}
