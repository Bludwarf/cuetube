import {Disc} from '../../disc';
import {copyToClipboard, remove} from '../../utils/utils';
import {CollectionRepository} from '../musicbrainz/collection-repository';
import {RecordingRepository} from '../musicbrainz/recording-repository';
import {Persistence} from '../../persistence';
import {computeHash, TrackHash} from '../test/elo/types';
import Track = Disc.Track;

export interface TrackFilter {
    // On évite de renvoyer undefined, car ça perturbe le filtrage des pistes dans le lecteur
    accepts(track: Track): boolean;
}

export interface EditableTrackFilter extends TrackFilter {
    toggle(track: Track): void;

    export(persistence: Persistence): Promise<void>;
}

export function isEditableTrackFilter(trackFilter: TrackFilter): trackFilter is EditableTrackFilter {
    const key: keyof EditableTrackFilter = 'toggle';
    return key in trackFilter;
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
        public readonly mbid: string,
        /** @deprecated TODO en attendant de brancher l'API MusicBrainz */
        public readonly title: string,
        private readonly collectionRepository: CollectionRepository,
        private readonly recordingRepository: RecordingRepository,
    ) {
    }

    accepts(track: Disc.Track): boolean {
        // TODO charger les données à la création, plutôt qu'à chaque appel à accepts()
        // const tracksMbids = await this.collectionRepository.get(this);
        // if (!tracksMbids) {
        //     return false;
        // }
        //
        // const trackMbid = await this.getTrackMbid(track);
        // if (!trackMbid) {
        //     return false;
        // }
        //
        // return tracksMbids.includes(trackMbid);
        return false;
    }

    private getTrackMbid(track: Disc.Track): Promise<string | undefined> {
        return this.recordingRepository.get(track);
    }

}

export class HashTrackFilter implements EditableTrackFilter {
    constructor(
        private readonly hashes: TrackHash[],
    ) {
    }

    static computeHash(track: Disc.Track): TrackHash {
        return computeHash(track);
    }

    static async parseHash(hash: TrackHash, persistence: Persistence): Promise<Disc.Track> {
        const [videoId, trackNumberString] = hash.split(':');
        const disc = await persistence.getDisc(videoId);
        return disc.getTrackByNumber(+trackNumberString);
    }

    accepts(track: Disc.Track): boolean {
        const trackHash = HashTrackFilter.computeHash(track);
        return this.hashes.includes(trackHash);
    }

    toggle(track: Disc.Track) {
        const trackHash = HashTrackFilter.computeHash(track);
        if (this.hashes.includes(trackHash)) {
            remove(trackHash, this.hashes);
        } else {
            this.hashes.push(trackHash);
        }
    }

    async export(persistence: Persistence): Promise<void> {
        const lines: string[] = [];

        const sortedHashes = [...this.hashes];
        sortedHashes.sort();

        for (const hash of sortedHashes) {
            const track = await HashTrackFilter.parseHash(hash, persistence);
            lines.push(`'${hash}', // ${track.disc.title} - ${track.number}. ${track.title}`);
        }

        await copyToClipboard(lines.join('\r\n'));
    }
}
