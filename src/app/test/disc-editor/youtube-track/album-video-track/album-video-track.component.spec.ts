import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlbumVideoTrackComponent } from './album-video-track.component';

describe('TimeMarkerComponent', () => {
  let component: AlbumVideoTrackComponent;
  let fixture: ComponentFixture<AlbumVideoTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlbumVideoTrackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlbumVideoTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
