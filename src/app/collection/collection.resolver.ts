import Collection from '../../Collection';
import {ActivatedRouteSnapshot, ResolveFn} from '@angular/router';
import {inject} from '@angular/core';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {AppComponent} from '../app.component';
import {HttpClient} from '@angular/common/http';

export const collectionResolver: ResolveFn<Collection> = (
    route: ActivatedRouteSnapshot,
) => {
    const httpClient = inject(HttpClient);
    const localPersistence = new LocalStoragePersistence(httpClient);
    const persistence = AppComponent.getPersistence(localPersistence, httpClient);
    const collectionName = route.paramMap.get('name');
    return persistence.getCollection(collectionName);
};
