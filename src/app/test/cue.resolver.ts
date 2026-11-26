import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject, Signal} from '@angular/core';
import {getRouteOrQueryParam, injectActivatedRouteData} from '../../utils/angular-utils';
import {PersistenceService} from '../persistence/persistence.service';
import {Disc} from '../../disc';

export const CUE = 'cue';

export const cueResolver: ResolveFn<Disc> = async (
    route: ActivatedRouteSnapshot,
): Promise<Disc> => {
    const persistenceService = inject(PersistenceService);
    const cueId = getRouteOrQueryParam('id', route);
    const persistence = await persistenceService.getCurrentPersistenceAndInit();
    return persistence.getDisc(cueId);
};

// Alternative sans injection de provider à injectCollection()
export function injectCue(): Signal<Disc> {
    return injectActivatedRouteData(CUE);
}
