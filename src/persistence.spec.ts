import * as Queue from 'promise-queue';
import {MemoryPersistence} from './persistence/MemoryPersistence';
import Collection from './Collection';
import {Disc} from './disc';
import {TestUtils} from './TestUtils';
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
        const localDiffDisc = TestUtils.createDisc('diffDisc');
        const distantDiffDisc = TestUtils.createDisc('diffDisc');

        // Collections
        const localCollection = new Collection("localCollection");
        localCollection.push(localDisc, localEqualDisc, localDiffDisc);
        const distantCollection = new Collection("distantCollection");
        distantCollection.push(distantDisc, distantEqualDisc, distantDiffDisc);
        const commonCollection = new Collection("commonCollection");
        commonCollection.push(localDisc, distantDisc, localEqualDisc, localDiffDisc);

        // Local
        const local = new MemoryPersistence(null, null);

        // Distant
        const distant = new MemoryPersistence(null, null);

        Promise.all([
            // Collections
            local.postCollection(localCollection),
            distant.postCollection(distantCollection),
            local.postCollection(commonCollection),
            local.postCollection(commonCollection),
            // Disques
            local.postDisc(localDisc.id, localDisc),
            local.postDisc(localEqualDisc.id, localEqualDisc),
            local.postDisc(localDiffDisc.id, localDiffDisc),
            distant.postDisc(distantDisc.id, distantDisc),
            distant.postDisc(distantEqualDisc.id, distantEqualDisc),
            distant.postDisc(distantDiffDisc.id, distantDiffDisc),
        ]).then(res => local.sync(distant))
        .then(res => Promise.all([
            local.getCollectionNames(),
            local.getCollectionByNames([localCollection.name, commonCollection.name]),
            distant.getCollectionNames(),
            distant.getCollectionByNames([localCollection.name, commonCollection.name])
        ])).then(res => {

            // Assertion sur les collections
            const [localCollectionNames, localCollections, distantCollectionNames, distantCollections] = res;
            console.log('localCollections', localCollections);
            console.log('distantCollections', distantCollections);

        }).then(res => done())
    });

});
