// Provider function for consumers
import {computed, inject, InjectionToken, Provider, Signal} from '@angular/core';
import Collection from '../../Collection';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';

// token to access a stream with the information you need
const COLLECTION = new InjectionToken<Signal<Collection>>(
    'Collection courante'
);

export const COLLECTION_PROVIDERS: Provider[] = [
    {
        provide: COLLECTION,
        useFactory: collectionFactory,
    },
];

function collectionFactory(): Signal<Collection> {
    const route = inject(ActivatedRoute);
    const data = toSignal(route.data, {requireSync: true});
    return computed(() => data().collection as Collection);
}

export function injectCollection(): Signal<Collection> {
    return inject(COLLECTION);
}
