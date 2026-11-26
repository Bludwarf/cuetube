import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvertAllCuesComponent } from './convert-all-cues.component';

describe('ConvertAllCuesComponent', () => {
  let component: ConvertAllCuesComponent;
  let fixture: ComponentFixture<ConvertAllCuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertAllCuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvertAllCuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
