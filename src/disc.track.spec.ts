import {discs} from 'TestUtils';
import {Disc} from './disc';

const minecraftFile = discs.minecraft.files[0];
const minecraftTrack = minecraftFile.tracks[0];

describe('Disc.Track', function () {

  const file = minecraftFile;
  const track = minecraftTrack;

  it('has properties of cuesheet.Track', function () {
    expect(track.number).toBe(1);
    expect(track.title).toBe('Key (Nuance 1)');

    // par défaut on a toujours un index
    expect(track.indexes).toEqual([{
      'number': 1,
      'time': {
        'min': 0,
        'sec': 0,
        'frame': 0
      }
    }]);
  });

  it('has index', function () {
    expect(track.index).toBe(0);
  });

  it('has file', function () {
    expect(track.file).toEqual(file);
  });

  it('has disc', function () {
    expect(track.disc).toEqual(discs.minecraft);
  });

  it('has startSeconds', function () {
    expect(track.startSeconds).toEqual(0);
    expect(file.tracks[1].startSeconds).toEqual(64); // 01:04
    expect(file.tracks[27].startSeconds).toEqual(111 * 60 + 48); // 1:51:48 -> 6708 s.
  });

  it('has next', function () {
    expect(file.tracks[0].next).toEqual(file.tracks[1]);
    // expect(file.tracks[26].next).toEqual(file.tracks[1]);
  });

  it('has endSeconds', function () {
    expect(track.endSeconds).toEqual(64);
    expect(file.tracks[27].endSeconds).toEqual(7613.001);
  });

  // Disque dont les pistes ne sont pas ordonnés par startSeconds
  it('has endSeconds even on tracks non ordered', function () {
    const disc = discs['samples/LeGrandBleu-cd2-unordered.json'];
    const track7 = disc.tracks[6];
    const nextInTime = disc.tracks[2]; // next = Watergames

    // verif de la propriété indexInTime
    expect(track7.indexInTime).toBe(12);
    expect(nextInTime.indexInTime).toBe(13);

    expect(track7.endSeconds).toEqual(nextInTime.startSeconds);
  });

  it('remove', () => {
    const disc = new Disc();
    const file1 = disc.newFile();
    file1.newTrack();
    file1.newTrack();

    const file2 = disc.newFile();
    const track3 = file2.newTrack();
    const track4 = file2.newTrack();
    const track5 = file2.newTrack();

    expect(disc.tracks.length).toBe(5);
    expect(disc.tracks[3]).toBe(track4);
    expect(disc.tracks[3].number).toBe(4);
    expect(disc.tracks[4]).toBe(track5);
    expect(disc.tracks[4].number).toBe(5);

    track4.remove();

    expect(disc.tracks.length).toBe(4);
    expect(disc.tracks[2]).toBe(track3);
    expect(disc.tracks[2].number).toBe(3);
    expect(disc.tracks[3]).toBe(track5);
    expect(disc.tracks[3].number).toBe(4);

    // Suppression jusqu'à supprimer file2

    track3.remove();
    track5.remove();

    expect(disc.tracks.length).toBe(2);
    expect(disc.files.length).toBe(1);
    expect(disc.files[0]).toBe(file1);

  });

});
