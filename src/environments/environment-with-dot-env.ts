import {environment as angularEnvironment} from './environment';
import dotEnvEnvironment from './.env.json'; // Généré par le script generate-dot-env.ts via `npm run generate-dot-env` (cf. README.md)

export interface DotEnv {
    googleApiKey: string;
    musicBrainz: {
        clientId: string;
        clientSecret: string;
    };
    appVersion: string;
    shortRevisionNumber: string;
}

export interface EnvironmentWithDotEnv extends DotEnv {
    production: boolean;
}

const partialEnvironment: Partial<EnvironmentWithDotEnv> = {};
Object.assign(partialEnvironment, angularEnvironment, dotEnvEnvironment);

if (partialEnvironment.production === undefined) {
    throw new Error(`Missing environment variable 'production'`);
}
if (partialEnvironment.googleApiKey === undefined) {
    throw new Error(`Missing environment variable 'googleApiKey'`);
}
if (partialEnvironment.appVersion === undefined) {
    throw new Error(`Missing environment variable 'appVersion'`);
}
if (partialEnvironment.shortRevisionNumber === undefined) {
    throw new Error(`Missing environment variable 'revisionNumber'`);
}
if (partialEnvironment.musicBrainz?.clientId === undefined) {
    throw new Error(`Missing environment variable 'musicBrainz.clientId'`);
}
if (partialEnvironment.musicBrainz?.clientSecret === undefined) {
    throw new Error(`Missing environment variable 'musicBrainz.clientSecret'`);
}
if (partialEnvironment.musicBrainz?.redirectUri === undefined) {
    throw new Error(`Missing environment variable 'musicBrainz.redirectUri'`);
}

/**
 * Environnement Angular surchargé par les variables d'environnement système (ou le fichier .env)
 */
export const environment: EnvironmentWithDotEnv = partialEnvironment as EnvironmentWithDotEnv;
