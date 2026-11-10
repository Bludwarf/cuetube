// Génère le fichier .env.json à partir du fichier .env ou des variables d'environnement système et du package.json

import fs from 'fs';
import colors from 'colors';
import packageJson from '../../package.json';
import dotenv from 'dotenv';
import {promisify} from 'node:util';
import {exec as execCb} from 'node:child_process';
import {DotEnv} from './environment-with-dot-env';

const exec = promisify(execCb);

// Source : https://pazel.dev/how-to-keep-your-secrets-from-your-source-code-in-an-angular-project#automate-it
(async () => {
    const writeFile = fs.writeFile;
    const targetPath = './src/environments/.env.json';
    const appVersion = packageJson.version;
    dotenv.config({
        path: 'src/environments/.env'
    });
    const envConfigFile = JSON.stringify({
        googleApiKey: process.env.GOOGLE_API_KEY,
        musicBrainz: {
            clientId: process.env.MUSIC_BRAINZ_CLIENT_ID, // https://beta.musicbrainz.org/account/applications
            clientSecret: process.env.MUSIC_BRAINZ_CLIENT_SECRET, // https://beta.musicbrainz.org/account/applications
        },
        appVersion,
        shortRevisionNumber: (await exec('git rev-parse --short HEAD')).stdout.toString().trim(),
    } satisfies DotEnv, undefined, 2);
    console.log(colors.magenta(`The file '${targetPath}' will be written with the following content: \n`));
    writeFile(targetPath, envConfigFile, (err: Error) => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            console.log(colors.magenta(`Angular environment file generated correctly at ${targetPath} \n`));
        }
    });
})();
