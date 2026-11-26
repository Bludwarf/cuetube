import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvertCueComponent } from './convert-cue.component';

describe('ConvertCueComponent', () => {
  let component: ConvertCueComponent;
  let fixture: ComponentFixture<ConvertCueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertCueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvertCueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
