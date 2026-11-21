import {Component, inject, NgZone, OnInit} from '@angular/core';
import {Disc} from '../../disc';
import {Persistence} from '../../persistence';
import * as _ from 'underscore';
import {LocalStoragePrefsService} from '../local-storage-prefs.service';
import {getParameterByName} from '../../utils/utils';
import {PersistenceService} from '../persistence/persistence.service';
import {hideLoader} from '../app.component';
import Track = Disc.Track;

@Component({
    selector: 'app-edit-cue',
    templateUrl: './edit-cue.component.html',
    styleUrls: ['./edit-cue.component.css'],
    standalone: false
})
export class EditCueComponent implements OnInit {

    private readonly persistenceService = inject(PersistenceService);
    private persistence: Persistence;
    disc: Disc;
    /** true si a commencé la création du disque depuis une autre page */
    public discToCreateFromOtherPage = false;

    /** Pistes à supprimer après la sauvegarde du disque */
    removedTracks: Track[] = [];

    constructor(
        private zone: NgZone,
        public prefs: LocalStoragePrefsService,
    ) {
    }

    async ngOnInit() {
        this.persistence = await this.persistenceService.getCurrentPersistenceAndInit();

        const params = {
            id: getParameterByName('id', undefined)
        };
        if (!params.id) {
            alert('Veuillez indiquer l\'id du disque à modifier');
            return;
        }

        this.disc = await this.getDisc(params.id);
        hideLoader();
        this.zone.run(() => {
        });

        // Détection de changement du disque
        this.prefs.discSaved.subscribe(() => window.document.location.reload());
        this.prefs.discPrefsSaved.subscribe(() => window.document.location.reload());
    }

    private async getDisc(discId: string) {
        try {
            return this.persistence.getDisc(discId);
        } catch {
            return this.getDiscToCreate(discId);
        }
    }

    private getDiscToCreate(discId: string) {
        // On est peut-être en train de créer ce disque ?
        const cue = new cuesheet.CueSheet();
        const discToCreateJson = localStorage.getItem('discToCreate');
        this.discToCreateFromOtherPage = !!discToCreateJson;

        if (!this.discToCreateFromOtherPage) {
            const discToCreate = new Disc(cue);

            if (!discToCreate.id) {
                discToCreate.id = discId;
            }
            if (!discToCreate.src) {
                discToCreate.src = `https://www.youtube.com/watch?v=${discId}`;
            }
            if (!discToCreate.files?.length) {
                this.newFile(discToCreate);
            }

            return discToCreate;

        } else {
            const discToCreate = JSON.parse(discToCreateJson) as Disc;
            _.extend(cue, discToCreate);
            return new Disc(cue);
        }
    }

    newFile(disc = this.disc) {
        const file = disc.newFile();
        file.newTrack();
    }

    async save() {
        this.disc.reIndexTracks();

        try {
            await this.persistence.saveDisc(this.disc);

            alert('Disque sauvegardé !');

            // Suppression des pistes dans les préférences
            if (this.prefs.hasDisc(this.disc.id)) {
                console.group('Suppression des pistes dans les préférences');
                this.removedTracks.forEach(removedTrack => this.prefs.removeTrack(removedTrack));
                console.groupEnd();
            }

            // TODO notif à l'appli principale via SharedWebWorkers pour éviter qu'elle n'écrase les modifs en quittant

            // TODO remplacer ce code par une notif via SharedWebWorkers

            if (this.discToCreateFromOtherPage) {
                localStorage.removeItem('discToCreate');
                prompt('Le disque est maintenant créé vous pouvez l\'ajouter dans CueTube avec cette URL :', this.disc.url);
            }
        } catch (err) {
            console.error(err);
            alert('Disque non sauvegardé à cause de l\'erreur : ' + (err && err.message || err));
        }
    }

    removeFile(file: Disc.File) {
        this.disc.removeFile(file);
    }

}
