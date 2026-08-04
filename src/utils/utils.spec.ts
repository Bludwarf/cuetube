import {formatHMSS, setParameterByName} from './utils';

describe('utils', function () {

    it('should replace url param', function () {
        let src = 'http://localhost:3000/player?collection=from';
        expect(setParameterByName('collection', 'to', src)).toEqual('http://localhost:3000/player?collection=to');
        expect(src).toEqual('http://localhost:3000/player?collection=from');

        src = 'http://localhost:3000/player?collection=from&collection2=from2';
        expect(setParameterByName('collection', 'to', src)).toEqual('http://localhost:3000/player?collection=to&collection2=from2');

        src = 'http://localhost:3000/player?collection1=from&collection2=from2';
        expect(setParameterByName('collection', 'to', src))
            .toEqual('http://localhost:3000/player?collection1=from&collection2=from2&collection=to');

        src = 'http://localhost:3000/player';
        expect(setParameterByName('collection', 'to', src)).toEqual('http://localhost:3000/player?collection=to');

        const oldSearch = window.location.search;
        expect(window.location.search).toEqual(oldSearch);
    });

    describe('formatHMSS', function () {

        ([
            [0, '0:00'],
            [0.1, '0:00'],
            [0.5, '0:00'],
            [0.9, '0:00'],
            [1, '0:01'],
            [10, '0:10'],
            [60, '1:00'],
            [600, '10:00'],
            [3600, '1:00:00'],
            [3660, '1:01:00'],
            [3661, '1:01:01'],
            [3600 * 24, '24:00:00'],
        ] as [number, string][]).forEach(([time, expected]) => {
            it(`${time} -> ${expected}`, () => {
                expect(formatHMSS(time)).toEqual(expected);
            });
        });

    });

});
