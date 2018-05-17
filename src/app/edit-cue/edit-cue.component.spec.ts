import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCueComponent } from './edit-cue.component';

describe('EditCueComponent', () => {
  let component: EditCueComponent;
  let fixture: ComponentFixture<EditCueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
