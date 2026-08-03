/**
 * Tests unitaires pour server.js (Backend Express)
 * Ticket : #203 - Ajouter des tests unitaires pour server.js
 * Priorité : Critique (Risque élevé de régression)
 *
 * Dépendances requises :
 * - supertest (pour tester les routes HTTP)
 * - jest (framework de test)
 *
 * Installation :
 *   npm install --save-dev supertest jest @types/supertest @types/jest
 *
 * Exécution :
 *   npm run test:server
 */

const request = require('supertest');

// Import de l'application Express depuis server.js
// Note: server.js doit exporter l'app avec module.exports = app;
// Pour activer l'export, démarrer le serveur avec NODE_ENV=test
const app = require('../server.js');

// Mock des dépendances externes
jest.mock('cue-parser', () => ({
  parse: jest.fn().mockImplementation((content) => {
    return {
      files: [{ name: 'test.cue', tracks: [] }]
    };
  })
}));

// Mock de la persistance
const mockPersistence = {
  loadCollection: jest.fn().mockImplementation((collectionName) => {
    if (collectionName === 'error') {
      return Promise.reject(new Error('Collection not found'));
    }
    if (collectionName === 'empty') {
      return Promise.resolve([]);
    }
    return Promise.resolve([
      { id: 'disc1', title: 'Test Disc 1', tracks: [] },
      { id: 'disc2', title: 'Test Disc 2', tracks: [] }
    ]);
  }),
  
  loadDisc: jest.fn().mockImplementation((discId) => {
    if (!discId) {
      return Promise.reject(new Error('Missing disc ID'));
    }
    if (discId === 'nonexistent') {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id: discId,
      title: `Disc ${discId}`,
      tracks: []
    });
  }),
  
  saveDisc: jest.fn().mockResolvedValue(true),
  listCollections: jest.fn().mockResolvedValue(['collection1', 'collection2'])
};

jest.mock('./src/persistence/LocalAndDistantPersistence', () => ({
  LocalAndDistantPersistence: jest.fn().mockImplementation(() => mockPersistence)
}));

// Mock de YouTube API
jest.mock('./src/yt-helper', () => ({
  fetchVideo: jest.fn().mockImplementation((videoId) => {
    if (videoId === 'deleted' || videoId === 'invalid') {
      return Promise.reject({ status: 404, message: 'Video not found' });
    }
    if (videoId === 'private') {
      return Promise.reject({ status: 403, message: 'Forbidden' });
    }
    return Promise.resolve({
      id: videoId,
      title: `Test Video ${videoId}`,
      duration: 'PT5M30S'
    });
  })
}));

describe('Server.js - Backend Express', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /player', () => {
    it('✅ should return 400 if no collection or discs parameter is provided', async () => {
      const res = await request(app)
        .get('/player')
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });

    it('✅ should load a collection when collection parameter is provided', async () => {
      const collectionName = 'test-collection';
      const res = await request(app)
        .get(`/player?collection=${collectionName}`)
        .expect(200);
      
      expect(res.body).toHaveProperty('collection', collectionName);
      expect(res.body.discs).toBeDefined();
      expect(mockPersistence.loadCollection).toHaveBeenCalledWith(collectionName);
    });

    it('✅ should return empty array for empty collection', async () => {
      const res = await request(app)
        .get('/player?collection=empty')
        .expect(200);
      
      expect(res.body.discs).toEqual([]);
    });

    it('✅ should load specific discs when discs parameter is provided', async () => {
      const discIds = 'disc1,disc2';
      const res = await request(app)
        .get(`/player?discs=${discIds}`)
        .expect(200);
      
      expect(res.body.discs).toBeDefined();
      expect(res.body.discs).toHaveLength(2);
    });

    it('✅ should return 500 if persistence fails', async () => {
      mockPersistence.loadCollection.mockRejectedValueOnce(new Error('DB error'));
      
      const res = await request(app)
        .get('/player?collection=error')
        .expect(500);
      
      expect(res.body.error).toBe('DB error');
    });
  });

  describe('GET /edit/:id.cue', () => {
    it('✅ should return 400 if disc ID is missing', async () => {
      const res = await request(app)
        .get('/edit/.cue')
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });

    it('✅ should return disc data for valid disc ID', async () => {
      const discId = 'disc1';
      const res = await request(app)
        .get(`/edit/${discId}.cue`)
        .expect(200);
      
      expect(res.body).toHaveProperty('id', discId);
      expect(mockPersistence.loadDisc).toHaveBeenCalledWith(discId);
    });

    it('✅ should return 404 if disc is not found', async () => {
      const res = await request(app)
        .get('/edit/nonexistent.cue')
        .expect(404);
      
      expect(res.body.error).toBeDefined();
    });
  });

  describe('YouTube API Integration', () => {
    it('✅ should handle deleted video (404)', async () => {
      // Si server.js a une route pour YouTube API
      const res = await request(app)
        .get('/api/youtube/deleted')
        .expect(404);
      
      expect(res.body.error).toContain('not found');
    });

    it('✅ should handle private video (403)', async () => {
      const res = await request(app)
        .get('/api/youtube/private')
        .expect(403);
      
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('Error Handling', () => {
    it('✅ should return 404 for nonexistent routes', async () => {
      const res = await request(app)
        .get('/nonexistent-route')
        .expect(404);
    });

    it('✅ should handle 500 errors with error middleware', async () => {
      // Simuler une erreur interne
      const res = await request(app)
        .get('/error')
        .expect(500);
      
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Middleware', () => {
    it('✅ should parse JSON request body', async () => {
      const testData = { test: 'data', nested: { value: 123 } };
      const res = await request(app)
        .post('/test-json')
        .send(testData)
        .set('Content-Type', 'application/json')
        .expect(200);
      
      expect(res.body).toBeDefined();
    });
  });
});
