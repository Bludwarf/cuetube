import {Disc} from '../../disc';
import {MBID} from '../musicbrainz/types';
import {RecordingRepository} from '../musicbrainz/recording-repository';
import {CollectionRepository} from '../musicbrainz/collection-repository';
import Track = Disc.Track;

export interface TrackFilter {
    accepts(track: Track): boolean;
}

export class TrackTitleContainingFilter implements TrackFilter {

    constructor(
        private readonly titles: string[],
    ) {
    }

    accepts(track: Track): boolean {
        if (!track.title) {
            return false;
        }
        return this.titles.some(title => track.title.includes(title));
    }
}

export class DiscTitleCFilter implements TrackFilter {

    constructor(
        private readonly titles: string[],
    ) {
    }

    accepts(track: Track): boolean {
        const discTitle = track.disc.title;
        return this.titles.some(title => discTitle === title);
    }
}

export class AllTracksFilter implements TrackFilter {
    accepts(_track: Disc.Track): boolean {
        return true;
    }
}

export class OrTrackFilter implements TrackFilter {
    private readonly filters: TrackFilter[];

    constructor(
        ...filters: TrackFilter[]
    ) {
        this.filters = filters;
    }

    accepts(track: Disc.Track): boolean {
        return this.filters.some(filter => filter.accepts(track));
    }
}

export class MusicBrainzTrackFilter implements TrackFilter {
    constructor(
        public readonly mbid: MBID,
        /** @deprecated TODO en attendant de brancher l'API MusicBrainz */
        public readonly title: string,
        private readonly collectionRepository: CollectionRepository,
        private readonly recordingRepository: RecordingRepository,
    ) {
    }

    accepts(track: Disc.Track): boolean {
        const tracksMbids = this.collectionRepository.get(this);
        if (!tracksMbids) {
            return false;
        }

        const trackMbid = this.getTrackMbid(track);
        if (!trackMbid) {
            return false;
        }

        return tracksMbids.includes(trackMbid);
    }

    private getTrackMbid(track: Disc.Track): MBID | undefined {
        return this.recordingRepository.get(track);
    }

}
