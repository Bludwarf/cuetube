import {inject, Injectable} from '@angular/core';
import {Disc as Disc2026, Disc} from './disc';
import {NotFoundError} from '../persistence';
import {downloadFile} from '../utils/file-utils';
import {mapToJson, mapValues} from '../utils/map-utils';
import {PersistenceService} from '../app/persistence/persistence.service';
import {PersistedService} from './persisted-service';

@Injectable({providedIn: 'root'})
export class DiscService implements PersistedService {

    private discsById: Map<string, Disc>;
    private persistenceService = inject(PersistenceService);

    // Lancé uniquement au démarrage de l'appli
    async load(): Promise<void> {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const discDtosById = await persistence.getDiscs2026();

        if (this.discsById) {
            throw new Error(`load avec que déjà load`);
        }
        this.discsById = new Map();
        for (const discId in discDtosById) {
            const discDto = discDtosById[discId];
            const disc = this.createDisc(discDto);
            this.discsById.set(discId, disc);
        }
    }

    private createDisc(jsonDisc: DiscDto): Disc {
        const disc = new Disc2026(jsonDisc.title);
        for (const trackTitle of jsonDisc.tracks) {
            disc.newTrack(trackTitle);
        }
        return disc;
    }

    getDisc(id: string): Disc {
        if (!this.discsById.has(id)) {
            throw new NotFoundError(`Disque ${id} introuvable`);
        }
        return this.discsById.get(id);
    }

    getDiscIds(): string[] {
        return [...this.discsById.keys()];
    }

    setDisc(discId: string, disc: Disc) {
        if (!discId) {
            throw new Error(`discId obligatoire`);
        }
        // TODO confirmer si remplacement ?
        this.discsById.set(discId, disc);
    }

    async save() {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const jsonDiscs = mapValues(this.discsById, disc => ({
            title: disc.title,
            tracks: disc.tracks.map(track => track.title),
        }));
        await persistence.postDiscs2026(jsonDiscs);
    }

    export() {
        downloadFile('discs.json', mapToJson(this.discsById, disc => ({
            title: disc.title,
            tracks: disc.tracks.map(track => track.title),
        })));
    }

    changeDiscId(discId: string, newDiscId: string) {
        if (!this.discsById.has(discId)) {
            throw new Error(`Aucun disque à l'ID ${discId}`);
        }
        this.discsById.set(newDiscId, this.discsById.get(discId));
        this.removeDisc(discId);
    }

    removeDisc(discId: string) {
        this.discsById.delete(discId);
    }
}

export interface DiscDto {
    title: string;
    tracks: Array<string | null>; // null si piste sans titre
}
