import {Component, input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AlbumVideoTrack} from '../../../../../google/youtube/track';

@Component({
    selector: 'app-album-video-track',
    imports: [
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './album-video-track.component.html',
    styleUrl: './album-video-track.component.css',
})
export class AlbumVideoTrackComponent {
    track = input<AlbumVideoTrack>();
}
