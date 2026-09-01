import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TestComponent} from './test.component';
import {PROVIDER_SPIES} from './test-utils';

describe('TestComponent', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestComponent],
            providers: [
                PROVIDER_SPIES.ActivatedRoute,
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
