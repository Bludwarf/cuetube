// Provider function for consumers
import {computed, inject, InjectionToken, Provider, Signal} from '@angular/core';
import Collection from '../../Collection';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';

// token to access a stream with the information you need
const COLLECTION = new InjectionToken<Signal<Collection>>(
    'Collection courante'
);

export function provideCollection(): Provider {
    return {
        provide: COLLECTION,
        useFactory: collectionFactory,
    };
}

function collectionFactory(): Signal<Collection> {
    const route = inject(ActivatedRoute);
    const data = toSignal(route.data, {requireSync: true});
    return computed(() => data().collection as Collection);
}

// À utiliser directement dans le composant consommateur mais pas dans la route, ni dans les providers globaux (sinon => undefined)
export function injectCollection(): Signal<Collection> {
    return inject(COLLECTION);
}
