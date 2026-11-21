import Collection from '../../Collection';
import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject, Signal} from '@angular/core';
import {injectActivatedRouteData} from '../../utils/angular-utils';
import {PersistenceService} from '../persistence/persistence.service';

export const collectionResolver: ResolveFn<Collection> = async (
    route: ActivatedRouteSnapshot,
) => {
    const persistenceService = inject(PersistenceService);
    const persistence = await persistenceService.getCurrentPersistenceAndInit();
    const collectionName = route.paramMap.get('name');
    return persistence.getCollection(collectionName);
};

// Alternative sans injection de provider à injectCollection()
export function injectCollection(): Signal<Collection> {
    return injectActivatedRouteData('collection');
}
