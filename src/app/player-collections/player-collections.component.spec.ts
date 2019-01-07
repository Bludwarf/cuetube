import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerCollectionsComponent } from './player-collections.component';

describe('PlayerCollectionsComponent', () => {
  let component: PlayerCollectionsComponent;
  let fixture: ComponentFixture<PlayerCollectionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerCollectionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
