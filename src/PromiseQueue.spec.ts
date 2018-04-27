import * as Queue from 'promise-queue';
//const Queue = require('promise-queue');

describe('promise-queue', () => {

    it('should not retry success', (done) => {

        const times = [];

        const queue = new Queue(1, Infinity, {
            interval: 110
        }); // only one concurrent

        Promise.all([
            queue.add(() => {
                times.push(new Date().getTime()); // 1ère action
            }),
            queue.add(() => {
                times.push(new Date().getTime()); // 1ère action
            })
        ]).then(() => {
            console.log(times);
            done();
        });
    });

});
