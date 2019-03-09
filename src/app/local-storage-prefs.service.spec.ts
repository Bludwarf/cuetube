import { TestBed, inject } from '@angular/core/testing';

import { LocalStoragePrefsService } from './local-storage-prefs.service';

describe('LocalStoragePrefsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalStoragePrefsService]
    });
  });

  it('should be created', inject([LocalStoragePrefsService], (service: LocalStoragePrefsService) => {
    expect(service).toBeTruthy();
  }));
});
