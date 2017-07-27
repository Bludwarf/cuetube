/**
 * Created by MLAVIGNE on 27/07/2017.
 */

const CueService = require("../services/CueService");

describe("Service pour la gestion des fichiers cue", function() {

    it("should be public", function (cb) {
        CueService.getCue('Dg0IjOzopYU.cue', {}, (err, cue) => {
            expect(cue.title).toBe("Minecraft FULL SOUNDTRACK (2016)");
            expect(cue.performer).toBe("Luigi");
            expect(cue.rem).toEqual(["COMMENT \"http://minecraft.gamepedia.com/Music\""]);

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

});