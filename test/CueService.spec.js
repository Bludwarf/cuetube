describe("CueService", () => {

    it("should show path of cuesheet", () => {
        const path = CueService.getPath('Dg0IjOzopYU.cue');
        expect(path).toBe("D/G/0/Dg0IjOzopYU.cue");
    });

});