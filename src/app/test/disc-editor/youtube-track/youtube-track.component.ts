import {Component, input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AlbumVideoTrackComponent} from './album-video-track/album-video-track.component';
import {AlbumVideoTrack, YouTubeTrack} from '../../../../google/youtube/track';

@Component({
    selector: 'app-youtube-track',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        AlbumVideoTrackComponent
    ],
    templateUrl: './youtube-track.component.html',
    styleUrl: './youtube-track.component.css',
})
export class YoutubeTrackComponent {
    track = input<YouTubeTrack>();

    protected isAlbumVideoTrack(track: YouTubeTrack): track is AlbumVideoTrack {
        return track instanceof AlbumVideoTrack;
    }

}
