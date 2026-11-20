// Provider function for consumers
import {computed, inject, InjectionToken, Provider, Signal} from '@angular/core';
import Collection from '../../Collection';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {BehaviorSubject} from 'rxjs';
import {injectActivatedRouteData} from '../../utils/angular-utils';

// token to access a stream with the information you need
const COLLECTION = new InjectionToken<BehaviorSubject<Collection>>(
    'Nouvelle collection pour tester InjectionToken par route (et pas par composant)'
);

// À utiliser dans les providers de la route, pour partager un objet avec tous les composants
export function provideCollection(): Provider {
    return {
        provide: COLLECTION,
        useFactory: collectionFactory,
    };
}

function collectionFactory(): BehaviorSubject<Collection> {
    const collection = new Collection(`Nouvelle collection créée le ${new Date().toISOString()}`);
    return new BehaviorSubject(collection);
}

export function injectCollection(): BehaviorSubject<Collection> {
    return inject(COLLECTION);
}
