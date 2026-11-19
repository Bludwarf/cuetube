import {computed, inject, Signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';

export function injectActivatedRouteData<T>(key: string): Signal<T> {
    const route = inject(ActivatedRoute);
    const data = toSignal(route.data, {requireSync: true});
    return computed(() => data()[key]);
}
