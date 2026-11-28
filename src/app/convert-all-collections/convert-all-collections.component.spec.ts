import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvertAllCollectionsComponent } from './convert-all-collections.component';

describe('ConvertAllCollectionsComponent', () => {
  let component: ConvertAllCollectionsComponent;
  let fixture: ComponentFixture<ConvertAllCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvertAllCollectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvertAllCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
