import {IMusicBrainzConfig, MusicBrainzApi} from 'musicbrainz-api';
import {environment} from '../../environments/environment-with-dot-env';
import {OAuth2Client, OAuth2Fetch} from '@badgateway/oauth2-client';

const config = {
    appName: 'cuetube',
    appVersion: environment.appVersion,
    appContactInfo: 'bludwarf@gmail.com',
} satisfies IMusicBrainzConfig;
export const mbApi = new MusicBrainzApi(config);

const oAuth2Client = new OAuth2Client({

    // The base URI of your OAuth2 server
    server: 'https://musicbrainz.org/',

    // OAuth2 client id
    clientId: environment.musicBrainz.clientId,

    // OAuth2 client secret. Only required for 'client_credentials', 'password'
    // flows. Don't specify this in insecure contexts, such as a browser using
    // the authorization_code flow.
    clientSecret: environment.musicBrainz.clientSecret,


    // The following URIs are all optional. If they are not specified, we will
    // attempt to discover them using the oauth2 discovery document.
    // If your server doesn't have support this, you may need to specify these.
    // you may use relative URIs for any of these.


    // Token endpoint. Most flows need this.
    // If not specified we'll use the information for the discovery document
    // first, and otherwise default to /token
    tokenEndpoint: '/oauth2/token',

    // Authorization endpoint.
    //
    // You only need this to generate URLs for authorization_code flows.
    // If not specified we'll use the information for the discovery document
    // first, and otherwise default to /authorize
    authorizationEndpoint: '/oauth2/authorize',

});

const oAuth2FetchWrapper = new OAuth2Fetch({
    client: oAuth2Client,

    getNewToken: async () => {
        try {
            return await oAuth2Client.authorizationCode.getTokenFromCodeRedirect(
                document.location.toString(),
                {
                    /**
                     * The redirect URI is not actually used for any redirects, but MUST be the
                     * same as what you passed earlier to "authorizationCode"
                     */
                    redirectUri: environment.musicBrainz.redirectUri,

                    /**
                     * This is optional, but if it's passed then it also MUST be the same as
                     * what you passed in the first step.
                     *
                     * If set, it will verify that the server sent the exact same state back.
                     */
                    // state: 'some-string', // TODO

                    // codeVerifier, // TODO PKCE

                }
            );
        } catch (e) {
            console.error('getTokenFromCodeRedirect.catch', e, JSON.stringify(e));
            // TODO voir si on ne doit pas détecter plus précisément la bonne erreur quand le code n'est pas dans l'URL
            //      Exemple d'erreur : Error: The url did not contain a code parameter http://localhost:4203/?collection=MB

            document.location = await oAuth2Client.authorizationCode.getAuthorizeUri({

                // URL in the app that the user should get redirected to after authenticating
                redirectUri: environment.musicBrainz.redirectUri,

                // Optional string that can be sent along to the auth server. This value will
                // be sent along with the redirect back to the app verbatim.
                // state: 'some-string', // TODO

                // codeVerifier, // TODO PKCE

                scope: ['collection'],

            });
        }
    },

    /**
     * This function is called whenever the active token changes. Using this is
     * optional, but it may be used to (for example) put the token in off-line
     * storage for later usage.
     */
    storeToken: (oAuth2Token) => {
        localStorage.setItem('musicBrainz.oAuth2Token', JSON.stringify(oAuth2Token));
    },

    /**
     * Also an optional feature. Implement this if you want the wrapper to try a
     * stored token before attempting a full re-authentication.
     *
     * This function may be async. Return null if there was no token.
     */
    getStoredToken: () => {
        const token = localStorage.getItem('musicBrainz.oAuth2Token');
        if (token) {
            return JSON.parse(token);
        }
        return null;
    }

});

let authenticatedMbApi: MusicBrainzApi;

export async function getAuthenticatedMbApi(): Promise<MusicBrainzApi> {
    if (authenticatedMbApi) {
        return authenticatedMbApi;
    }

    const oAuth2Token = await oAuth2FetchWrapper.getToken();

    authenticatedMbApi = new MusicBrainzApi({
        ...config,
        accessToken: oAuth2Token.accessToken,
    });
    return authenticatedMbApi;
}
