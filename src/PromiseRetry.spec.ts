import * as promiseRetry from 'promise-retry';
// const promiseRetry = require('promise-retry');

describe('promise-retry', () => {

    it('should not retry success', (done) => {
        const p = Promise.resolve('OK1');

        promiseRetry((retry, number) => {
            console.log('test1 attempt number', number);
            return p.catch(retry);
        }).then(done).catch(err => {
            fail(err);
        });
    });

    it('should retry one time after error', (done) => {
        const options = {
            minTimeout: 10,
            maxTimeout: 100
        };
        promiseRetry((retry, number) => {
            console.log('test2 attempt number', number);
            return new Promise((resolve, reject) => {
                if (number === 1) throw new Error('first attempt fails');
                else resolve('second attempt success');
            }).catch(retry);
        }, options).then(res => {
            expect(res).toBe('second attempt success');
            done();
        }).catch(err => {
            fail(err);
        });
    });

    it('should retry one time after reject', (done) => {
        const options = {
            minTimeout: 10,
            maxTimeout: 100
        };
        promiseRetry((retry, number) => {
            console.log('test3 attempt number', number);
            return new Promise((resolve, reject) => {
                if (number === 1) reject('first attempt fails');
                else resolve('second attempt success');
            }).catch(retry);
        }, options).then(res => {
            expect(res).toBe('second attempt success');
            done();
        }).catch(err => {
            fail(err);
        });
    });

    it('should not retry a second time', (done) => {
        const options = {
            retries: 1,
            minTimeout: 10,
            maxTimeout: 100
        };
        promiseRetry((retry, number) => {
            console.log('test4 attempt number', number);
            return new Promise((resolve, reject) => {
                if (number <= 2) throw new Error('attempt ' + number + ' fails');
                else resolve('third attempt success');
            }).catch(retry);
        }, options).then(res => {
            fail('Should never success');
        }).catch(err => {
            expect(err.toString()).toBe('Error: attempt 2 fails');
            done();
        });
    });
});
