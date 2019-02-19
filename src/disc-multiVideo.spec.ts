import {Disc} from 'disc';
import * as _ from 'underscore';
import {TestUtils, discs} from './TestUtils';

describe('Disc multi vidéo', function() {

  it('has properties of cuesheet.CueSheet', function() {
    expect(discs.age2.title).toBe('Age of Empires 2: Age of Kings');
    expect(discs.age2.performer).toBe('Gamegroove');
  });

  it('has cuesheet', function() {
    expect(discs.age2.cuesheet).not.toBeNull();
  });

  it('has files', function() {
    expect(discs.age2.files.length).toBe(15);
  });

  it('has videoId', function() {
    expect(discs.age2.videoId).toBe('RRtlWfi6jiM');
  });

  it('has tracks', function() {
    expect(discs.age2.tracks.length).toBe(15);
  });

  it('is enabled', function() {
    expect(discs.age2.enabled).toBe(true);
  });

  it('has newFile constructor + File.newTrack', function() {
    const disc = new Disc();

    const file = disc.newFile();
    expect(file.disc).toEqual(disc);
    expect(file.index).toBe(0);

    const file2 = disc.newFile();
    expect(file2.disc).toEqual(disc);
    expect(file2.index).toBe(1);

    const track1 = file.newTrack();
    track1.title = 'Track 1';
    expect(track1.title).toBe('Track 1');
    expect(track1.disc).toEqual(disc);
    expect(track1.file).toEqual(file);
    expect(track1.index).toBe(0);

    const track2 = file.newTrack();
    track2.title = 'Track 2';
    expect(track2.title).toBe('Track 2');
    expect(track2.disc).toEqual(disc);
    expect(track2.file).toEqual(file);
    expect(track2.index).toBe(1);

    const track3 = file2.newTrack();
    track3.title = 'Track 3';
    expect(track3.title).toBe('Track 3');
    expect(track3.disc).toEqual(disc);
    expect(track3.file).toEqual(file2);
    expect(track3.index).toBe(0);

    expect(disc.tracks).toEqual([track1, track2, track3]);
  });

  it('is playable', function() {
    const disc = new Disc();

    const file1 = disc.newFile();
    const track1 = file1.newTrack();
    const track2 = file1.newTrack();

    const file2 = disc.newFile();
    const track3 = file2.newTrack();

    expect(disc.playable).toBe(true);

    disc.enabledByUser = false;
    expect(disc.playable).toBe(false);

    disc.enabledByUser = true;
    expect(disc.playable).toBe(true);

    track3.enabledByUser = false;
    expect(disc.playable).toBe(true);

    track1.enabledByUser = false;
    track3.enabledByUser = true;
    expect(disc.playable).toBe(true);

    track3.enabledByUser = false;
    expect(disc.playable).toBe(true);

    track2.enabledByUser = false;
    expect(disc.playable).toBe(false);
  });
});
