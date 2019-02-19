import {MemoryPersistence} from './persistence/MemoryPersistence';
import {LocalAndDistantPersistence} from './persistence/LocalAndDistantPersistence';
import {TestUtils} from './TestUtils';
import Collection from './Collection';
import {Disc} from './disc';

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

});

describe('LocalAndDistantPersistence with broken distant', () => {

  it('should not save collections', (done) => {
    const BrokenPersistence: { new(): MemoryPersistence } = class extends MemoryPersistence {
      // anonymous class auto inherit its superclass constructor if you don't declare a constructor here.
      constructor() {
        super(null);
      }

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
      .catch(done);
  });

  it('should save collections but not delete them', (done) => {
    const BrokenPersistence: { new(): MemoryPersistence } = class extends MemoryPersistence {
      // anonymous class auto inherit its superclass constructor if you don't declare a constructor here.
      constructor() {
        super(null);
      }

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
          .catch(done);
      });
  });

});
