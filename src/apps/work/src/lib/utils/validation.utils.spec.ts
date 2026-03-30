import { convertDollarToInteger } from './validation.utils'

describe('convertDollarToInteger', () => {
    it('parses comma-separated values and drops decimal portions', () => {
        expect(convertDollarToInteger('$1,234.56', '$'))
            .toBe(1234)
        expect(convertDollarToInteger('1,234'))
            .toBe(1234)
    })
})
