var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class CueService {
    constructor($http) {
        this.$http = $http;
    }
    // TODO : à factoriser dans une méthode cliente
    /**
     * @param {string} filename nom du fichier cue; exemple "1LH4vnrM-Vs.cue"
     * @return {string} chemin relatif du fichier cue
     */
    static getPath(filename) {
        const encode = CueService.encodePathComponent;
        return [encode(filename[0]), encode(filename[1]), encode(filename[2]), filename].join("/");
    }
    /** Nom d'un élément du chemin d'un fichier cue, normalisé */
    static encodePathComponent(pathComponent) {
        return pathComponent.toUpperCase();
    }
    getCueFromCueTube(playlistOrVideoId) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = CueService.getPath(playlistOrVideoId + '.cue');
            const cueUrl = `https://raw.githubusercontent.com/Bludwarf/cuetube/cues/${path}`;
            const res = yield fetch(cueUrl);
            if (res.status != 200)
                throw new Error("HTTP " + res.status);
            const cueContent = yield res.text();
            return CueParser.parse(cueContent);
        });
    }
}
