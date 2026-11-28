import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageWithPlayerComponent } from './page-with-player.component';

describe('PageWithPlayerComponent', () => {
  let component: PageWithPlayerComponent;
  let fixture: ComponentFixture<PageWithPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageWithPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageWithPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
