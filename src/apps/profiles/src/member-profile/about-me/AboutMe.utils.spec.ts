import { isBioOverflowing } from './AboutMe.utils'

describe('isBioOverflowing', () => {
    it('returns false when all rendered bio lines are visible', () => {
        expect(isBioOverflowing({
            clientHeight: 120,
            scrollHeight: 120,
        }))
            .toBe(false)
    })

    it('returns true when the line clamp hides rendered bio content', () => {
        expect(isBioOverflowing({
            clientHeight: 120,
            scrollHeight: 144,
        }))
            .toBe(true)
    })
})
