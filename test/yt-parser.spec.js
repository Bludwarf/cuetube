/**
 * Created by mlavigne on 27/06/2017.
 */
describe("Parser réponses YouTube", function() {

    it("should parse Mario Playlist", function () {
        let json = readJSON('samples/youtube/Mario.PlaylistItems.snippet.json');
        let disc = ytparser.newDiscFromPlaylistItems(json);
        expect(disc.files.length).toBe(30);

        let tracks = disc.tracks;
        expect(tracks.length).toBe(30);

        expect(tracks[0].title).toBe("Super Mario Bros. 3 - World Map 1: Grass Land Theme");
        expect(tracks[29].title).toBe("Super Mario Bros. 3 - Ending Fanfare");

        // Idem pour toJSON => pas d'erreur
        expect(JSON.stringify(disc)).not.toBeNull();
    });

});