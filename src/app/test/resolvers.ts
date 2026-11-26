import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject, Signal} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {getRouteOrQueryParam, injectActivatedRouteData} from '../../utils/angular-utils';
import {Disc} from '../../disc';
import {Disc as Disc2026} from '../../refacto-2026/disc';
import {Persistence} from '../../persistence';
import {DiscService} from '../../refacto-2026/disc.service';
import {YouTubeMappedDiscService} from '../../refacto-2026/you-tube-mapped-disc.service';
import {MappedDisc} from '../../refacto-2026/mapped-disc';
import {ExternalTrack} from '../../refacto-2026/external-track';
import Track = Disc.Track;

export const trackResolver: ResolveFn<Track> = async (
    route: ActivatedRouteSnapshot,
) => {
    const discId = getRouteOrQueryParam('discId', route);
    const persistenceService = inject(PersistenceService);
    const persistence = await persistenceService.getCurrentPersistenceAndInit();
    const disc = await persistence.getDisc(discId);

    const trackNumber = Number(getRouteOrQueryParam('trackNumber', route));
    return disc.getTrackByNumber(trackNumber);
};

export const TRACK = 'track';

// Alternative sans injection de provider à injectCollection()
export function injectTrack(): Signal<Track> {
    return injectActivatedRouteData(TRACK);
}

async function getABTrack(ab: 'a' | 'b', persistence: Persistence, route: ActivatedRouteSnapshot) {
    const discId = getRouteOrQueryParam(`${ab}d`, route);
    const disc = await persistence.getDisc(discId);
    const trackNumber = Number(getRouteOrQueryParam(`${ab}t`, route));
    return disc.getTrackByNumber(trackNumber);
}

type ABTracks = [Track, Track];
export const abTracksResolver: ResolveFn<ABTracks> = async (
    route: ActivatedRouteSnapshot,
) => {
    const persistenceService = inject(PersistenceService);
    const persistence = await persistenceService.getCurrentPersistenceAndInit();

    return [
        await getABTrack('a', persistence, route),
        await getABTrack('b', persistence, route),
    ];
};

export const AB_TRACKS = 'abTracks';

// Alternative sans injection de provider à injectCollection()
export function injectABTracks(): Signal<ABTracks> {
    return injectActivatedRouteData(AB_TRACKS);
}


export const DISC = 'disc';

export const discResolver: ResolveFn<Disc2026> = async (
    route: ActivatedRouteSnapshot,
): Promise<Disc2026> => {
    const discService = inject(DiscService);
    const discId = getRouteOrQueryParam('id', route);
    return discService.getDisc(discId);
};

// Alternative sans injection de provider à injectCollection()
export function injectDisc(): Signal<Disc2026> {
    return injectActivatedRouteData(DISC);
}


export const MAPPED_DISC = 'mappedDisc';

export const mappedDiscResolver: ResolveFn<MappedDisc> = (
    route: ActivatedRouteSnapshot,
): MappedDisc => {
    const discService = inject(DiscService);
    const mappedDiscService = inject(YouTubeMappedDiscService);

    const discId = getRouteOrQueryParam('id', route);
    const disc = discService.getDisc(discId);
    return mappedDiscService.getMappedDisc(discId, disc);
};

// Alternative sans injection de provider à injectCollection()
export function injectMappedDisc<I extends ExternalTrack>(): Signal<MappedDisc> {
    return injectActivatedRouteData(MAPPED_DISC);
}
