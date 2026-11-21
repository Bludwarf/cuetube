import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EloMatchComponent} from './elo-match.component';

describe('EloMatchComponent', () => {
    let component: EloMatchComponent;
    let fixture: ComponentFixture<EloMatchComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EloMatchComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EloMatchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
