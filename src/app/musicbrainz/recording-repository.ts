import {Disc} from '../../disc';
import {Repository} from './repository';
import {ReleaseIdRepository} from './release-id-repository';
import {ReleaseRepository} from './release-repository';
import {IRelease} from 'musicbrainz-api';
import Track = Disc.Track;

export class RecordingRepository extends Repository<Track, string> {

    constructor(
        inputTypeTitle: string,
        private readonly releaseIdRepository: ReleaseIdRepository,
        private readonly releaseRepository: ReleaseRepository,
    ) {
        super(inputTypeTitle);
    }

    protected async search(track: Track): Promise<string | undefined> {
        const releaseId = await this.getReleaseId(track.disc);

        // On a retrouvé l'ID du disque dans MusicBrainz ?
        if (releaseId) {
            // TODO on se base sur le numéros de piste, pour l'instant, mais c'est fragile
            const release = await this.getRelease(releaseId);
            console.debug('release', release);
            const mediaListWithTracks = release.media.filter(media => media.tracks?.length);
            if (mediaListWithTracks.length === 1) { // TODO != 1 ?
                const tracks = mediaListWithTracks[0].tracks;
                console.debug('tracks', tracks);
                const foundTrack = tracks.find(itrack => itrack.number === String(track.number));
                if (foundTrack) {
                    return foundTrack.recording.id;
                }
            }
        }

        return undefined;
    }

    protected getInputTitle(track: Track): string {
        return track.title;
    }

    protected computeHash(track: Track): string {
        return `${track.disc.id}:${track.number}`;
    }

    private getReleaseId(disc: Disc): Promise<string> {
        return this.releaseIdRepository.get(disc);
    }

    private getRelease(mbid: string): Promise<IRelease> {
        return this.releaseRepository.get(mbid);
    }

}
