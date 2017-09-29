const fileContents = {
    "samples/MusicBrainz/cues/Norah Jones.cue" : `PERFORMER "Norah Jones"
TITLE "Come Away With Me"
REM MUSICBRAINZ_ALBUM_ID 4c6f6712-1ca0-46c9-9484-f24bc1ef83f5
REM MUSICBRAINZ_ALBUM_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
REM DATE 2013
  TRACK 01 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Don't Know Why"
    REM MUSICBRAINZ_TRACK_ID 478382f6-9fb9-3eea-b29d-80e26985f733
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Seven Years"
    REM MUSICBRAINZ_TRACK_ID eed8a3fb-ad8d-3c35-adfb-395581987d91
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 03:07:00
  TRACK 03 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Cold Cold Heart"
    REM MUSICBRAINZ_TRACK_ID 19c13994-8e0b-3617-944c-ccd157727588
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 05:31:74
  TRACK 04 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Feelin' the Same Way"
    REM MUSICBRAINZ_TRACK_ID f1f3b7b4-2ef2-376a-aef0-3a304cf2835c
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 09:09:74
  TRACK 05 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Come Away With Me"
    REM MUSICBRAINZ_TRACK_ID 8f1b3cdc-239e-3c45-b7b7-f5f5c7340917
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 12:09:29
  TRACK 06 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Shoot the Moon"
    REM MUSICBRAINZ_TRACK_ID 6e8c602e-14b0-3056-8f86-fc040a75761d
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 15:26:29
  TRACK 07 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Turn Me On"
    REM MUSICBRAINZ_TRACK_ID 0ce1e174-d605-3921-ab8f-d49c535629e1
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 19:23:30
  TRACK 08 AUDIO
    PERFORMER "Norah Jones"
    TITLE Lonestar
    REM MUSICBRAINZ_TRACK_ID 28dacf37-bfaa-3790-b3ad-32f0a6ba826a
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 21:58:30
  TRACK 09 AUDIO
    PERFORMER "Norah Jones"
    TITLE "I've Got to See You Again"
    REM MUSICBRAINZ_TRACK_ID 009a3923-bbd5-37b6-8805-1304a309b8d3
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 25:04:30
  TRACK 10 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Painter Song"
    REM MUSICBRAINZ_TRACK_ID 9546f580-7488-35b9-ab8a-f3b1c071550d
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 29:18:30
  TRACK 11 AUDIO
    PERFORMER "Norah Jones"
    TITLE "One Flight Down"
    REM MUSICBRAINZ_TRACK_ID 6a56ea49-389d-34a6-9f29-e3dad0e7f06c
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 31:59:30
  TRACK 12 AUDIO
    PERFORMER "Norah Jones"
    TITLE Nightingale
    REM MUSICBRAINZ_TRACK_ID 68d9ed3e-d8e6-3099-9864-ac78513eb8fe
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 35:05:30
  TRACK 13 AUDIO
    PERFORMER "Norah Jones"
    TITLE "The Long Day Is Over"
    REM MUSICBRAINZ_TRACK_ID 0efe6550-9e47-36ac-bb82-fb62bb2f1dd9
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 39:17:29
  TRACK 14 AUDIO
    PERFORMER "Norah Jones"
    TITLE "The Nearness of You"
    REM MUSICBRAINZ_TRACK_ID c6eeaa80-b0f7-387a-99c7-c4f95d1df190
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 42:03:29
`
};

// TODO charger un fichier texte
function readFile(path) {
    return fileContents[path];
}


describe("CueParser", () => {

    it("should parse MusicBrainz Picard generated cuesheet", () => {
        const cueData = readFile("samples/MusicBrainz/cues/Norah Jones.cue");
        const cue = CueParser.parse(cueData, {
            autoCreateFile: true
        });
        expect(cue).not.toBeNull();
        expect(cue.files).not.toBeNull();
        expect(cue.files.length).toBe(1);
        const defaultFile = cue.files[0];
        expect(defaultFile).not.toBeNull();

        const cueTracks = defaultFile.tracks;
        expect(cueTracks).not.toBeNull();
        expect(cueTracks.length).toBe(14);

        // on ne doit retrouver que 3 remarques dans le disque
        const cueRems = cue.rem;
        expect(cueRems).not.toBeNull();
        expect(cueRems.length).toBe(3);
        expect(cueRems[0]).toBe("MUSICBRAINZ_ALBUM_ID 4c6f6712-1ca0-46c9-9484-f24bc1ef83f5");
        expect(cueRems[1]).toBe("MUSICBRAINZ_ALBUM_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9");
        expect(cueRems[2]).toBe("DATE 2013");

        // 2 remarques par piste
        const firstCueTrack = cueTracks[0];
        expect(firstCueTrack.rem[0]).toBe("MUSICBRAINZ_TRACK_ID 478382f6-9fb9-3eea-b29d-80e26985f733");
        expect(firstCueTrack.rem[1]).toBe("MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9");
        const lastCueTrack = cueTracks[13];
        expect(lastCueTrack.rem[0]).toBe("MUSICBRAINZ_TRACK_ID c6eeaa80-b0f7-387a-99c7-c4f95d1df190");
        expect(lastCueTrack.rem[1]).toBe("MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9");

        // le résultat est compatible avec Disc.js
        const disc = new Disc(cue);

        expect(disc).not.toBeNull();

        const tracks = disc.tracks;
        expect(tracks).not.toBeNull();
        expect(tracks.length).toBe(14);

        const firstTrack = tracks[0];
        expect(firstTrack.title).not.toBeNull();
        expect(firstTrack.title).toBe("Don't Know Why");

        const lastTrack = tracks[13];
        expect(lastTrack.title).not.toBeNull();
        expect(lastTrack.title).toBe("The Nearness of You");
    });

});