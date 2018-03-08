import * as ptolib from './ptolib';
import { expect } from 'chai';
import 'mocha';

describe('makeSequentialDataArray', () => {

    it('should give me a range of dates', () => {
        let result = ptolib.makeSequentialDateArray(new Date('2018-01-01'), new Date('2018-01-03'));
        let want = [
            new Date('2018-01-01'),
            new Date('2018-01-02'),
            new Date('2018-01-03')
        ];
        // fuck me: https://medium.com/@victorleungtw/testing-with-mocha-array-comparison-e9a45b57df27
        expect(result).to.eql(want);

        // TODO: check non-sensical input, startDate > endDate, startDate == endDate
    });
});

describe('normalizeDeltas', () => {

    class TestCase {
        public description: string;
        public args: number[];
        public wanted: number;
        public constructor(description: string, args: number[], wanted: number) {
            this.description = description;
            this.args = args;
            this.wanted = wanted;
        }
    }

    // NOTE: what happens if I gain PDO and lose more than 8 hours a day?
    // I guess I need to take care of the negative separately?
    let testCases = [
        new TestCase('deltas > 0 are always applied', [10, 0, 0], 10),
        new TestCase('deltas = 0 cancel deltas < 0', [0, -8, 0], 0),
        new TestCase('deltas NaN', [NaN, NaN, NaN], 0),
        new TestCase('blah', [NaN, -8, 12.5], 4.5),
        new TestCase('blah', [0, NaN, -5], 0),
        new TestCase('delta always <= -8', [-9, NaN, -6], -8),
        // even when a delta > 0
        new TestCase('don\'t take more than 8 hours off', [12, -8, -8], 4),
    ];

    for (let testCase of testCases) {
        it(testCase.description, () => {
            // @ts-ignore (I know I'm only passing 3 args)
            let result = ptolib.normalizeDeltas(...testCase.args);
            expect(result).equals(testCase.wanted);
        });
    }
});