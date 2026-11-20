import {Component, computed, inject, input, OnInit, Signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import Collection from '../../Collection';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Disc} from '../../disc';
import {from} from 'rxjs';
import {stopPropagation} from '../../utils/utils';
import {switchMap} from 'rxjs/internal/operators';
import {GoogleDriveButtonComponent} from '../google-drive/google-drive-button/google-drive-button.component';
import {RouterLink} from '@angular/router';
import {injectCollection} from './collection.resolver';
import {PersistenceService} from '../persistence/persistence.service';
import Track = Disc.Track;

@Component({
    selector: 'app-collection',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        GoogleDriveButtonComponent,
        RouterLink
    ],
    templateUrl: './collection.component.html',
    styleUrl: './collection.component.css',
})
export class CollectionComponent implements OnInit {

    private readonly persistenceService = inject(PersistenceService);
    protected readonly collection = injectCollection();
    discs: Signal<Disc[]>;
    currentTrackInput = input<Track>();
    currentDisc = computed(() => this.currentTrackInput()?.disc);
    /** disque ouvert dans la liste des pistes (tooltip) */
    discInTracklist: Disc;

    protected readonly Object = Object;

    // private readonly checkboxSelector: CheckboxSelector<Track>;

    // TODO : remonter dans app
    get $foreground() {
        return $('#foreground-overlay');
    }

    constructor() {
        const persistence = this.persistenceService.getCurrentPersistence();
        this.discs = toSignal(
            toObservable(this.collection).pipe(
                switchMap(collection =>
                    from(Promise.all(collection.discIds
                        .map(id => {
                            try {
                                return persistence.getDisc(id);
                            } catch (e) {
                                console.error(`On ignore le disque suivant, car il est introuvable : ${id}`);
                                return undefined;
                            }
                        })
                        .filter(Boolean)
                    ))
                )
            )
        );
    }

    ngOnInit() {
        this.$foreground.hide();
    }

    /**
     * Création d'un nouveau disque à partir d'une vidéo ou d'une playlist YouTube
     * @param url URL de la vidéo/playlist, si vide alors, on demande à l'utilisateur
     * @param cb callback
     */
    async createNewDiscFromVideoOrPlaylist(url?: string, cb?: { (collection: Collection) }) {
        // TODO
    }

    protected readonly stopPropagation = stopPropagation;

    protected removeDisc(disc: Disc) {
        // TODO
    }

    protected loadTrack(track: Disc.Track) {
        // TODO
    }

}
