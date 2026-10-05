import {
    getMemberAvatarInitial,
    getMemberAvatarPalette,
    MEMBER_AVATAR_PALETTES,
} from './member-avatar.utils'

describe('member avatar utilities', () => {
    it('uses the uppercase first character of the trimmed handle', () => {
        expect(getMemberAvatarInitial('vasea'))
            .toBe('V')
        expect(getMemberAvatarInitial('  tourist '))
            .toBe('T')
        expect(getMemberAvatarInitial('_underscore'))
            .toBe('_')
        expect(getMemberAvatarInitial('   '))
            .toBe('')
        expect(getMemberAvatarInitial(undefined))
            .toBe('')
    })

    it('keeps a stable, case-insensitive palette for each handle', () => {
        const palette = getMemberAvatarPalette('Vasea')

        expect(MEMBER_AVATAR_PALETTES)
            .toContain(palette)
        expect(getMemberAvatarPalette('vasea'))
            .toBe(palette)
        expect(getMemberAvatarPalette(' VASEA '))
            .toBe(palette)
    })

    it('uses the neutral palette when no handle is available', () => {
        expect(getMemberAvatarPalette(undefined))
            .toBe('gray')
        expect(getMemberAvatarPalette(''))
            .toBe('gray')
    })

    it('spreads handles across every authored palette', () => {
        const used = new Set(Array.from({ length: 200 }, (_, index) => getMemberAvatarPalette(`member${index}`)))

        expect([...used].sort())
            .toEqual([...MEMBER_AVATAR_PALETTES].sort())
    })
})
