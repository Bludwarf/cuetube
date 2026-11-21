import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GoogleDriveButtonComponent} from './google-drive-button.component';

describe('GoogleDriveButtonComponent', () => {
    let component: GoogleDriveButtonComponent;
    let fixture: ComponentFixture<GoogleDriveButtonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GoogleDriveButtonComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GoogleDriveButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
