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
import {hideLoader} from '../app.component';
import {DiscService} from '../../refacto-2026/disc.service';
import {MappedDiscService} from '../../refacto-2026/mapped-disc.service';
import {MappedDisc} from '../../refacto-2026/mapped-disc';
import Track = Disc.Track;
import {YouTubeMappedDiscService} from '../../refacto-2026/you-tube-mapped-disc.service';

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
    private readonly discService = inject(DiscService);
    private readonly mappedDiscService = inject(YouTubeMappedDiscService);
    protected readonly collection = injectCollection();
    discs: Signal<Disc[]>;
    currentTrackInput = input<Track>();
    currentDisc = computed(() => this.currentTrackInput()?.disc);
    /** disque ouvert dans la liste des pistes (tooltip) */
    discInTracklist: Disc;

    protected discIds: string[];

    protected readonly Object = Object;

    // private readonly checkboxSelector: CheckboxSelector<Track>;
    protected mappedDiscsById: Map<string, MappedDisc>;

    constructor() {
        this.discs = toSignal(
            toObservable(this.collection).pipe(
                switchMap(collection =>
                    from(this.findDiscs(collection))
                )
            )
        );

        this.discIds = this.discService.getDiscIds();
    }

    async ngOnInit() {
        // TODO juste pour tester
        await this.initMappedDiscs();
    }

    private async initMappedDiscs() {
        const mappedDiscsById = new Map<string, MappedDisc>();
        for (const discId of this.discIds) {
            const disc = this.discService.getDisc(discId);
            const mappedDisc = this.mappedDiscService.getMappedDisc(discId, disc);
            mappedDiscsById.set(discId, mappedDisc);
        }
        this.mappedDiscsById = mappedDiscsById;
    }

    async findDiscs(collection: Collection): Promise<Disc[]> {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        const discs = await persistence.findDiscs(collection.discIds);
        hideLoader();
        return discs;
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

    // TODO attention on mélange discId ancienne et nouvelle version (2026)
    protected getDiscIcon(discId: string): URL {
        // const mappedDisc = this.mappedDiscService.getMappedDisc(discId);
        // return mappedDisc.icon;
        return undefined;
    }

}
