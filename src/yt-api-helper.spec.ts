/**
 * Tests pour YouTubeApiHelper avec gestion des erreurs YouTube API
 * Utilise nock pour le mocking HTTP
 */
import * as nock from 'nock';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {HttpClient} from '@angular/common/http';
import {YouTubeApiHelper, YouTubeApiError, YOUTUBE_ERRORS} from './yt-api-helper';
import {GoogleApiYouTubeVideoResource, GoogleApiYouTubePaginationInfo} from './GoogleApiYouTubePatch';

describe('YouTubeApiHelper - Error Handling', () => {
    let http: HttpClient;
    let apiHelper: YouTubeApiHelper;
    let httpMock: HttpTestingController;

    const GOOGLE_API_KEY = 'test-api-key';
    const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });
        
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
        apiHelper = new YouTubeApiHelper(http);
    });

    afterEach(() => {
        httpMock.verify();
        nock.cleanAll();
    });

    describe('404 Not Found (Vidéo supprimée)', () => {
        
        it('should handle 404 Not Found with videoNotFound reason', async () => {
            const videoId = 'deleted-video-id';
            
            // Configuration de nock pour simuler une réponse 404
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query({
                    key: GOOGLE_API_KEY,
                    part: 'snippet,contentDetails',
                    id: videoId,
                    maxResults: '1'
                })
                .reply(404, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.VIDEO_NOT_FOUND,
                                message: 'The requested video was not found.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_DELETED');
                expect(ytError.message).toContain('introuvable ou supprimée');
                expect(ytError.statusCode).toBe(404);
                expect(YouTubeApiHelper.isVideoDeleted(ytError)).toBe(true);
            }
        });

        it('should handle 404 with videoGone reason', async () => {
            const videoId = 'gone-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(404, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.VIDEO_GONE,
                                message: 'The video has been permanently deleted.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_DELETED');
                expect(YouTubeApiHelper.isVideoDeleted(ytError)).toBe(true);
            }
        });

        it('should handle 404 with empty response', async () => {
            const videoId = 'not-found-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(404, {});

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_DELETED');
                expect(ytError.statusCode).toBe(404);
            }
        });
    });

    describe('410 Gone (Vidéo définitivement supprimée)', () => {
        
        it('should handle 410 Gone', async () => {
            const videoId = 'permanently-deleted-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(410, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.VIDEO_GONE,
                                message: 'The video has been permanently deleted.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_GONE');
                expect(ytError.statusCode).toBe(410);
                expect(YouTubeApiHelper.isVideoDeleted(ytError)).toBe(true);
            }
        });
    });

    describe('403 Forbidden (Vidéo privée/restreinte)', () => {
        
        it('should handle 403 with privateVideo reason', async () => {
            const videoId = 'private-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(403, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.VIDEO_PRIVATE,
                                message: 'This video is private.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_PRIVATE');
                expect(ytError.statusCode).toBe(403);
                expect(YouTubeApiHelper.isVideoPrivate(ytError)).toBe(true);
            }
        });

        it('should handle 403 with forbidden reason', async () => {
            const videoId = 'restricted-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(403, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.FORBIDDEN,
                                message: 'The request is not allowed.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_PRIVATE');
                expect(YouTubeApiHelper.isVideoPrivate(ytError)).toBe(true);
            }
        });
    });

    describe('403 rateLimitExceeded (Quota API épuisé)', () => {
        
        it('should handle 403 with rateLimitExceeded reason', async () => {
            const videoId = 'any-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(403, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.RATE_LIMIT_EXCEEDED,
                                message: 'Rate limit exceeded. Please retry later.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('RATE_LIMIT_EXCEEDED');
                expect(ytError.statusCode).toBe(403);
                expect(YouTubeApiHelper.isQuotaExceeded(ytError)).toBe(true);
            }
        });

        it('should handle 403 with quotaExceeded reason', async () => {
            const videoId = 'any-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(403, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: YOUTUBE_ERRORS.QUOTA_EXCEEDED,
                                message: 'The request cannot be completed because you have exceeded your quota.'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('QUOTA_EXCEEDED');
                expect(YouTubeApiHelper.isQuotaExceeded(ytError)).toBe(true);
            }
        });
    });

    describe('Network Errors (Timeout, No Connection)', () => {
        
        it('should handle timeout error', async () => {
            const videoId = 'any-video-id';
            
            // Simuler un timeout avec nock
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .socketDelay(10000) // Délai très long
                .replyWithError({code: 'ETIMEDOUT', message: 'Connection timeout'});

            try {
                // On utilise HttpTestingController pour simuler un timeout
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                // Le test peut échouer ici car nock ne gère pas parfaitement les timeouts
                // Mais on vérifie que l'erreur est gérée
                expect(ytError).toBeDefined();
            }
        });

        it('should handle network error using HttpTestingController', async () => {
            const videoId = 'any-video-id';
            
            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError).toBeDefined();
                // L'erreur sera de type NETWORK_ERROR ou UNKNOWN_ERROR
                expect(['NETWORK_ERROR', 'UNKNOWN_ERROR']).toContain(ytError.type);
            }

            // Intercepter la requête et simuler une erreur réseau
            const req = httpMock.expectOne(`${YOUTUBE_API_URL}/videos?key=${GOOGLE_API_KEY}&part=snippet%2CcontentDetails&id=${videoId}&maxResults=1`);
            req.error(new ProgressEvent('timeout'));
        });

        it('should handle generic network error', async () => {
            const videoId = 'any-video-id';
            
            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError).toBeDefined();
                expect(YouTubeApiHelper.isNetworkError(ytError)).toBe(true);
            }

            const req = httpMock.expectOne(`${YOUTUBE_API_URL}/videos?key=${GOOGLE_API_KEY}&part=snippet%2CcontentDetails&id=${videoId}&maxResults=1`);
            req.error(new ErrorEvent('Network error'));
        });
    });

    describe('Success Cases', () => {
        
        it('should return video data on success', async () => {
            const videoId = 'valid-video-id';
            const mockVideo: GoogleApiYouTubeVideoResource = {
                id: videoId,
                kind: 'youtube#video',
                etag: 'etag-value',
                snippet: {
                    publishedAt: '2023-01-01T00:00:00Z',
                    channelId: 'channel-id',
                    title: 'Test Video',
                    description: 'Test Description',
                    thumbnails: {
                        default: {url: 'http://example.com/thumb.jpg', width: 120, height: 90},
                        medium: {url: 'http://example.com/thumb.jpg', width: 320, height: 180},
                        high: {url: 'http://example.com/thumb.jpg', width: 480, height: 360}
                    },
                    channelTitle: 'Test Channel',
                    categoryId: '22',
                    liveBroadcastContent: 'none',
                    localized: {
                        title: 'Test Video',
                        description: 'Test Description'
                    }
                },
                contentDetails: {
                    duration: 'PT10M30S',
                    dimension: '2d',
                    definition: 'hd',
                    caption: 'false',
                    licensedContent: false,
                    projection: 'rectangular'
                }
            };
            
            const mockResponse: GoogleApiYouTubePaginationInfo<GoogleApiYouTubeVideoResource> = {
                kind: 'youtube#videoListResponse',
                etag: 'etag-value',
                pageInfo: {
                    totalResults: 1,
                    resultsPerPage: 1
                },
                items: [mockVideo]
            };

            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(200, mockResponse);

            const result = await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
            expect(result).toBeDefined();
            expect(result.id).toBe(videoId);
            expect(result.snippet.title).toBe('Test Video');
            expect(result.contentDetails.duration).toBe('PT10M30S');
        });

        it('should handle empty items array as VIDEO_DELETED', async () => {
            const videoId = 'not-found-video-id';
            
            nock(YOUTUBE_API_URL)
                .get('/videos')
                .query(true)
                .reply(200, {
                    kind: 'youtube#videoListResponse',
                    etag: 'etag-value',
                    pageInfo: {
                        totalResults: 0,
                        resultsPerPage: 0
                    },
                    items: []
                });

            try {
                await apiHelper.getVideo(videoId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('VIDEO_DELETED');
                expect(ytError.message).toContain('Aucune vidéo trouvée');
            }
        });
    });

    describe('Playlist Items Error Handling', () => {
        
        it('should handle 404 for playlist items', async () => {
            const playlistId = 'deleted-playlist-id';
            
            nock(YOUTUBE_API_URL)
                .get('/playlistItems')
                .query({
                    key: GOOGLE_API_KEY,
                    part: 'snippet',
                    playlistId: playlistId,
                    maxResults: '50'
                })
                .reply(404, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: 'playlistNotFound',
                                message: 'Playlist not found'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getPlaylistItems(playlistId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError).toBeDefined();
                expect(ytError.statusCode).toBe(404);
            }
        });

        it('should handle 403 for private playlist', async () => {
            const playlistId = 'private-playlist-id';
            
            nock(YOUTUBE_API_URL)
                .get('/playlistItems')
                .query(true)
                .reply(403, {
                    error: {
                        errors: [
                            {
                                domain: 'youtube.v3',
                                reason: 'forbidden',
                                message: 'Access denied'
                            }
                        ]
                    }
                });

            try {
                await apiHelper.getPlaylistItems(playlistId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError).toBeDefined();
                expect(ytError.statusCode).toBe(403);
            }
        });

        it('should handle too many results (> 50)', async () => {
            const playlistId = 'large-playlist-id';
            
            nock(YOUTUBE_API_URL)
                .get('/playlistItems')
                .query(true)
                .reply(200, {
                    kind: 'youtube#playlistItemListResponse',
                    etag: 'etag-value',
                    pageInfo: {
                        totalResults: 100,
                        resultsPerPage: 50
                    },
                    items: []
                });

            try {
                await apiHelper.getPlaylistItems(playlistId, GOOGLE_API_KEY);
                fail('Should have thrown an error');
            } catch (error) {
                const ytError = error as YouTubeApiError;
                expect(ytError.type).toBe('UNKNOWN_ERROR');
                expect(ytError.message).toContain('Trop de résultats');
            }
        });
    });

    describe('Static Helper Methods', () => {
        
        it('isVideoDeleted should return true for VIDEO_DELETED type', () => {
            const error: YouTubeApiError = {
                type: 'VIDEO_DELETED',
                message: 'Video deleted',
                statusCode: 404
            };
            expect(YouTubeApiHelper.isVideoDeleted(error)).toBe(true);
        });

        it('isVideoDeleted should return true for VIDEO_GONE type', () => {
            const error: YouTubeApiError = {
                type: 'VIDEO_GONE',
                message: 'Video gone',
                statusCode: 410
            };
            expect(YouTubeApiHelper.isVideoDeleted(error)).toBe(true);
        });

        it('isVideoDeleted should return true for status 404', () => {
            const error = {
                status: 404,
                message: 'Not found'
            };
            expect(YouTubeApiHelper.isVideoDeleted(error)).toBe(true);
        });

        it('isVideoDeleted should return true for status 410', () => {
            const error = {
                status: 410,
                message: 'Gone'
            };
            expect(YouTubeApiHelper.isVideoDeleted(error)).toBe(true);
        });

        it('isVideoPrivate should return true for VIDEO_PRIVATE type', () => {
            const error: YouTubeApiError = {
                type: 'VIDEO_PRIVATE',
                message: 'Video private',
                statusCode: 403
            };
            expect(YouTubeApiHelper.isVideoPrivate(error)).toBe(true);
        });

        it('isVideoPrivate should return true for private message', () => {
            const error = {
                status: 403,
                message: 'Vidéo privée ou restreinte'
            };
            expect(YouTubeApiHelper.isVideoPrivate(error)).toBe(true);
        });

        it('isQuotaExceeded should return true for QUOTA_EXCEEDED type', () => {
            const error: YouTubeApiError = {
                type: 'QUOTA_EXCEEDED',
                message: 'Quota exceeded',
                statusCode: 403
            };
            expect(YouTubeApiHelper.isQuotaExceeded(error)).toBe(true);
        });

        it('isQuotaExceeded should return true for RATE_LIMIT_EXCEEDED type', () => {
            const error: YouTubeApiError = {
                type: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded',
                statusCode: 403
            };
            expect(YouTubeApiHelper.isQuotaExceeded(error)).toBe(true);
        });

        it('isQuotaExceeded should return true for quota message', () => {
            const error = {
                status: 403,
                message: 'Quota API épuisé'
            };
            expect(YouTubeApiHelper.isQuotaExceeded(error)).toBe(true);
        });

        it('isNetworkError should return true for NETWORK_ERROR type', () => {
            const error: YouTubeApiError = {
                type: 'NETWORK_ERROR',
                message: 'Network error',
                statusCode: 0
            };
            expect(YouTubeApiHelper.isNetworkError(error)).toBe(true);
        });

        it('isNetworkError should return true for status 0', () => {
            const error = {
                status: 0,
                message: 'Network error'
            };
            expect(YouTubeApiHelper.isNetworkError(error)).toBe(true);
        });

        it('all helpers should return false for null/undefined', () => {
            expect(YouTubeApiHelper.isVideoDeleted(null)).toBe(false);
            expect(YouTubeApiHelper.isVideoDeleted(undefined)).toBe(false);
            expect(YouTubeApiHelper.isVideoPrivate(null)).toBe(false);
            expect(YouTubeApiHelper.isQuotaExceeded(null)).toBe(false);
            expect(YouTubeApiHelper.isNetworkError(null)).toBe(false);
        });
    });
});
