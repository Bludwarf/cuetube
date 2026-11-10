import {MusicBrainzApi} from 'musicbrainz-api';
import {environment} from '../../environments/environment-with-dot-env';

export const mbApi = new MusicBrainzApi({
    appName: 'cuetube',
    appVersion: environment.appVersion,
    appContactInfo: 'bludwarf@gmail.com',
});
