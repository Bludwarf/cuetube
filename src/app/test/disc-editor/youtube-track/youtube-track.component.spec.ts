import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeTrackComponent } from './youtube-track.component';

describe('YoutubeTrackComponent', () => {
  let component: YoutubeTrackComponent;
  let fixture: ComponentFixture<YoutubeTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubeTrackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoutubeTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
