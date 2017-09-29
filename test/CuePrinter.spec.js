describe("CueParser", () => {

    it("should parse MusicBrainz Picard generated cuesheet", () => {
        const cueData = readFile("samples/MusicBrainz/cues/Norah Jones.cue");
        const cue = CueParser.parse(cueData, {
            autoCreateFile: true
        });

        const printer = new CuePrinter();
        expect(printer.print(cue)).toBe(cueData);
    });

});