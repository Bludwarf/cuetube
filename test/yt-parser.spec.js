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

    it("should parse Minecraft Video", function () {
        let videoUrl = "https://www.youtube.com/watch?v=Dg0IjOzopYU";
        let json = readJSON('samples/youtube/Videos.snippet.json');
        let disc = ytparser.newDiscFromVideo(json, videoUrl);
        expect(disc.title).toBe("Minecraft FULL SOUNDTRACK (2016)");

        // FILE
        expect(disc.files.length).toBe(1);
        let file = disc.files[0];
        expect(file.name).toBe(videoUrl);
        expect(file.type).toBe("MP3");

        // TRACK
        expect(file.tracks.length).toBe(28);
        let track1 = file.tracks[0];
        console.log(track1.cuesheetTrack);
        expect(track1.title).toBe("Key");
        expect(track1.indexes.length).toBe(1);
        let index1 = track1.indexes[0];
        expect(index1.number).toBe(1);
        expect(index1.time.min).toBe(0);
        expect(index1.time.sec).toBe(0);
        expect(index1.time.frame).toBe(0);

        let trackN = file.tracks[27];
        expect(trackN.title).toBe("End");
        expect(trackN.indexes.length).toBe(1);
        let indexN1 = trackN.indexes[0];
        expect(indexN1.number).toBe(1);
        expect(indexN1.time.min).toBe(111);
        expect(indexN1.time.sec).toBe(48);
        expect(indexN1.time.frame).toBe(0);
    });

    // TEST #36
    it("should parse Braveheart Video", function () {
        let videoUrl = "https://www.youtube.com/watch?v=S7end66UPiI";
        let json = readJSON('samples/youtube/videos/Braveheart.json');

        // On répond au confirm
        let confirmNumber = 0;
        spyOn(window, 'confirm').and.callFake(function () {
            ++confirmNumber;
            if (confirmNumber === 1) return false; // Le titre contient le nom de l'artiste ?
            else fail("On aurait dû avoir un seul confirm");
        });

        let disc = ytparser.newDiscFromVideo(json, videoUrl);
        let track = disc.files[0].tracks[21];
        expect(track.title).toBe("22. Making Plains - Gathering the Clans");
    });

});