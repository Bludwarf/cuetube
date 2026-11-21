import {GapiClientService} from '../app/gapi-client.service';
import {LocalStoragePrefsService} from '../app/local-storage-prefs.service';
import createSpyObj = jasmine.createSpyObj;

export const PROVIDER_SPIES = {
    LocalStoragePrefsService: {
        provide: LocalStoragePrefsService, useValue: createSpyObj<LocalStoragePrefsService>('LocalStoragePrefsService', [
            'getDisc',
        ] as (keyof LocalStoragePrefsService)[]),
    },
    GapiClientService: {
        provide: GapiClientService, useValue: createSpyObj<GapiClientService>('GapiClientService', [
            'init',
        ] as (keyof GapiClientService)[]),
    },
};
