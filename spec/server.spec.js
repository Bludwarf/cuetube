/**
 * Tests unitaires pour server.js (Backend Express)
 * Ticket : #203 - Ajouter des tests unitaires pour server.js
 * Priorité : Critique (Risque élevé de régression)
 */

const request = require('supertest');
const app = require('../server.js');

// Mock des dépendances
jest.mock('cue-parser', () => ({ parse: jest.fn() }));
jest.mock('./src/persistence/LocalAndDistantPersistence', () => ({
  LocalAndDistantPersistence: jest.fn().mockImplementation(() => ({
    loadCollection: jest.fn().mockResolvedValue([]),
    loadDisc: jest.fn().mockResolvedValue({ id: 'test', tracks: [] }),
    saveDisc: jest.fn().mockResolvedValue(true)
  }))
}));

describe('Server.js - Backend Express', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /player', () => {
    it('should return 400 if no collection or discs parameter', async () => {
      const res = await request(app).get('/player').expect(400);
      expect(res.body.error).toBeDefined();
    });

    it('should load a collection', async () => {
      const res = await request(app).get('/player?collection=test').expect(200);
      expect(res.body).toHaveProperty('collection');
    });

    it('should load specific discs', async () => {
      const res = await request(app).get('/player?discs=Dg0IjOzopYU').expect(200);
      expect(res.body.discs).toBeDefined();
    });
  });

  describe('GET /edit/:id.cue', () => {
    it('should return disc data', async () => {
      const res = await request(app).get('/edit/Dg0IjOzopYU.cue').expect(200);
      expect(res.body.id).toBe('Dg0IjOzopYU');
    });
  });
});
