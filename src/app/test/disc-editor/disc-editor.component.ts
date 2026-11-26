import {Component, computed, effect, inject, OnInit} from '@angular/core';
import {injectMappedDisc} from '../resolvers';
import {FormsModule} from '@angular/forms';
import {hideLoader} from '../../app.component';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {Title} from '@angular/platform-browser';
import {ExternalTrack} from '../../../refacto-2026/external-track';
import {YoutubeTrackComponent} from './youtube-track/youtube-track.component';
import {AlbumVideoTrack, SingleVideoTrack, YouTubeTrack} from '../../../google/youtube/track';
import {YouTubeVideo} from '../../../google/youtube/video';
import {MappedDisc} from '../../../refacto-2026/mapped-disc';
import {DiscService} from '../../../refacto-2026/disc.service';
import {injectActivatedRouteParam} from '../../../utils/angular-utils';
import {YouTubeMappedDiscService} from '../../../refacto-2026/you-tube-mapped-disc.service';
import {notify} from '../../../utils/utils';

@Component({
    selector: 'app-disc-editor',
    imports: [
        FormsModule,
        MatIcon,
        MatIconButton,
        YoutubeTrackComponent,
    ],
    templateUrl: './disc-editor.component.html',
    styleUrl: './disc-editor.component.css',
})
export class DiscEditorComponent implements OnInit {
    protected mappedDisc = injectMappedDisc<ExternalTrack>();
    protected disc = computed(() => this.mappedDisc().disc);
    private discId = injectActivatedRouteParam('id');
    private discService = inject(DiscService);
    private mappedDiscService = inject(YouTubeMappedDiscService);

    private title = inject(Title);

    constructor() {
        effect(() => {
            this.title.setTitle(this.disc().title);
        });
    }

    ngOnInit() {
        hideLoader();
    }

    protected async save() {
        this.discService.setDisc(this.discId(), this.disc());
        this.mappedDiscService.setMappedDisc(this.discId(), this.mappedDisc());

        await this.discService.save();
        await this.mappedDiscService.save();
        notify('Disque sauvegardé');
    }

    protected export() {
        this.discService.export();
        this.mappedDiscService.export();
    }

    protected isYouTubeTrack(externalTrack: ExternalTrack): externalTrack is YouTubeTrack {
        return externalTrack instanceof YouTubeTrack;
    }

    protected mapToSingleVideoTrack(trackIndex: number, mappedDisc: MappedDisc): SingleVideoTrack {
        const video = new YouTubeVideo('');
        const externalTrack = new SingleVideoTrack(video); // TODO on pourrait vérifier si la vidéo est compatible (Single)
        mappedDisc.mapTrack(trackIndex, externalTrack);
        return externalTrack;
    }

    protected mapToAlbumVideoTrack(trackIndex: number, mappedDisc: MappedDisc): AlbumVideoTrack {
        const video = new YouTubeVideo('');
        const externalTrack = new AlbumVideoTrack(video, 0); // TODO on pourrait vérifier si la vidéo est compatible (Album)
        mappedDisc.mapTrack(trackIndex, externalTrack);
        return externalTrack;
    }
}
