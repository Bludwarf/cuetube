import {ActivatedRoute} from '@angular/router';
import {ProviderToken} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {getAssetFile} from '../../utils/file-utils';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

/**
 * @param filePath Doit être déclaré dans "files" du fichier karma.conf.js
 */
export function getKarmaFile(filePath: string, fileName = filePath): Promise<File> {
    return getAssetFile('base/' + filePath, fileName);
}

export const PROVIDER_SPIES = {
    ActivatedRoute: {
        provide: ActivatedRoute,
        useValue: createSpyObj<ActivatedRoute>('ActivatedRoute', [
            'params',
            'queryParams',
        ]),
    },
};

export function injectSpy<T>(token: ProviderToken<T>): SpyObj<T> {
    return TestBed.inject(token) as SpyObj<T>;
}

export function createSpyHTMLElement(): SpyObj<HTMLElement> {
    return createSpyObj<HTMLElement>('HTMLElement', [
        'getBoundingClientRect',
    ]);
}
