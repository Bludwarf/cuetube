import {MemoryPersistence} from './persistence/MemoryPersistence';
import Collection from './Collection';
import {Disc} from './disc';
import {TestUtils} from './TestUtils';
import {SyncResult, SyncState} from './persistence';
import * as _ from 'underscore';
import {LocalAndDistantPersistence} from './persistence/LocalAndDistantPersistence';
//const Queue = require('promise-queue');

describe('persistence', () => {

    it('should sync two persistences', (done) => {

        // Disques
        const localDisc = TestUtils.createDisc('localDisc');
        const distantDisc = TestUtils.createDisc('distantDisc');
        /** disque en commun et égal */
        const localEqualDisc = TestUtils.createDisc('equalDisc');
        const distantEqualDisc = TestUtils.createDisc('equalDisc');
        /** disque en commun mais différent */
        const localDiffDisc = TestUtils.createDisc('diffDisc').withTitle('localDiffDisc');
        const distantDiffDisc = TestUtils.createDisc('diffDisc').withTitle('distantDiffDisc');

        // Collections
        const localCollection = new Collection("localCollection");
        localCollection.push(localDisc, localEqualDisc, localDiffDisc);
        const distantCollection = new Collection("distantCollection");
        distantCollection.push(distantDisc, distantEqualDisc, distantDiffDisc);
        const localCommonCollection = new Collection("commonCollection");
        localCommonCollection.push(localDisc, localEqualDisc, localDiffDisc);
        const distantCommonCollection = new Collection("commonCollection");
        distantCommonCollection.push(distantDisc, localEqualDisc, localDiffDisc);
        const localNotModCommonCollection = new Collection("commonNotModCollection");
        localNotModCommonCollection.push(localEqualDisc);
        const distantNotModCommonCollection = new Collection("commonNotModCollection");
        distantNotModCommonCollection.push(localEqualDisc);

        // Local
        const local = new MemoryPersistence(null);

        // Distant
        const distant = new MemoryPersistence(null);

        Promise.all([
            // Collections
            local.saveCollections([localCollection, localCommonCollection, localNotModCommonCollection]),
            distant.saveCollections([distantCollection, distantCommonCollection, distantNotModCommonCollection]),
            // Disques
            local.saveDisc(localDisc.id, localDisc),
            local.saveDisc(localEqualDisc.id, localEqualDisc),
            local.saveDisc(localDiffDisc.id, localDiffDisc),
            distant.saveDisc(distantDisc.id, distantDisc),
            distant.saveDisc(distantEqualDisc.id, distantEqualDisc),
            distant.saveDisc(distantDiffDisc.id, distantDiffDisc),
        ]).then(res => local.sync(distant))
        .then(syncResult => {

            // Assertions sur le rapport de synchro

            const expected: SyncResult = {
                collections: {
                    pulled: [
                        distantCollection
                    ],
                    pushed: [
                        localCollection
                    ],
                    common: {
                        pulled: [
                            distantCommonCollection
                        ],
                        pushed: [
                            localCommonCollection
                        ]
                    }
                },
                discs: {
                    pulled: [
                        distantDisc,
                    ],
                    pushed: [
                        localDisc
                    ],
                    common: {
                        pulled: [
                            distantDiffDisc
                        ],
                        pushed: [
                        ]
                    }
                }
            };
            expect(toObject(syncResult)).toEqual(toObject(expected));

            return syncResult;

        }).then(res => Promise.all([
            local.getCollectionByNames([localCollection.name, localCommonCollection.name, distantCollection.name]),
            distant.getCollectionByNames([localCollection.name, localCommonCollection.name, distantCollection.name])
        ])).then(res => {

            // Assertion sur les collections
            const [localCollections, distantCollections] = res;

            // On retrouve toutes les collections des deux côtés
            const localCollectionNames = Object.keys(localCollections);
            expect(localCollectionNames).toContain(localCollection.name);
            expect(localCollectionNames).toContain(localCommonCollection.name);
            expect(localCollectionNames).toContain(distantCollection.name);
            const distantCollectionNames = Object.keys(distantCollections);
            expect(distantCollectionNames).toContain(localCollection.name);
            expect(distantCollectionNames).toContain(localCommonCollection.name);
            expect(distantCollectionNames).toContain(distantCollection.name);

            // Ce sont les mêmes collections
            expect(localCollections[localCollection.name]).toEqual(distantCollections[localCollection.name]);
            const localCollectionsDiscIds = localCollections[localCollection.name].discIds;
            expect(localCollectionsDiscIds).toEqual([
                localDisc.id,
                localEqualDisc.id,
                localDiffDisc.id
            ]);
            expect(localCollections[localCommonCollection.name]).toEqual(distantCollections[localCommonCollection.name]);
            const commonCollectionDiscIds = localCollections[localCommonCollection.name].discIds;
            expect(commonCollectionDiscIds).toEqual([
                distantDisc.id,
                distantEqualDisc.id,
                distantDiffDisc.id,
                localDisc.id // on prend d'abord le distant puis on ajoute le local
            ]);
            expect(localCollections[distantCollection.name]).toEqual(distantCollections[distantCollection.name]);
            const distantCollectionDiscIds = localCollections[distantCollection.name].discIds;
            expect(distantCollectionDiscIds).toEqual([
                distantDisc.id,
                distantEqualDisc.id,
                distantDiffDisc.id
            ]);

        }).then(res => Promise.all([
            // Récup des disques
            local.getDiscs([localDisc.id, distantDisc.id, localEqualDisc.id, localDiffDisc.id]),
            distant.getDiscs([localDisc.id, distantDisc.id, localEqualDisc.id, localDiffDisc.id])
        ])).then(res => {

            const [localDiscs, distantDiscs] = res;

            // Liste locale
            expect(localDiscs).toEqual([
                localDisc,
                distantDisc,
                localEqualDisc,
                distantDiffDisc // localDiffDisc est écrasé par distantDiffDisc car disque différent
            ]);

            // Liste distante
            expect(distantDiscs).toEqual([
                localDisc,
                distantDisc,
                localEqualDisc,
                distantDiffDisc
            ]);

        }).then(res => done());
    });

    /**
     * Chaque persistance doit stocker son état actuel et l'actualiser à chaque modif (post)
     */
    it('should save current persistence state', (done) => {

        const p = new MemoryPersistence(null);
        let syncState;

        // Disques
        const thriller = TestUtils.createDisc('Thriller')
            .withFile("Disque 1")
            .withTrack("Bilie Jean")
            .endTrack()
            .endFile();
        const darkSideOfTheMoon = TestUtils.createDisc('The Dark Side of the Moon')
            .withFile("Disque 1")
            .withTrack("Cluster One")
            .endTrack()
            .endFile();
        const secretWorld = TestUtils.createDisc('Secret World')
            .withFile("Disque 1")
            .withTrack("Come Talk To Me")
            .endTrack()
            .endFile();

        // Collections
        const collectionVide = new Collection("Collection vide");
        const collectionComplete = new Collection("Collection complète");
        collectionComplete.pushDiscs(thriller, darkSideOfTheMoon);

        let lastState: any = {};

        // Création dans la persistence
        p.getSyncState().then(loadedSyncState => {
            expect(loadedSyncState).not.toBeNull();
            syncState = loadedSyncState;
        }).then(res => {
            return Promise.all([
                p.saveDisc(thriller.id, thriller),
                p.saveDisc(darkSideOfTheMoon.id, darkSideOfTheMoon),
                p.saveCollection(collectionVide),
                p.saveCollection(collectionComplete)
            ]);
        }).then(res => {

            // Attendus
            expect(syncState).not.toBeNull();
            expect(syncState.discs).not.toBeNull();
            expect(syncState.discs.elementsById).not.toBeNull();
            const discs = syncState.discs.elementsById;

            // Disques
            expect(_.size(discs)).toBe(2);

            // Thriller
            const thrillerState = discs[thriller.id];
            expect(thrillerState).not.toBeNull();
            expect(thrillerState.created).not.toBeNull();
            expect(thrillerState.lastmod).not.toBeNull();
            expect(thrillerState.checksum).not.toBeNull();
            lastState.thriller = {
                created: thrillerState.created,
                lastmod: thrillerState.lastmod,
                checksum: thrillerState.checksum
            };

            // Dark Side
            const darkSideState = discs[darkSideOfTheMoon.id];
            expect(darkSideState).not.toBeNull();
            expect(darkSideState.created).not.toBeNull();
            expect(darkSideState.lastmod).not.toBeNull();
            expect(darkSideState.checksum).not.toBeNull();
            lastState.darkSideOfTheMoon = {
                created: darkSideState.created,
                lastmod: darkSideState.lastmod,
                checksum: darkSideState.checksum
            }

            // TODO : collection

        }).then(res => {

            // On pousse Thriller sans le modifier
            return p.saveDisc(thriller.id, thriller);

        }).then(res => {

            const discs = syncState.discs.elementsById;
            expect(_.size(discs)).toBe(2);

            // Thriller ne doit pas avoir changé
            const thrillerState = discs[thriller.id];
            expect(thrillerState).not.toBeNull();
            expect(thrillerState.created).toBe(lastState.thriller.created);
            expect(thrillerState.lastmod).toBe(lastState.thriller.lastmod);
            expect(thrillerState.checksum).toBe(lastState.thriller.checksum);

            // Ni DarkSide
            const darkSideState = discs[darkSideOfTheMoon.id];
            expect(darkSideState).not.toBeNull();
            expect(darkSideState.created).toBe(lastState.darkSideOfTheMoon.created);
            expect(darkSideState.lastmod).toBe(lastState.darkSideOfTheMoon.lastmod);
            expect(darkSideState.checksum).toBe(lastState.darkSideOfTheMoon.checksum);

        }).then(res => {

            // On modifie vraiment Thriller
            thriller.files[0].tracks[0].title = "Bily Gin";
            return p.saveDisc(thriller.id, thriller);

        }).then(res => {

            const discs = syncState.discs.elementsById;
            expect(_.size(discs)).toBe(2);

            // Seul Thriller doit avoir changé
            const thrillerState = discs[thriller.id];
            expect(thrillerState).not.toBeNull();
            expect(thrillerState.created).toBe(lastState.thriller.created);
            expect(thrillerState.lastmod).not.toBe(lastState.thriller.lastmod);
            expect(thrillerState.checksum).not.toBe(lastState.thriller.checksum);
            lastState.thriller = {
                created: thrillerState.created,
                lastmod: thrillerState.lastmod,
                checksum: thrillerState.checksum
            };

            // Et pas DarkSide
            const darkSideState = discs[darkSideOfTheMoon.id];
            expect(darkSideState).not.toBeNull();
            expect(darkSideState.created).toBe(lastState.darkSideOfTheMoon.created);
            expect(darkSideState.lastmod).toBe(lastState.darkSideOfTheMoon.lastmod);
            expect(darkSideState.checksum).toBe(lastState.darkSideOfTheMoon.checksum);

        }).then(res => {

            // Ajout du disque Secret World
            return p.saveDisc(secretWorld.id, secretWorld);

        }).then(res => {

            const discs = syncState.discs.elementsById;
            expect(_.size(discs)).toBe(3);

            // Seul Secret World doit avoir changé
            const secretWorldState = discs[secretWorld.id];
            expect(secretWorldState).not.toBeNull();
            expect(secretWorldState.created).not.toBeNull();
            expect(secretWorldState.lastmod).not.toBeNull();
            expect(secretWorldState.checksum).not.toBeNull();

            lastState.secretWorld = {
                created: secretWorldState.created,
                lastmod: secretWorldState.lastmod,
                checksum: secretWorldState.checksum
            };

            // Et pas les autres
            const thrillerState = discs[thriller.id];
            expect(thrillerState).not.toBeNull();
            expect(thrillerState.created).toBe(lastState.thriller.created);
            expect(thrillerState.lastmod).toBe(lastState.thriller.lastmod);
            expect(thrillerState.checksum).toBe(lastState.thriller.checksum);

            // Et pas les autres
            const darkSideState = discs[darkSideOfTheMoon.id];
            expect(darkSideState).not.toBeNull();
            expect(darkSideState.created).toBe(lastState.darkSideOfTheMoon.created);
            expect(darkSideState.lastmod).toBe(lastState.darkSideOfTheMoon.lastmod);
            expect(darkSideState.checksum).toBe(lastState.darkSideOfTheMoon.checksum);

        }).then(res => {

            // Sauvegarde du disque Secret World sans modification
            return p.saveDisc(secretWorld.id, secretWorld);

        }).then(res => {

            const discs = syncState.discs.elementsById;
            expect(_.size(discs)).toBe(3);

            // Secret World ne doit pas avoir changé
            const secretWorldState = discs[secretWorld.id];
            expect(secretWorldState).not.toBeNull();
            expect(secretWorldState.created).toBe(lastState.secretWorld.created);
            expect(secretWorldState.lastmod).toBe(lastState.secretWorld.lastmod);
            expect(secretWorldState.checksum).toBe(lastState.secretWorld.checksum);
        })

            // Assertions sur le JSON
            .then(res => JSON.stringify(syncState))
            .then(json => {
                const loadedSyncState = SyncState.load(json);
                expect(loadedSyncState).toEqual(syncState);
            })
            .then(res => done());
    });

  function testSync(direction) {
    return async() => {
      const discV1 = new Disc();
      const discId = 'discId';
      discV1.id = discId;
      const premierTitre = 'Premier titre';
      discV1.title = premierTitre;

      const local = new MemoryPersistence(null);
      const distant = new MemoryPersistence(null);
      const persistence = new LocalAndDistantPersistence<MemoryPersistence, MemoryPersistence>(local, distant);

      // Sauvegarde de la V1 du disque
      const savedDisc = await persistence.saveDisc(discId, discV1);
      expect(savedDisc.title).toEqual(premierTitre);

      // Modif uniquement locale
      const discV2 = new Disc();
      discV2.id = discId;
      const deuxiemeTitre = 'Deuxième titre';
      discV2.title = deuxiemeTitre;
      const localSavedDisc = await local.saveDisc(discId, discV2);
      expect(localSavedDisc.title).toEqual(deuxiemeTitre);
      const distantDisc = await distant.getDisc(discId);
      expect(distantDisc.title).toEqual(premierTitre);

      // On imagine qu'on redémarre CueTube => synchro
      direction ? await distant.sync(local) : await local.sync(distant);
      const syncedDisc = await persistence.getDisc(discId);
      expect(syncedDisc.title).toEqual(deuxiemeTitre, 'La modif la plus récente est retenue');
    };
  }

  it('should keep newer version of a disc when sync two persistences', testSync(true));

  it('should keep newer version of a disc when sync two persistences (reverse sync)', testSync(false));

});

function toObject(typedObject: any): Object {
    return JSON.parse(JSON.stringify(typedObject))
}
