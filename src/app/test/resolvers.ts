import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import Collection from '../../Collection';
import {inject, Signal} from '@angular/core';
import {PersistenceService} from '../persistence/persistence.service';
import {injectActivatedRouteData} from '../../utils/angular-utils';
import {Disc} from '../../disc';
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
