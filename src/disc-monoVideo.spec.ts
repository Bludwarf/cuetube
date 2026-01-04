import {Disc} from './disc';
import * as _ from 'underscore';
import {discs} from './TestUtils';

describe('Disc mono vidéo', function() {

  it('has properties of cuesheet.CueSheet', function() {
    expect(discs.minecraft.title).toBe('Minecraft FULL SOUNDTRACK (2016)');
    expect(discs.minecraft.performer).toBe('Luigi');
  });

  it('has cuesheet', function() {
    expect(discs.minecraft.cuesheet).not.toBeNull();
  });

  it('has files', function() {
    expect(discs.minecraft.files.length).toBe(1);
  });

  it('has videoId', function() {
    expect(discs.minecraft.videoId).toBe('Dg0IjOzopYU');
  });

  it('has tracks', function() {
    expect(discs.minecraft.tracks.length).toBe(28);
  });

  it('is enabled', function() {
    expect(discs.minecraft.enabled).toBe(true);
  });

  it('is playable', function() {
    const disc = new Disc();
    expect(disc.playable).toBe(false);

    const file = disc.newFile();
    const track = file.newTrack();
    track.enabledByUser = false;
    expect(disc.playable).toBe(false);

    track.enabledByUser = true;
    expect(disc.playable).toBe(true);

    const track2 = file.newTrack();

    track.enabledByUser = false;
    track2.enabledByUser = false;
    expect(disc.playable).toBe(false);

    track.enabledByUser = false;
    track2.enabledByUser = true;
    expect(disc.playable).toBe(true);

    track.enabledByUser = true;
    track2.enabledByUser = false;
    expect(disc.playable).toBe(true);
  });

  it('has disabled tracks', function() {
    const disc = new Disc();

    const file = disc.newFile();
      const track1 = file.newTrack();
      file.newTrack();

      expect(disc.disabledTracks.length).toBe(0);

      track1.enabledByUser = false;
      expect(track1.number).toBe(1);
      expect(disc.disabledTracks.map(track => track.number)).toEqual([1]);
  });

  it('contains rem 1', function() {
    const disc = new Disc();
    disc.setRem('DATE', 'BAD');
    disc.setRem('DATE', '1970-01-01');
    expect(disc.rem).toEqual(['DATE "1970-01-01"']);

    disc.rem = ['DATE "1970-01-01"'];
    expect(disc.getRem('DATE')).toBe('1970-01-01');
  });

  it('contains rem 2', function() {
    const disc = new Disc();
    expect(disc.src).toBeUndefined();

    disc.src = 'value';
    expect(disc.src).toBe('value');
  });
});
