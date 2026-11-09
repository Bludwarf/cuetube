import {Disc} from '../../disc';
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
        ... filters: TrackFilter[]
    ) {
        this.filters = filters;
    }

    accepts(track: Disc.Track): boolean {
        return this.filters.some(filter => filter.accepts(track));
    }
}
