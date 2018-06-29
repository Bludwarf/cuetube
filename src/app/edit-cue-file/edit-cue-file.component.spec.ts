import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCueFileComponent } from './edit-cue-file.component';

describe('EditCueFileComponent', () => {
  let component: EditCueFileComponent;
  let fixture: ComponentFixture<EditCueFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCueFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCueFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
