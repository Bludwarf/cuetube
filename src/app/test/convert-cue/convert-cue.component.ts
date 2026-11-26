import {Component, inject, OnInit} from '@angular/core';
import {injectCue} from '../cue.resolver';
import {hideLoader} from '../../app.component';
import {MappedDisc} from '../../../refacto-2026/mapped-disc';
import {Disc} from '../../../refacto-2026/disc';
import {Disc as Cue} from '../../../disc';
import {AlbumVideoTrack, SingleVideoTrack, YouTubeTrack} from '../../../google/youtube/track';
import {YouTubeVideo} from '../../../google/youtube/video';
import {DiscService} from '../../../refacto-2026/disc.service';
import {RouterLink} from '@angular/router';
import {YouTubeMappedDiscService} from '../../../refacto-2026/you-tube-mapped-disc.service';


@Component({
    selector: 'app-convert-cue',
    imports: [
        RouterLink
    ],
    templateUrl: './convert-cue.component.html',
    styleUrl: './convert-cue.component.css',
})
export class ConvertCueComponent implements OnInit {

    protected cue = injectCue();
    protected mappedDisc: MappedDisc;
    private discService = inject(DiscService);
    private mappedDiscService = inject(YouTubeMappedDiscService);
    protected discId: string;

    ngOnInit(): void {
        hideLoader();
    }

    protected convert(cue: Cue): void {
        this.mappedDisc = convertCue(cue);
    }

    protected async save(mappedDisc: MappedDisc) {
        this.discId = Disc.suggestId(mappedDisc.disc.title);
        this.discService.setDisc(this.discId, mappedDisc.disc);
        this.mappedDiscService.setMappedDisc(this.discId, mappedDisc);

        await this.discService.save();
        await this.mappedDiscService.save();
    }

}

export function convertCue(cue: Cue) {
    const disc = new Disc(cue.title);
    const externalTracks: YouTubeTrack[] = [];

    for (const file of cue.files) {
        const video = new YouTubeVideo(file.videoId);
        const multiTrackVideo = file.tracks.length > 1;
        for (const track of file.tracks) {
            disc.newTrack(track.title);
            const youTubeTrack = multiTrackVideo
                ? new AlbumVideoTrack(video, getTime(track))
                : new SingleVideoTrack(video);
            externalTracks.push(youTubeTrack);
        }
    }

    return MappedDisc.fromExternalTracks(disc, externalTracks);
}

export function getTime(track: Cue.Track): number {
    const index = track.indexes[0];
    return index.time.min * 60 + index.time.sec + index.time.frame / 75; // TODO à factoriser (3 occurences)
}
