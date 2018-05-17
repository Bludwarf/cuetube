import {Component, NgZone, OnInit} from '@angular/core';
import {Disc} from '../../disc';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {HttpClient} from '@angular/common/http';
import {GapiClientService} from '../gapi-client.service';
import {GoogleDrivePersistence} from '../../persistence/GoogleDrivePersistence';
import {LocalServerPersistence} from '../../persistence/LocalServerPersistence';
import {Persistence} from '../../persistence';
import * as _ from 'underscore';
import {yth} from '../../yt-helper';
import {AppComponent} from '../app.component';

@Component({
    selector: 'app-edit-cue',
    templateUrl: './edit-cue.component.html',
    styleUrls: ['./edit-cue.component.css']
})
export class EditCueComponent implements OnInit {

    private localPersistence: LocalStoragePersistence;
    public googleDrivePersistence: GoogleDrivePersistence; // debug
    private persistence: Persistence;
    disc: Disc;
    /** true si le disque n'existe pas encore */
    public creationMode = false;

    /** les tracklistes sous forme textuel pour import ou export vers YouTube par file */
    tracklists: string[];

    constructor(public http: HttpClient, private gapiClient: GapiClientService, private zone: NgZone) {
    }

    ngOnInit() {
        this.localPersistence = new LocalStoragePersistence(this.http);
        this.persistence = this.getPersistence();
        console.log('persistence =', this.persistence);
        /** true si le disque n'existe pas encore */
        let creationMode = false;

        const params = {
            id: getParameterByName('id')
        };
        if (!params.id) {
            alert("Veuillez indiquer l'id du disque à modifier");
            return;
        }
        this.persistence.init({gapiClient: this.gapiClient}).then(isInit => this.persistence.getDisc(params.id, 0)).then(disc => {
            this.disc = disc;
            this.showPlayer();
            this.zone.run(() => {});
        }).catch(err => {

            // On est peut-être en train de créer ce disque ?
            const cue = new cuesheet.CueSheet();
            _.extend(cue, this.localPersistence.getItem("discToCreate"));
            const discToCreate = new Disc(cue);
            if (discToCreate && discToCreate.id === params.id) {
                creationMode = true;
                console.log("Le disque n'existe pas encore mais il va être créé");
                this.disc = discToCreate;
                this.showPlayer();
                this.zone.run(() => {});
            }

            // En fait non
            else {
                console.error(err);
                alert(`Disque ${params.id} introuvable !\n\nErreur technique : ${err.data || err}`);
            }
        });
    }

    // TODO : remonter dans app
    getPersistence(): Persistence {
        return AppComponent.getPersistence(this.localPersistence, this.http);
    }

    save() {
        this.persistence.postDisc(this.disc.id, this.disc).then(disc => {
            alert('Disque sauvegardé !');
            if (this.creationMode) {
                this.creationMode = false;
                localStorage.removeItem('discToCreate');
                prompt("Le disque est maintenant créé vous pouvez l'ajouter dans CueTube avec cette URL :", this.disc.url);
            }
        }).catch(err => {
            console.error(err);
            alert("Disque non sauvegardé à cause de l'erreur : "+(err && err.message || err));
        });
    }

    getTracklist(tracks) {
        return yth.getTracklist(tracks);
    }

    prompt(text, placeholder) {
        return prompt(text, placeholder);
    }

    setTracklist(tracklist, file) {
        yth.setTracklist(tracklist, file);
    }
    setTracklistFromButton($event, file) {
        const button = $event.currentTarget;
        const $textarea = $('textarea', button.parent);
        this.setTracklist($textarea.val(), file);
    }

    // TODO : remonter dans app
    showPlayer() {
        this.$foregroundIcon.html('<span class=\'glyphicon glyphicon-play\'></span>');
        this.$foreground.hide();
    }

    // TODO : remonter dans app
    hidePlayer(pauseButton = false) {
        if (pauseButton) {
            this.$foregroundIcon.html(`<span class="glyphicon glyphicon-pause"></span>`);
        } else {
            this.$foregroundIcon.html(`<div id="foreground-overlay-icon" class="center font-size-50p"></div>`);
        }
        this.$foreground.show();
    }

    // TODO : remonter dans app
    get $foreground() {
        return $('#foreground-overlay');
    }

    // TODO : remonter dans app
    get $foregroundIcon() {
        return $('#foreground-overlay-icon');
    }

}
