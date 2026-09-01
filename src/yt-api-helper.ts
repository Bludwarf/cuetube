/**
 * Helper pour les appels à l'API YouTube
 * Gère les erreurs YouTube API de manière centralisée
 */
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {GoogleApiYouTubeVideoResource, GoogleApiYouTubePlaylistItemResource, GoogleApiYouTubePaginationInfo} from './GoogleApiYouTubePatch';

export interface YouTubeApiError {
    type: 'NETWORK_ERROR' | 'VIDEO_DELETED' | 'VIDEO_PRIVATE' | 'QUOTA_EXCEEDED' | 'RATE_LIMIT_EXCEEDED' | 'UNKNOWN_ERROR' | 'VIDEO_GONE';
    message: string;
    statusCode?: number;
    originalError?: any;
}

/**
 * Constantes pour la gestion des erreurs YouTube
 */
export const YOUTUBE_ERRORS = {
    // Temps d'attente avant de déclarer une vidéo supprimée (en secondes)
    DELETED_VIDEO_TIMEOUT: 60,
    
    // Codes d'erreur YouTube
    VIDEO_NOT_FOUND: 'videoNotFound',
    VIDEO_PRIVATE: 'privateVideo',
    VIDEO_GONE: 'videoGone',
    RATE_LIMIT_EXCEEDED: 'rateLimitExceeded',
    QUOTA_EXCEEDED: 'quotaExceeded',
    FORBIDDEN: 'forbidden'
};

/**
 * Service pour les appels à l'API YouTube avec gestion des erreurs
 */
export class YouTubeApiHelper {
    
    constructor(private http: HttpClient) {}
    
    /**
     * Récupère les informations d'une vidéo YouTube
     * @param videoId ID de la vidéo YouTube
     * @param apiKey Clé API Google
     * @returns Promise avec la vidéo ou rejet avec une erreur typée
     */
    async getVideo(videoId: string, apiKey: string): Promise<GoogleApiYouTubeVideoResource> {
        try {
            const response = await this.http.get<GoogleApiYouTubePaginationInfo<GoogleApiYouTubeVideoResource>>(
                'https://www.googleapis.com/youtube/v3/videos',
                {
                    params: {
                        key: apiKey,
                        part: 'snippet,contentDetails',
                        id: videoId,
                        maxResults: '1'
                    }
                }
            ).toPromise();
            
            if (!response || !response.items || response.items.length !== 1) {
                const error: YouTubeApiError = {
                    type: 'VIDEO_DELETED',
                    message: `Aucune vidéo trouvée pour l'ID : ${videoId}`,
                    statusCode: 404,
                    originalError: new Error('Items not found for videoId ' + videoId)
                };
                throw error;
            }
            
            return response.items[0];
            
        } catch (error) {
            const youtubeError = this.parseYouTubeError(error, videoId);
            throw youtubeError;
        }
    }
    
    /**
     * Récupère les éléments d'une playlist YouTube
     * @param playlistId ID de la playlist YouTube
     * @param apiKey Clé API Google
     * @returns Promise avec les éléments de la playlist ou rejet avec une erreur typée
     */
    async getPlaylistItems(playlistId: string, apiKey: string): Promise<GoogleApiYouTubePlaylistItemResource[]> {
        try {
            const response = await this.http.get<GoogleApiYouTubePaginationInfo<GoogleApiYouTubePlaylistItemResource>>(
                'https://www.googleapis.com/youtube/v3/playlistItems',
                {
                    params: {
                        key: apiKey,
                        part: 'snippet',
                        playlistId: playlistId,
                        maxResults: '50'
                    }
                }
            ).toPromise();
            
            if (response.pageInfo && response.pageInfo.totalResults > response.pageInfo.resultsPerPage) {
                const error: YouTubeApiError = {
                    type: 'UNKNOWN_ERROR',
                    message: 'Trop de résultats (> 50)',
                    originalError: new Error('Too much results (> 50)')
                };
                throw error;
            }
            
            return response.items;
            
        } catch (error) {
            const youtubeError = this.parseYouTubeError(error, playlistId, 'playlist');
            throw youtubeError;
        }
    }
    
    /**
     * Parse une erreur YouTube API et la transforme en YouTubeApiError typé
     * @param error Erreur brute
     * @param resourceId ID de la ressource (vidéo ou playlist)
     * @param resourceType Type de ressource ('video' ou 'playlist')
     * @returns YouTubeApiError typé
     */
    private parseYouTubeError(error: any, resourceId: string, resourceType: 'video' | 'playlist' = 'video'): YouTubeApiError {
        let httpError: HttpErrorResponse;
        
        // Vérifier si c'est une HttpErrorResponse
        if (error instanceof HttpErrorResponse) {
            httpError = error;
        } else if (error && error.error && error.status) {
            // Cas où l'erreur est déjà un objet avec status et error
            httpError = new HttpErrorResponse({
                error: error.error,
                status: error.status,
                statusText: error.statusText || 'Unknown',
                url: error.url || ''
            });
        } else {
            // Erreur réseau ou autre
            const networkError: YouTubeApiError = {
                type: 'NETWORK_ERROR',
                message: `Erreur réseau pour ${resourceType} ${resourceId}: ${error.message || String(error)}`,
                originalError: error
            };
            return networkError;
        }
        
        const status = httpError.status;
        const errorBody = httpError.error;
        
        // Extraire les détails de l'erreur YouTube
        let reason = '';
        let message = '';
        
        if (errorBody && errorBody.error) {
            const youtubeError = errorBody.error;
            if (Array.isArray(youtubeError.errors) && youtubeError.errors.length > 0) {
                reason = youtubeError.errors[0].reason || '';
                message = youtubeError.errors[0].message || '';
            } else if (typeof youtubeError === 'string') {
                message = youtubeError;
            }
        }
        
        // Déterminer le type d'erreur en fonction du status et du reason
        switch (status) {
            case 404: // Not Found
                if (reason === YOUTUBE_ERRORS.VIDEO_NOT_FOUND || reason === YOUTUBE_ERRORS.VIDEO_GONE) {
                    return {
                        type: 'VIDEO_DELETED',
                        message: message || `Vidéo ${resourceId} introuvable ou supprimée`,
                        statusCode: status,
                        originalError: error
                    };
                }
                return {
                    type: 'VIDEO_DELETED',
                    message: message || `Ressource ${resourceType} ${resourceId} introuvable`,
                    statusCode: status,
                    originalError: error
                };
            
            case 410: // Gone
                return {
                    type: 'VIDEO_GONE',
                    message: message || `Vidéo ${resourceId} définitivement supprimée`,
                    statusCode: status,
                    originalError: error
                };
            
            case 403: // Forbidden
                if (reason === YOUTUBE_ERRORS.RATE_LIMIT_EXCEEDED) {
                    return {
                        type: 'RATE_LIMIT_EXCEEDED',
                        message: message || 'Limite de taux dépassée. Veuillez réessayer plus tard.',
                        statusCode: status,
                        originalError: error
                    };
                }
                if (reason === YOUTUBE_ERRORS.QUOTA_EXCEEDED) {
                    return {
                        type: 'QUOTA_EXCEEDED',
                        message: message || 'Quota API épuisé. Veuillez réessayer plus tard.',
                        statusCode: status,
                        originalError: error
                    };
                }
                if (reason === YOUTUBE_ERRORS.VIDEO_PRIVATE || reason === YOUTUBE_ERRORS.FORBIDDEN) {
                    return {
                        type: 'VIDEO_PRIVATE',
                        message: message || `Vidéo ${resourceId} privée ou restreinte`,
                        statusCode: status,
                        originalError: error
                    };
                }
                return {
                    type: 'VIDEO_PRIVATE',
                    message: message || `Accès refusé à la ${resourceType} ${resourceId}`,
                    statusCode: status,
                    originalError: error
                };
            
            case 0: // Erreur réseau (timeout, pas de connexion)
                return {
                    type: 'NETWORK_ERROR',
                    message: message || `Erreur réseau pour ${resourceType} ${resourceId}`,
                    statusCode: status,
                    originalError: error
                };
            
            default:
                return {
                    type: 'UNKNOWN_ERROR',
                    message: message || `Erreur inconnue (${status}) pour ${resourceType} ${resourceId}`,
                    statusCode: status,
                    originalError: error
                };
        }
    }
    
    /**
     * Vérifie si une erreur est due à une vidéo supprimée
     * @param error Erreur à vérifier
     * @returns true si la vidéo est supprimée
     */
    static isVideoDeleted(error: any): boolean {
        if (!error) return false;
        
        if (error.type === 'VIDEO_DELETED' || error.type === 'VIDEO_GONE') {
            return true;
        }
        
        if (error.status === 404 || error.status === 410) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Vérifie si une erreur est due à une vidéo privée
     * @param error Erreur à vérifier
     * @returns true si la vidéo est privée
     */
    static isVideoPrivate(error: any): boolean {
        if (!error) return false;
        
        if (error.type === 'VIDEO_PRIVATE') {
            return true;
        }
        
        if (error.status === 403 && error.message && error.message.includes('privée')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Vérifie si une erreur est due à un quota épuisé
     * @param error Erreur à vérifier
     * @returns true si le quota est épuisé
     */
    static isQuotaExceeded(error: any): boolean {
        if (!error) return false;
        
        if (error.type === 'QUOTA_EXCEEDED' || error.type === 'RATE_LIMIT_EXCEEDED') {
            return true;
        }
        
        if (error.status === 403 && error.message && 
            (error.message.includes('quota') || error.message.includes('rate limit'))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Vérifie si une erreur est une erreur réseau
     * @param error Erreur à vérifier
     * @returns true si c'est une erreur réseau
     */
    static isNetworkError(error: any): boolean {
        if (!error) return false;
        
        if (error.type === 'NETWORK_ERROR') {
            return true;
        }
        
        if (error.status === 0) {
            return true;
        }
        
        return false;
    }
}
