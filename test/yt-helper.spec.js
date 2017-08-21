/**
 * Created by mlavigne on 27/06/2017.
 */

function loadDisc(jsonFile) {
  const json = readJSON(jsonFile);
  return new Disc(_.extend(new cuesheet.CueSheet(), json));
}

describe("Utilitaires pour YouTube", function() {

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

});