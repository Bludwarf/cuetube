// Provider function for consumers
import {inject, InjectionToken, Provider} from '@angular/core';
import Collection from '../../Collection';
import {BehaviorSubject} from 'rxjs';

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
