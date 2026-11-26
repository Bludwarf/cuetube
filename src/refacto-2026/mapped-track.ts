import {Track} from './track';
import {ExternalTrack} from './external-track';

export class MappedTrack<I extends ExternalTrack> {
    constructor(
        readonly track: Track,
        readonly externalTrack: I,
    ) {
    }
}
