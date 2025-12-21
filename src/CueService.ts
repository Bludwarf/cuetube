import CueSheet = cuesheet.CueSheet;
import { HttpClient } from '@angular/common/http';
import * as CueParser from './scripts/CueParser';

export class CueService {

    constructor(protected $http: HttpClient) {
    }

    // TODO : à factoriser dans une méthode cliente
    /**
     * @param {string} filename nom du fichier cue; exemple "1LH4vnrM-Vs.cue"
     * @return {string} chemin relatif du fichier cue
     */
    public static getPath(filename: string): string {
        const encode = CueService.encodePathComponent;
        return [encode(filename[0]), encode(filename[1]), encode(filename[2]), filename].join('/');
    }

    /** Nom d'un élément du chemin d'un fichier cue, normalisé */
    static encodePathComponent(pathComponent: string): string {
        return pathComponent.toUpperCase();
    }

    public async getCueFromCueTube(playlistOrVideoId: string): Promise<CueSheet> {
        const path = CueService.getPath(playlistOrVideoId+'.cue');
        const cueUrl = `https://raw.githubusercontent.com/Bludwarf/cuetube/cues/${path}`;

        const res = await fetch(cueUrl);
        if (res.status !== 200) {
          throw new Error('HTTP ' + res.status);
        }

        const cueContent = await res.text();
        return CueParser.parse(cueContent);
    }
}
