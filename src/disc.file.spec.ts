import {Disc} from './disc';
import {discs} from 'TestUtils';

const minecraftFile = discs.minecraft.files[0];

// Données récupérées du player YouTube
minecraftFile.duration = 7613.001;

describe('Disc.File', function () {

  const file = minecraftFile;

  it('has cuesheetFile', function () {
    expect(file.cuesheetFile).not.toBeNull();
  });

  it('has properties of cuesheet.File', function () {
    expect(minecraftFile.name).toBe('https://www.youtube.com/watch?v=Dg0IjOzopYU');
    expect(file.type).toBe('MP3');
  });

  it('has tracks', function () {
    expect(file.tracks).not.toBeNull();
    expect(file.tracks.length).toBe(discs.minecraft.tracks.length);
    expect(file.tracks[0]).toEqual(discs.minecraft.tracks[0]); // TODO pourquoi toBe => false ?
    expect(file.tracks[file.tracks.length - 1]).toEqual(discs.minecraft.tracks[file.tracks.length - 1]); // TODO pourquoi toBe => false ?
  });

  it('has videoId', function () {
    expect(file.videoId).toBe('Dg0IjOzopYU');
  });

  it('has index', function () {
    expect(file.index).toBe(0);
  });

  it('should find track at time in multitrack video', function () {
    const file0 = discs.minecraft.files[0];
    let track;

    // Par défaut => 1ère
    track = file0.getTrackAt(0);
    expect(track).not.toBeNull();
    expect(track.title).toBe('Key (Nuance 1)');

    track = file0.getTrackAt(3600 + 14 * 60 + 2);
    expect(track).not.toBeNull();
    expect(track.title).toBe('Taswell (Creative 6)');

    // Par défaut => dernière
    track = file0.getTrackAt(3 * 3600);
    expect(track).not.toBeNull();
    expect(track.title).toBe('End');
  });

  it('should find track at time in multi video disc', function () {
    const file0 = discs.age2.files[0];
    let track, trackBis;

    // Par défaut => 1ère
    track = file0.getTrackAt(0);
    expect(track).not.toBeNull();
    expect(track.title).toBe('Main Theme');

    trackBis = file0.getTrackAt(50);
    expect(trackBis).toBe(track);

    // Par défaut => dernière
    trackBis = file0.getTrackAt(3 * 3600);
    expect(trackBis).toBe(track);
  });

  it('remove', () => {
    const disc = new Disc();
    const file1 = disc.newFile();
    // noinspection JSUnusedLocalSymbols
    const track1 = file1.newTrack();
    file1.newTrack();

    const file2 = disc.newFile();
    file2.newTrack();
    const track4 = file2.newTrack();

    const file3 = disc.newFile();
    const track5 = file3.newTrack();
    const track6 = file3.newTrack();

    expect(disc.tracks.length).toBe(6);
    expect(disc.tracks[3]).toBe(track4);
    expect(disc.tracks[3].number).toBe(4);
    expect(disc.tracks[4]).toBe(track5);
    expect(disc.tracks[4].number).toBe(5);

    file2.remove();

    expect(disc.tracks.length).toBe(4);
    expect(disc.tracks[2]).toBe(track5);
    expect(disc.tracks[2].number).toBe(3);
    expect(disc.tracks[3]).toBe(track6);
    expect(disc.tracks[3].number).toBe(4);
  });

});
