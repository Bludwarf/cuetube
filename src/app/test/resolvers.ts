import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject, Signal} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {injectActivatedRouteData} from '../../utils/angular-utils';
import {Disc} from '../../disc';
import {Persistence} from '../../persistence';
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

function getRouteOrQueryParam(name: string, route: ActivatedRouteSnapshot): string | undefined {
    return route.paramMap.get(name) ?? route.queryParamMap.get(name);
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
