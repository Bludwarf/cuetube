import {MappedDisc} from './mapped-disc';
import {ExternalTrack} from './external-track';
import {downloadFile} from '../utils/file-utils';
import {mapToJson, mapValues} from '../utils/map-utils';
import {Disc} from './disc';
import {inject} from '@angular/core';
import {PersistenceService} from '../app/persistence/persistence.service';
import {Persistence} from '../persistence';

export abstract class MappedDiscService<E extends ExternalTrack, J> {

    private readonly mappedDiscsByIdCache: Map<string, MappedDisc> = new Map();
    protected readonly persistenceService = inject(PersistenceService);

    // Lancé uniquement au démarrage de l'appli
    abstract load(): Promise<void>;

    getMappedDisc(discId: string, disc: Disc): MappedDisc | undefined {
        if (!this.mappedDiscsByIdCache.has(discId)) {
            const mappedDisc = this.mapDisc(discId, disc);
            this.mappedDiscsByIdCache.set(discId, mappedDisc);
        }
        return this.mappedDiscsByIdCache.get(discId);
    }

    private mapDisc(discId: string, disc: Disc): MappedDisc {
        const externalTracks = this.getExternalTracks(discId);
        if (externalTracks) {
            return MappedDisc.fromExternalTracks(disc, externalTracks);
        } else {
            return MappedDisc.withoutMappings(disc);
        }
    }

    protected abstract getExternalTracks(discId: string): E[] | undefined;

    setMappedDisc(discId: string, mappedDisc: MappedDisc) {
        this.mappedDiscsByIdCache.set(discId, mappedDisc);
    }

    protected abstract toJson(mappedDisc: MappedDisc): J;

    async save(): Promise<void> {
        console.log("super.mappedDiscsByIdCache", this.mappedDiscsByIdCache);
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const jsonValues = mapValues(this.mappedDiscsByIdCache, mappedDisc => this.toJson(mappedDisc));
        await this.saveValues(jsonValues, persistence);
    }

    changeDiscId(discId: string, newDiscId: string) {
        if (this.mappedDiscsByIdCache.has(discId)) { // On ne fait rien si absent, car c'est juste un cache
            this.mappedDiscsByIdCache.set(newDiscId, this.mappedDiscsByIdCache.get(discId));
            this.removeDisc(discId);
        }
    }

    removeDisc(discId: string) {
        this.mappedDiscsByIdCache.delete(discId);
    }

    protected abstract saveValues(jsonValues: Record<string, J>, persistence: Persistence): Promise<void>;

    export() {
        downloadFile('disc-mappings.json', mapToJson(this.mappedDiscsByIdCache, mappedDisc => this.toJson(mappedDisc)));
    }
}
