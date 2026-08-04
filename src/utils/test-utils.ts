import {GapiClientService} from '../app/gapi-client.service';
import createSpyObj = jasmine.createSpyObj;
import {LocalStoragePrefsService} from '../app/local-storage-prefs.service';

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
