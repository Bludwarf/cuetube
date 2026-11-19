import Collection from '../../Collection';
import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject, Signal} from '@angular/core';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {AppComponent} from '../app.component';
import {HttpClient} from '@angular/common/http';
import {injectActivatedRouteData} from '../../utils/angular-utils';
import {PersistenceService} from '../persistence/persistence.service';

export const collectionResolver: ResolveFn<Collection> = (
    route: ActivatedRouteSnapshot,
) => {
    const persistenceService = inject(PersistenceService);
    const persistence = persistenceService.getCurrentPersistence();
    const collectionName = route.paramMap.get('name');
    return persistence.getCollection(collectionName);
};

// Alternative sans injection de provider à injectCollection()
export function injectCollection(): Signal<Collection> {
    return injectActivatedRouteData('collection');
}
