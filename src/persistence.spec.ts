/**
 * Tests pour la gestion des erreurs YouTube API
 * Couvre les cas : 404 (vidéo supprimée), 403 (vidéo privée/restreinte), quota épuisé, erreurs réseau
 */
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {HttpClient} from '@angular/common/http';
import {Persistence} from './persistence';
import {LocalStoragePersistence} from './persistence/LocalStoragePersistence';
import {GoogleApiYouTubeVideoResource, GoogleApiYouTubePaginationInfo} from './GoogleApiYouTubePatch';

// Classe de test concrète pour Persistence
class TestPersistence extends Persistence {
    title = 'TestPersistence';
    
    constructor(http: HttpClient) {
        super(http);
    }
    
    getCollectionNames(): Promise<string[]> {
        return Promise.resolve([]);
    }
    
    getDiscIds(): Promise<string[]> {
        return Promise.resolve([]);
    }
    
    setCollectionNames(collectionsNames: string[]): Promise<string[]> {
        return Promise.resolve(collectionsNames);
    }
    
    getCollection(collectionName: string): Promise<any> {
        return Promise.resolve(null);
    }
    
    protected postCollection(collection: any): Promise<any> {
        return Promise.resolve(collection);
    }
    
    protected _deleteCollection(collectionName: string): Promise<void> {
        return Promise.resolve();
    }
    
    getAllCollectionsByNames(): Promise<any[]> {
        return Promise.resolve([]);
    }
    
    getAllDiscs(): Promise<any[]> {
        return Promise.resolve([]);
    }
    
    protected postDisc(discId: string, disc: any): Promise<any> {
        return Promise.resolve(disc);
    }
    
    saveSyncState(): Promise<any> {
        return Promise.resolve({});
    }
    
    loadSyncState(): Promise<any> {
        return Promise.resolve({});
    }
}

describe('YouTube API Error Handling', () => {
    let httpMock: HttpTestingController;
    let http: HttpClient;
    let persistence: TestPersistence;
    const GOOGLE_API_KEY = 'test-api-key';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TestPersistence]
        });
        
        httpMock = TestBed.inject(HttpTestingController);
        http = TestBed.inject(HttpClient);
        persistence = new TestPersistence(http);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('404 Not Found (Vidéo supprimée)', () => {
        
        it('should handle 404 Not Found error for deleted video', (done) => {
            const videoId = 'deleted-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(404);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=deleted-video-id&maxResults=1');
            req.flush({error: {code: 404, message: 'Not Found'}}, {status: 404, statusText: 'Not Found'});
        });

        it('should handle 404 with YouTube-specific error details', (done) => {
            const videoId = 'deleted-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.error).toBeDefined();
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=deleted-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'videoNotFound',
                            message: 'The requested video was not found.'
                        }
                    ]
                }
            }, {status: 404, statusText: 'Not Found'});
        });
    });

    describe('403 Forbidden (Vidéo privée/restreinte)', () => {
        
        it('should handle 403 Forbidden for private video', (done) => {
            const videoId = 'private-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(403);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=private-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'forbidden',
                            message: 'The request is not allowed.'
                        }
                    ]
                }
            }, {status: 403, statusText: 'Forbidden'});
        });

        it('should handle 403 with privacyStatus=private', (done) => {
            const videoId = 'private-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(403);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=private-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'privateVideo',
                            message: 'This video is private.'
                        }
                    ]
                }
            }, {status: 403, statusText: 'Forbidden'});
        });
    });

    describe('403 rateLimitExceeded (Quota API épuisé)', () => {
        
        it('should handle 403 rateLimitExceeded error', (done) => {
            const videoId = 'any-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(403);
                expect(err.error.errors[0].reason).toBe('rateLimitExceeded');
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=any-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'rateLimitExceeded',
                            message: 'Rate limit exceeded. Please retry later.'
                        }
                    ]
                }
            }, {status: 403, statusText: 'Forbidden'});
        });

        it('should handle 403 quotaExceeded error', (done) => {
            const videoId = 'any-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(403);
                expect(err.error.errors[0].reason).toBe('quotaExceeded');
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=any-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'quotaExceeded',
                            message: 'The request cannot be completed because you have exceeded your quota.'
                        }
                    ]
                }
            }, {status: 403, statusText: 'Forbidden'});
        });
    });

    describe('Network Errors (Timeout, No Connection)', () => {
        
        it('should handle network timeout error', (done) => {
            const videoId = 'any-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(0);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=any-video-id&maxResults=1');
            req.error(new ProgressEvent('timeout'));
        });

        it('should handle network error (no connection)', (done) => {
            const videoId = 'any-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(0);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=any-video-id&maxResults=1');
            req.error(new Error('Network error'));
        });
    });

    describe('410 Gone (Vidéo définitivement supprimée)', () => {
        
        it('should handle 410 Gone for permanently deleted video', (done) => {
            const videoId = 'gone-video-id';
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.status).toBe(410);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=gone-video-id&maxResults=1');
            req.flush({
                error: {
                    errors: [
                        {
                            domain: 'youtube.v3',
                            reason: 'videoGone',
                            message: 'The video has been permanently deleted.'
                        }
                    ]
                }
            }, {status: 410, statusText: 'Gone'});
        });
    });

    describe('Success Cases', () => {
        
        it('should return video data on success', (done) => {
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
                    thumbnails: {},
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
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then((video) => {
                expect(video).toBeDefined();
                expect(video.id).toBe(videoId);
                expect(video.snippet.title).toBe('Test Video');
                expect(video.contentDetails.duration).toBe('PT10M30S');
                done();
            }).catch((err) => {
                fail('Should not have thrown an error: ' + err);
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=valid-video-id&maxResults=1');
            req.flush(mockResponse);
        });

        it('should handle empty items array', (done) => {
            const videoId = 'not-found-video-id';
            
            const mockResponse: GoogleApiYouTubePaginationInfo<GoogleApiYouTubeVideoResource> = {
                kind: 'youtube#videoListResponse',
                etag: 'etag-value',
                pageInfo: {
                    totalResults: 0,
                    resultsPerPage: 0
                },
                items: []
            };
            
            persistence.getVideo(videoId, GOOGLE_API_KEY).then(() => {
                fail('Should have thrown an error');
                done();
            }).catch((err) => {
                expect(err).toBeDefined();
                expect(err.message).toContain('Items not found');
                done();
            });

            const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/videos?key=test-api-key&part=snippet%2CcontentDetails&id=not-found-video-id&maxResults=1');
            req.flush(mockResponse);
        });
    });
});

describe('Playlist Items Error Handling', () => {
    let httpMock: HttpTestingController;
    let http: HttpClient;
    let persistence: TestPersistence;
    const GOOGLE_API_KEY = 'test-api-key';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [TestPersistence]
        });
        
        httpMock = TestBed.inject(HttpTestingController);
        http = TestBed.inject(HttpClient);
        persistence = new TestPersistence(http);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should handle 404 for playlist items', (done) => {
        const playlistId = 'deleted-playlist-id';
        
        persistence.getPlaylistItems(playlistId, GOOGLE_API_KEY).then(() => {
            fail('Should have thrown an error');
            done();
        }).catch((err) => {
            expect(err).toBeDefined();
            expect(err.status).toBe(404);
            done();
        });

        const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/playlistItems?key=test-api-key&part=snippet&playlistId=deleted-playlist-id&maxResults=50');
        req.flush({error: {code: 404, message: 'Not Found'}}, {status: 404, statusText: 'Not Found'});
    });

    it('should handle 403 for private playlist', (done) => {
        const playlistId = 'private-playlist-id';
        
        persistence.getPlaylistItems(playlistId, GOOGLE_API_KEY).then(() => {
            fail('Should have thrown an error');
            done();
        }).catch((err) => {
            expect(err).toBeDefined();
            expect(err.status).toBe(403);
            done();
        });

        const req = httpMock.expectOne('https://www.googleapis.com/youtube/v3/playlistItems?key=test-api-key&part=snippet&playlistId=private-playlist-id&maxResults=50');
        req.flush({
            error: {
                errors: [
                    {
                        domain: 'youtube.v3',
                        reason: 'forbidden',
                        message: 'Access denied'
                    }
                ]
            }
        }, {status: 403, statusText: 'Forbidden'});
    });
});
