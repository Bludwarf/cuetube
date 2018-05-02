import * as Queue from 'promise-queue';
import {MemoryPersistence} from './persistence/MemoryPersistence';
import Collection from './Collection';
import {Disc} from './disc';
import {TestUtils} from './TestUtils';
import {SyncResult} from './persistence';
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
        const local = new MemoryPersistence(null, null);

        // Distant
        const distant = new MemoryPersistence(null, null);

        Promise.all([
            // Collections
            local.postCollections([localCollection, localCommonCollection, localNotModCommonCollection]),
            distant.postCollections([distantCollection, distantCommonCollection, distantNotModCommonCollection]),
            // Disques
            local.postDisc(localDisc.id, localDisc),
            local.postDisc(localEqualDisc.id, localEqualDisc),
            local.postDisc(localDiffDisc.id, localDiffDisc),
            distant.postDisc(distantDisc.id, distantDisc),
            distant.postDisc(distantEqualDisc.id, distantEqualDisc),
            distant.postDisc(distantDiffDisc.id, distantDiffDisc),
        ]).then(res => local.sync(distant))
        .then(syncResult => {

            // Assertions sur le rapport de synchro

            const expected: SyncResult = {
                collections: {
                    all: [
                        distantCollection,
                        localCollection,
                        localCommonCollection,
                        distantCommonCollection,
                        localNotModCommonCollection,
                        distantNotModCommonCollection
                    ],
                    pulled: [
                        distantCollection
                    ],
                    pushed: [
                        localCollection
                    ],
                    common: {
                        all: [
                            localCommonCollection,
                            distantCommonCollection,
                            localNotModCommonCollection,
                            distantNotModCommonCollection
                        ],
                        pulled: [
                            distantCommonCollection
                        ],
                        pushed: [
                            localCommonCollection
                        ],
                        notModified: [
                            localNotModCommonCollection,
                            distantNotModCommonCollection
                        ]
                    }
                },
                discIds: {
                    all: [
                        distantDisc.id,
                        localDisc.id,
                        localEqualDisc.id,
                        localDiffDisc.id
                    ],
                    pulled: [
                        distantDisc.id
                    ],
                    pushed: [
                        localDisc.id
                    ],
                    common: {
                        all: [
                            localEqualDisc.id,
                            localDiffDisc.id
                        ],
                        pulled: [
                        ],
                        pushed: [
                        ],
                        notModified: [
                            localEqualDisc.id,
                            localDiffDisc.id
                        ]
                    }
                },
                discs: {
                    all: [
                        distantDisc,
                        localDisc,
                        localEqualDisc,
                        distantEqualDisc,
                        localDiffDisc,
                        distantDiffDisc
                    ],
                    pulled: [
                        distantDisc,
                    ],
                    pushed: [
                        localDisc
                    ],
                    common: {
                        all: [
                            localEqualDisc,
                            distantEqualDisc,
                            localDiffDisc,
                            distantDiffDisc
                        ],
                        pulled: [
                            distantDiffDisc
                        ],
                        pushed: [
                        ],
                        notModified: [
                            localEqualDisc,
                            distantEqualDisc
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
            local.getDiscs([localDisc.id, distantDisc.id, localEqualDisc.id, localDiffDisc.id], 0),
            distant.getDiscs([localDisc.id, distantDisc.id, localEqualDisc.id, localDiffDisc.id], 0)
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

});

function toObject(typedObject: any): Object {
    return JSON.parse(JSON.stringify(typedObject))
}
