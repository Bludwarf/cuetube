describe("Disc", function() {
  
  it("playable", function() {
    var disc = new Disc();
    expect(disc.playable).toBe(false);
    
    disc.files = [new Disc.File()];
    disc.files[0].tracks = [new Disc.Track()];
    var track = disc.files[0].tracks[0];
    track.enabled = false;
    expect(disc.playable).toBe(false);
    
    track.enabled = true;
    expect(disc.playable).toBe(true);
    
    disc.files[0].tracks.push(new Disc.Track());
    var track2 = disc.files[0].tracks[1];
    
    track.enabled = false;
    track2.enabled = false;
    expect(disc.playable).toBe(false);
    
    track.enabled = false;
    track2.enabled = true;
    expect(disc.playable).toBe(true);
    
    track.enabled = true;
    track2.enabled = false;
    expect(disc.playable).toBe(true);
  });
});