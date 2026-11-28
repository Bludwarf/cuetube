import {Injectable} from '@angular/core';
import {YouTubeVideo} from '../google/youtube/video';
import {MappedDiscService} from './mapped-disc.service';
import {AlbumVideoTrack, SingleVideoTrack, YouTubeTrack} from '../google/youtube/track';
import {MappedDisc} from './mapped-disc';
import {Persistence} from '../persistence';

@Injectable({providedIn: 'root'})
export class YouTubeMappedDiscService extends MappedDiscService<YouTubeTrack, JsonDiscMapping> {

    // Uniquement les mappings chargés, pas ceux modifiés par la suite
    private jsonDiscMappings: Record<string, JsonDiscMapping>;

    async load(): Promise<void> {
        const persistence = await this.persistenceService.getCurrentPersistenceAndInit();
        this.jsonDiscMappings = await persistence.getYouTubeDiscMappings();
    }

    protected getExternalTracks(discId: string): YouTubeTrack[] | undefined {
        const jsonDiscMapping: JsonDiscMapping = this.jsonDiscMappings[discId];
        if (!jsonDiscMapping) {
            return undefined;
        }
        const jsonVideos = this.mapToJsonVideos(jsonDiscMapping);
        return this.mapToYouTubeTracks(jsonVideos);
    }

    protected toJson(mappedDisc: MappedDisc): JsonDiscMapping {
        const jsonDiscMapping: JsonDiscMapping = [];
        for (let trackIndex = 0; trackIndex < mappedDisc.mappedTracksByTrackIndex.length; trackIndex++) {
            const mappedTracks = mappedDisc.mappedTracksByTrackIndex[trackIndex];
            for (const mappedTrack of mappedTracks) {
                if (mappedTrack instanceof SingleVideoTrack) {
                    jsonDiscMapping.push(mappedTrack.video.id);
                }
                if (mappedTrack instanceof AlbumVideoTrack) {
                    jsonDiscMapping.push(mappedTrack.video.id); // TODO ne pas faire de push si vidéo == vidéo courante
                    jsonDiscMapping.push(mappedTrack.time);
                }
            }
        }
        return jsonDiscMapping;
    }

    // TODO tester disque JSON avec singleVideo puis singleVideo
    // TODO tester disque JSON avec singleVideo puis albumVideo
    // TODO tester disque JSON avec albumVideo puis singleVideo
    // TODO tester disque JSON avec albumVideo puis albumVideo

    private mapToJsonVideos(jsonDiscMapping: JsonDiscMapping): JsonVideo[] {
        const videos: JsonVideo[] = [];
        let video: JsonVideo | undefined;
        for (const jsonItem of jsonDiscMapping) {
            if (typeof jsonItem === 'string') {
                if (video) {
                    // On cloture la vidéo précédente
                    videos.push(video);
                    video = undefined;
                }
                video = new JsonVideo(jsonItem);
            }
            if (typeof jsonItem === 'number') {
                const time = jsonItem;
                if (!video) {
                    throw new Error(`Syntaxe invalide : temps attendu seulement après un ID de vidéo`);
                }
                video.timeMarkers.push(time);
            }
        }
        if (video) {
            // On cloture la vidéo précédente
            videos.push(video);
        }
        return videos;
    }

    private mapToYouTubeTracks(jsonVideos: JsonVideo[]): YouTubeTrack[] {
        return jsonVideos.flatMap(jsonVideo => {
            const video = new YouTubeVideo(jsonVideo.videoId);
            if (jsonVideo.timeMarkers.length) {
                return jsonVideo.timeMarkers.map(time => new AlbumVideoTrack(video, time));
            } else {
                return [new SingleVideoTrack(video)];
            }
        });
    }

    changeDiscId(discId: string, newDiscId: string) {
        if (!this.jsonDiscMappings[discId]) {
            throw new Error(`Aucun disque à l'ID ${discId}`);
        }
        this.jsonDiscMappings[newDiscId] = this.jsonDiscMappings[discId];
        this.removeDisc(discId);
        super.changeDiscId(discId, newDiscId);
    }

    removeDisc(discId: string) {
        delete this.jsonDiscMappings[discId];
        super.removeDisc(discId);
    }

    protected async saveValues(jsonDiscMappings: Record<string, JsonDiscMapping>, persistence: Persistence): Promise<void> {
        // TODO attention c'est chaud comme gestion : il en faut pas avoir plusieurs onglets ouverts avec des données différentes; il faudrait plutôt relire la persistence avec de sauvegarder => tout simplement faire un patch ?
        const allJsonDiscMappings = {
            ...this.jsonDiscMappings,
            ...jsonDiscMappings,
        };
        await persistence.postYouTubeDiscMappings(allJsonDiscMappings);
    }

    /**
     * TODO Attention : ne prend en compte que les mappings chargés, pas ceux modifiés après chargement
     * @param searchedCueDiscId id d'un disque avant refacto 2026 (CUE Sheet avec Disc.File.Track)
     */
    getFirstDiscIdMappedToVideoId(searchedCueDiscId: string): string | undefined {
        for (const discId in this.jsonDiscMappings) {
            const externalTracks = this.getExternalTracks(discId);
            for (const externalTrack of externalTracks) {
                if (externalTrack.video.id === searchedCueDiscId) {
                    return discId;
                }
            }
        }
        return undefined;
    }
}

export type JsonDiscMapping = Array<string | number>;

class JsonVideo {
    readonly timeMarkers?: number[] = [];

    constructor(readonly videoId: string) {
    }
}
