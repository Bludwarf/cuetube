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

    // TEST #49
    it("should not parse Le Grand Bleu (description without tracklist)", function () {
        let videoUrl = "https://www.youtube.com/watch?v=Dg0IjOzopYU";
        let json = readJSON('samples/youtube/videos/LeGrandBleu.json');
        //const description = "http://www.discogs.com/Eric-Serra-The-Big-Blue-Original-Motion-Picture-Soundtrack/master/74022\n\nFAIR USE NOTICE: This video may contain copyrighted material. Such material is made available for educational purposes only. This constitutes a 'fair use' of any such copyrighted material as provided for in Title 17 U.S.C. section 107 of the US Copyright Law.\n\nIn other words All credits goes to the Magnificent Eric Serra.";
        expect(() => {
            let disc = ytparser.newDiscFromVideo(json, videoUrl);
        }).toThrow(new Error("Aucune piste n'a été trouvée dans la description de la vidéo"/* : "+description*/));
    });

    // TEST #49
    it("should parse Un indien dans la ville", function () {
        const videoUrl = "https://www.youtube.com/watch?v=g4hleRuajmY";
        const json = readJSON('samples/youtube/videos/UnIndienDansLaVille.json');
        const disc = ytparser.newDiscFromVideo(json, videoUrl);
        expect(disc.title).toBe("K.O.D. - Un Indien Dans La Ville Soundtrack (1994) - FULL ALBUM");

        expect(disc.files.length).toBe(1);
        const file = disc.files[0];
        expect(file.duration).toBe(3038);
    });

});