/**
 * Created by mlavigne on 27/06/2017.
 */

function loadDisc(jsonFile) {
  const json = readJSON(jsonFile);
  return new Disc(_.extend(new cuesheet.CueSheet(), json));
}

const expectIndexesTimecode = function (track, min, sec, frame) {
  expect(track.indexes.length).toBe(1);
  expect(track.indexes[0].number).toBe(1);
  expect(track.indexes[0].time.min).toBe(min);
  expect(track.indexes[0].time.sec).toBe(sec);
  expect(track.indexes[0].time.frame).toBe(frame);
};

describe("Utilitaires pour YouTube", function () {

  it("get timecode", function () {
    expect(yth.getTimecode(minecraft.tracks[0])).toBe('0:00');
  });

  it("should export tracklist", function () {
    let disc = minecraft;
    let tracks = [disc.tracks[0], disc.tracks[17], disc.tracks[27]];
    expect(yth.getTracklist(tracks)).toBe(`0:00 - Key (Nuance 1)
1:06:05 - Taswell (Creative 6)
1:51:48 - End`);
  });

  it("should parse tracklist", function () {
    let disc = new Disc();
    let previousFile = disc.newFile();
    previousFile.newTrack();
    let file = disc.newFile();
    let oldTrack = file.newTrack();
    let nextFile = disc.newFile();
    nextFile.newTrack();

    let tracklist = `0:00 - Key (Nuance 1)
1:06:05 - Taswell (Creative 6)
1:51:48 - End`;

    expect(file.tracks.length).toBe(1);
    expect(disc.tracks.length).toBe(3);

    yth.setTracklist(tracklist, file);

    expect(file.tracks.length).toBe(3); // yeah 2B3 !
    expect(disc.tracks.length).toBe(5); // on ne touche pas aux autres fichiers

    /** @type {Disc.Track} */
    const track0 = file.tracks[0];
    expect(track0.title).toBe('Key (Nuance 1)');
    expectIndexesTimecode(track0, 0, 0, 0);

    /** @type {Disc.Track} */
    const track1 = file.tracks[1];
    expect(track1.title).toBe('Taswell (Creative 6)');
    expectIndexesTimecode(track1, 66, 5, 0);

    /** @type {Disc.Track} */
    const track2 = file.tracks[2];
    expect(track2.title).toBe('End');
    expectIndexesTimecode(track2, 111, 48, 0);
  });

});