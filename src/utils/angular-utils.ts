import {computed, inject, Signal} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';

export function getRouteOrQueryParam(name: string, route: ActivatedRouteSnapshot): string | undefined {
    return route.paramMap.get(name) ?? route.queryParamMap.get(name);
}

export function injectActivatedRouteParam(key: string): Signal<string> {
    const route = inject(ActivatedRoute);
    const paramMap = toSignal(route.paramMap, {requireSync: true});
    return computed(() => paramMap().get(key));
}

export function injectActivatedRouteData<T>(key: string): Signal<T> {
    const route = inject(ActivatedRoute);
    const data = toSignal(route.data, {requireSync: true});
    return computed(() => data()[key]);
}
