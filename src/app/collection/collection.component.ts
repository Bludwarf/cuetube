import {Component, computed, inject, input, OnInit, Signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import Collection from '../../Collection';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Disc} from '../../disc';
import {HttpClient} from '@angular/common/http';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {AppComponent} from '../app.component';
import {from} from 'rxjs';
import {stopPropagation} from '../../utils/utils';
import {injectCollection, provideCollection} from './collection.providers';
import {filter, switchMap, tap} from 'rxjs/internal/operators';
import Track = Disc.Track;

@Component({
    selector: 'app-collection',
    imports: [
        ReactiveFormsModule,
        FormsModule
    ],
    providers: [
        provideCollection(), // TODO essayer de le déplacer sans provoquer collection() => undefined
    ],
    templateUrl: './collection.component.html',
    styleUrl: './collection.component.css',
})
export class CollectionComponent implements OnInit {

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
        // FIXME il faudrait plutôt passer la persistence de l'extérieur
        const httpClient = inject(HttpClient);
        const localPersistence = new LocalStoragePersistence(httpClient);
        const persistence = AppComponent.getPersistence(localPersistence, httpClient);

        this.discs = toSignal(
            toObservable(this.collection).pipe(
                tap(collection => console.log('collection1', collection)),
                filter(collection => collection !== undefined),
                tap(collection => console.log('collection2', collection)),
                switchMap(collection =>
                    from(Promise.all(collection.discIds.map(id => persistence.getDisc(id))))
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
