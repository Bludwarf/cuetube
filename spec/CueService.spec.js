/**
 * Created by MLAVIGNE on 27/07/2017.
 */

const CueService = require("../services/CueService");

describe("Service pour la gestion des fichiers cue", function() {

    it("should be public", function (cb) {
        CueService.getCue('Dg0IjOzopYU.cue', {}, (err, cue) => {
            expect(cue.title).toBe("Minecraft FULL SOUNDTRACK (2016)");
            expect(cue.performer).toBe("Luigi");
            expect(cue.rem).toEqual([
                "COMMENT \"http://minecraft.gamepedia.com/Music\"",
                "SRC \"https://www.youtube.com/watch?v=Dg0IjOzopYU\"",
                "COMMENT \"Generated by cuetube 0.1.0 - Wed Dec 20 2017 10:57:38 GMT+0100 (Paris, Madrid)\""
            ]);

            // FILE
            expect(cue.files.length).toBe(1);
            let file = cue.files[0];
            expect(file.name).toBe("https://www.youtube.com/watch?v=Dg0IjOzopYU");
            expect(file.type).toBe("MP3");

            // TRACK
            expect(file.tracks.length).toBe(28);
            let track1 = file.tracks[0];
            expect(track1.title).toBe("Key (Nuance 1)");
            expect(track1.indexes.length).toBe(1);
            let index1 = track1.indexes[0];
            expect(index1.number).toBe(1);
            expect(index1.time.min).toBe(0);
            expect(index1.time.sec).toBe(0);
            expect(index1.time.frame).toBe(0);

            cb();
        });
    });

    it("should parse freedb cuesheets", cb => {
        CueService.parseCueFile('samples/freedb/410d7214.cue', (err, cue) => {
            expect(cue.performer).toBe("Eric Serra - Le grand bleu");
            expect(cue.title).toBe("Le grand bleu (1988)");

            expect(cue.files.length).toBe(1);
            let file = cue.files[0];
            expect(file.name).toBe("Eric Serra - Le grand bleu - Le grand bleu (1988).mp3");

            expect(file.tracks.length).toBe(20);
            let track01 = file.tracks[0];
            expect(track01.title).toBe("The Big Blue Overture");
            expect(track01.indexes[0].number).toBe(1);
            expect(track01.indexes[0].time.min).toBe(0);
            expect(track01.indexes[0].time.sec).toBe(0);
            expect(track01.indexes[0].time.frame).toBe(0);

            let track20 = file.tracks[19];
            expect(track20.title).toBe("My Lady Blue");
            expect(track20.indexes[0].number).toBe(1);
            expect(track20.indexes[0].time.min).toBe(52);
            expect(track20.indexes[0].time.sec).toBe(24);
            expect(track20.indexes[0].time.frame).toBe(15);

            cb();
        });
    });

});