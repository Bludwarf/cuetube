import {Disc} from './disc';
import {ExternalTrack} from './external-track';

type MappedTracks = Array<ExternalTrack>;

export class MappedDisc {

    protected constructor(
        readonly disc: Disc,
        readonly mappedTracksByTrackIndex: Array<MappedTracks> = Array(disc.tracks.length),
    ) {
    }

    static fromExternalTracks(disc: Disc, externalTracks: Array<ExternalTrack>) {
        return this.withMappingBuilder(disc, (trackIndex) => {
            const externalTrack = externalTracks[trackIndex];
            if (!externalTrack) {
                throw new Error(`Piste externe inconnue pour la piste d'index ${trackIndex}`);
            }
            return [externalTrack];
        });
    }

    static withoutMappings(disc: Disc) {
        return this.withMappingBuilder(disc, () => []);
    }

    private static withMappingBuilder<E extends ExternalTrack>(disc: Disc, mappingBuilder: (trackIndex: number) => E[]) {
        const tracks = disc.tracks;
        const length = tracks.length;
        const mappedTracksByTrackIndex = Array(disc.tracks.length);
        for (let trackIndex = 0; trackIndex < length; trackIndex++) {
            mappedTracksByTrackIndex[trackIndex] = mappingBuilder(trackIndex);
        }
        return new MappedDisc(disc, mappedTracksByTrackIndex);
    }

    [Symbol.iterator]() {
        return this.mappedTracksByTrackIndex[Symbol.iterator]();
    }

    get icon(): URL {
        const mappedTracks = this.mappedTracksByTrackIndex?.[0];
        const firstMappedTrack = mappedTracks?.[0];
        return firstMappedTrack?.icon;
    }

    get playable(): boolean {
        const containsNotMappedTrack = this.mappedTracksByTrackIndex.some(mappedTracks => mappedTracks.length === 0);
        return !containsNotMappedTrack;
    }

    mapTrack<I extends ExternalTrack>(trackIndex: number, externalTrack: I) {
        const track = this.disc.tracks[trackIndex];
        if (!track) {
            throw new Error(`Piste d'index ${trackIndex} inconnue du disque ${this.disc.title}`);
        }
        const mappedTracks = this.mappedTracksByTrackIndex[trackIndex];
        mappedTracks.push(externalTrack);
    }
}
