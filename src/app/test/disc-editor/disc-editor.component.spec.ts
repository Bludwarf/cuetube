import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscEditorComponent } from './disc-editor.component';

describe('DiscEditorComponent', () => {
  let component: DiscEditorComponent;
  let fixture: ComponentFixture<DiscEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
