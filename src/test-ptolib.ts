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
