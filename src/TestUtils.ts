import {Disc} from './disc';
import {LocalAndDistantPersistence} from './persistence/LocalAndDistantPersistence';
import {MemoryPersistence} from './persistence/MemoryPersistence';
import Collection from './Collection';

export class TestUtils {
    static createDisc(id: string, title = id): Disc4Test {
        return new Disc4Test().withId(id).withTitle(title);
    }

    static createLocalAndDistantPersistence(local = new MemoryPersistence(null), distant = new MemoryPersistence(null)) {
      return new LocalAndDistantPersistence(local, distant);
    }
}

class Disc4Test extends Disc {
    withId(id: string): Disc4Test {
        this.id = id;
        return this;
    }
    withTitle(title: string): Disc4Test {
        this.title = title;
        return this;
    }
    withFile(filename: string): File4Test {
        const file = new File4Test(this, this.newFile());
        return file.withName(filename);
    }
}

export class File4Test {
    constructor(public disc: Disc4Test, public file: Disc.File) {

    }
    withName(name: string): File4Test {
        this.file.name = name;
        return this;
    }
    withTrack(title: string): Track4Test {
        const track = new Track4Test(this, this.file.newTrack());
        return track.withTitle(title);
    }
    endFile(): Disc4Test {
        return this.disc;
    }
}

export class Track4Test {
    constructor(public file: File4Test, public track: Disc.Track) {

    }
    withTitle(title: string): Track4Test {
        this.track.title = title;
        return this;
    }
    endTrack(): File4Test {
        return this.file;
    }
}

