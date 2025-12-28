import {environment as angularEnvironment} from './environment';
import dotEnvEnvironment from './.env.json'; // Généré par le script generate-dot-env.ts via `npm run build` (cf. README.md)

export interface EnvironmentWithDotEnv {
  production: boolean;
  googleApiKey: string;
  appVersion: string;
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

/**
 * Environnement Angular surchargé par les variables d'environnement système (ou le fichier .env)
 */
export const environment: EnvironmentWithDotEnv = partialEnvironment as EnvironmentWithDotEnv;
