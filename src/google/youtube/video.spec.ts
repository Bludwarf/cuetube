import {YouTubeVideo} from './video';

describe(`YouTubeVideo`, () => {

    const MINECRAFT_ID = `Dg0IjOzopYU`;
    const MINECRAFT_URL = `https://www.youtube.com/watch?v=${MINECRAFT_ID}`;

    it(`getVideoIdFromUrl`, () => {
        const id = YouTubeVideo.getVideoIdFromUrl(MINECRAFT_URL);
        expect(id).toBe(MINECRAFT_ID);
    });

    class TestYouTubeVideo extends YouTubeVideo {
        constructor(id: string) {
            super(id);
        }
    }

    it(`constructor`, () => {
        const video = new TestYouTubeVideo(MINECRAFT_ID);
        expect(video).toBeDefined();
    });

    it(`playable`, () => {
        const video = new TestYouTubeVideo(MINECRAFT_ID);
        expect(video.playable).toBe(true);

        video.disabledByYouTube = false;
        expect(video.playable).toBe(true);

        video.disabledByYouTube = true;
        expect(video.playable).toBe(false);
    });

    it(`url`, () => {
        const video = new TestYouTubeVideo(MINECRAFT_ID);
        expect(video.url).toBe(MINECRAFT_URL);
    });

    it(`icon`, () => {
        const video = new TestYouTubeVideo(MINECRAFT_ID);
        expect(video.icon).toBe(`https://img.youtube.com/vi/Dg0IjOzopYU/default.jpg`);
    });

    it(`background`, () => {
        const video = new TestYouTubeVideo(MINECRAFT_ID);
        expect(video.background).toBe(`https://img.youtube.com/vi/Dg0IjOzopYU/hqdefault.jpg`);
    });

});
