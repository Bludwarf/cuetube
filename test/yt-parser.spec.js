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
        const disc = ytparser.newDiscFromVideo(json, videoUrl, {
            artistInTitle: true,
            artistBeforeTitle: true
        });
        expect(disc.title).toBe("K.O.D. - Un Indien Dans La Ville Soundtrack (1994) - FULL ALBUM");

        expect(disc.files.length).toBe(1);
        const file = disc.files[0];
        expect(file.duration).toBe(3038);
    });

    // La La Land - Full OST / Soundtrack : https://www.youtube.com/watch?v=MmKlaGpmYig
    it("should parse La La Land tracklist", () => {
        let results = ytparser.parseTrack({
            line: "#1. Another Day Of Sun - 0:00",
            trackNumber: 1
        });
        expect(results.artistInTitle).toBeUndefined();
        expect(results.track.title).toBe("Another Day Of Sun");
        expect(results.track.performer).toBeUndefined();
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(0);
        expect(results.track.indexes[0].time.sec).toBe(0);

        results = ytparser.parseTrack({
            line: "#16. Mia And Sebastian's Theme (Celesta) - 45:52",
            trackNumber: 16
        });
        expect(results.artistInTitle).toBeUndefined();
        expect(results.track.title).toBe("Mia And Sebastian's Theme (Celesta)");
        expect(results.track.performer).toBeUndefined();
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(45);
        expect(results.track.indexes[0].time.sec).toBe(52);
    });

    // UnIndienDansLaVille : https://www.youtube.com/watch?v=g4hleRuajmY
    it("should parse UnIndienDansLaVille tracklist", () => {
        let results = ytparser.parseTrack({
            line: "01 Geoffrey Oryema - Un Indien Dans La Ville",
            trackNumber: 1,
            artistInTitle: true,
            artistBeforeTitle: true
        });
        expect(results.artistInTitle).toBe(true);
        expect(results.artistBeforeTitle).toBe(true);
        expect(results.track.title).toBe("Un Indien Dans La Ville");
        expect(results.track.performer).toBe("Geoffrey Oryema");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(0);
        expect(results.track.indexes[0].time.sec).toBe(0);

        results = ytparser.parseTrack({
            line: "12 Tonton David - La Misére (Club Remix) 46:37",
            trackNumber: 12,
            artistInTitle: true,
            artistBeforeTitle: true
        });
        expect(results.artistInTitle).toBe(true);
        expect(results.artistBeforeTitle).toBe(true);
        expect(results.track.title).toBe("La Misére (Club Remix)");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(46);
        expect(results.track.indexes[0].time.sec).toBe(37);
    });

    // BladeRunner : https://www.youtube.com/watch?v=k3fz6CC45ok
    it("should parse Blade Runner tracklist", () => {
        let results = ytparser.parseTrack({
            line: "0:00:00 Prologue And Main Titles 3:54 ",
            trackNumber: 1
        });
        expect(results.artistInTitle).toBeUndefined();
        expect(results.track.title).toBe("Prologue And Main Titles");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(0);
        expect(results.track.indexes[0].time.sec).toBe(0);

        results = ytparser.parseTrack({
            line: "1:48:37 End Titles 4:06 *",
            trackNumber: 33
        });
        expect(results.artistInTitle).toBeUndefined();
        expect(results.track.title).toBe("End Titles");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(108);
        expect(results.track.indexes[0].time.sec).toBe(37);
    });

    // Guardians of the Galaxy : https://www.youtube.com/watch?v=47ScWQ_EA2M
    it("should parse Guardians of the Galaxy tracklist (comment)", () => {
        let results = ytparser.parseTrack({
            line: "00:00: Hooked on a feeling - Blue Swede ",
            trackNumber: 1,
            artistInTitle: true,
            artistBeforeTitle: false
        });
        expect(results.artistInTitle).toBe(true);
        expect(results.artistBeforeTitle).toBe(false);
        expect(results.track.title).toBe("Hooked on a feeling");
        expect(results.track.performer).toBe("Blue Swede");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(0);
        expect(results.track.indexes[0].time.sec).toBe(0);

        results = ytparser.parseTrack({
            line: "38:57: O-O-H child the five - Stairsteps",
            trackNumber: 11,
            artistInTitle: true,
            artistBeforeTitle: false
        });
        expect(results.artistInTitle).toBe(true);
        expect(results.artistBeforeTitle).toBe(false);
        expect(results.track.title).toBe("O-O-H child the five");
        expect(results.track.performer).toBe("Stairsteps");
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(38);
        expect(results.track.indexes[0].time.sec).toBe(57);

        results = ytparser.parseTrack({
            line: "42:11: Ain't no mountain high enough﻿",
            trackNumber: 12,
            artistInTitle: false
        });
        expect(results.artistInTitle).toBe(false);
        expect(results.artistBeforeTitle).toBeUndefined();
        expect(results.track.title).toBe("Ain't no mountain high enough");
        expect(results.track.performer).toBeUndefined();
        expect(results.track.indexes[0].number).toBe(1);
        expect(results.track.indexes[0].time.min).toBe(42);
        expect(results.track.indexes[0].time.sec).toBe(11);
    });

});