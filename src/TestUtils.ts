import {Disc} from './disc';

export class TestUtils {
    static createDisc(id: string, title = id): Disc4Test {
        return new Disc4Test().withId(id).withTitle(title);
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
}
