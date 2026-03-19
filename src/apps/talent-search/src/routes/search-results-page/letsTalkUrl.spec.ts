import { getLetsTalkUrl } from './letsTalkUrl'

describe('getLetsTalkUrl', () => {
    it('returns the lets-talk url for dev domain', () => {
        expect(getLetsTalkUrl('https://www.topcoder-dev.com'))
            .toBe('https://www.topcoder-dev.com/lets-talk')
    })

    it('returns the lets-talk url for prod domain', () => {
        expect(getLetsTalkUrl('https://www.topcoder.com'))
            .toBe('https://www.topcoder.com/lets-talk')
    })
})
