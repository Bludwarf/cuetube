import {TestUtils} from '../TestUtils';
import Collection from '../Collection';
import {Disc} from '../disc';
import {MemoryPersistence} from './MemoryPersistence';
import {LocalAndDistantPersistence} from './LocalAndDistantPersistence';

describe('LocalAndDistantPersistence', () => {

    it('should save collections', (done) => {
        const p = TestUtils.createLocalAndDistantPersistence();

        const collection = new Collection('Les plus grands hits');

        const disc1 = new Disc();
        disc1.title = 'Johnny Cash et sa bande';

        collection.pushDiscs(disc1);
        p.saveCollection(collection)
            .then((savedCollection) => {
                expect(savedCollection).toEqual(collection);

                // La collection se retrouve dans les deux persistences
                return Promise.all([p, p.local, p.distant].map(pe => pe.getCollection(collection.name)))
                    .then(([collectionLD, collectionL, collectionD]) => {
                        expect(collectionLD).toEqual(collection);
                        expect(collectionL).toEqual(collection);
                        expect(collectionD).toEqual(collection);
                    });
            })
            .then(() => {

                // On supprime maintenant la collection
                return p.deleteCollection(collection.name).then(() => {

                    return Promise.all([p, p.local, p.distant].map(pe => pe.getCollection(collection.name)))
                        .then(([collectionLD, collectionL, collectionD]) => {
                            // En appelant getCollection sur une collection non existante, une nouvelle collection est renvoyée
                            expect(collectionLD).not.toEqual(collection);
                            expect(collectionL).not.toEqual(collection);
                            expect(collectionD).not.toEqual(collection);
                        });

                });

            })
            .then(done)
            .catch(done.fail);
    });

    it('should get missing disc from distant', async () => {
        const local = new MemoryPersistence();
        const distant = new MemoryPersistence();

        const distantDisc = new Disc();
        distantDisc.id = 'DISTANT_DISC_ID';
        distant.discs[distantDisc.id] = distantDisc;

        const persistence = new LocalAndDistantPersistence(local, distant);
        const disc = await persistence.getDisc(distantDisc.id);

        await expect(disc).toBe(distantDisc);

        const localSyncState = await local.getSyncState();
        await expect(localSyncState.containsDisc(distantDisc.id)).toBeTruthy('Le disque est contenu dans l\'état de la synchro local');
    });

});

describe('LocalAndDistantPersistence with broken distant', () => {

    it('should not save collections', (done) => {
        const BrokenPersistence: new() => MemoryPersistence = class extends MemoryPersistence {
            async postCollection(collection2: Collection): Promise<Collection> {
                throw new Error('postCollection is broken');
            }
        };
        const distant = new BrokenPersistence();
        const p = TestUtils.createLocalAndDistantPersistence(undefined, distant);

        const collection = new Collection('Les plus grands hits');

        const disc1 = new Disc();
        disc1.title = 'Johnny Cash et sa bande';

        collection.pushDiscs(disc1);
        p.saveCollection(collection)
            .then(() => done.fail())
            .catch(() => done());
    });

    it('should save collections but not delete them', (done) => {
        const BrokenPersistence: new() => MemoryPersistence = class extends MemoryPersistence {
            protected async _deleteCollection2(collectionName: string): Promise<void> {
                throw new Error('_deleteCollection is broken');
            }

            protected _deleteCollection(collectionName: string): Promise<void> {
                return Promise.reject('_deleteCollection is broken');
            }
        };
        const distant = new BrokenPersistence();
        const p = TestUtils.createLocalAndDistantPersistence(undefined, distant);

        const collection = new Collection('Les plus grands hits');

        const disc1 = new Disc();
        disc1.title = 'Johnny Cash et sa bande';

        collection.pushDiscs(disc1);
        p.saveCollection(collection)
            .then((savedCollection) => {
                expect(savedCollection).toEqual(collection);

                // La collection se retrouve dans les deux persistences
                return Promise.all([p, p.local, p.distant].map(pe => pe.getCollection(collection.name)))
                    .then(([collectionLD, collectionL, collectionD]) => {
                        expect(collectionLD).toEqual(collection);
                        expect(collectionL).toEqual(collection);
                        expect(collectionD).toEqual(collection);
                    });
            })
            .then(() => {

                // On supprime maintenant la collection
                return p.deleteCollection(collection.name)
                    .then(() => done.fail())
                    .catch(() => done());
            });
    });

});

