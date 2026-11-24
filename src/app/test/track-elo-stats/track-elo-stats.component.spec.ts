import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackEloStatsComponent } from './track-elo-stats.component';

describe('TrackEloStatsComponent', () => {
  let component: TrackEloStatsComponent;
  let fixture: ComponentFixture<TrackEloStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackEloStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackEloStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
