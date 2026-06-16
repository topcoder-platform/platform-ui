import {
    getTruncatedBio,
    PROFILE_BIO_TRUNCATION_LENGTH,
} from './AboutMe.utils'

describe('getTruncatedBio', () => {
    it('returns short bios without truncation', () => {
        expect(getTruncatedBio('Topcoder member'))
            .toEqual({
                isTruncated: false,
                text: 'Topcoder member',
            })
    })

    it('matches the Figma bio preview length before adding the suffix', () => {
        const bio = [
            'I am a highly skilled JavaScript Developer with a passion for building dynamic and interactive web',
            'applications. With several years of experience in the field, I possess a deep understanding of',
            'JavaScript\'s intricacies.',
        ].join(' ')
        const expectedBio = [
            'I am a highly skilled JavaScript Developer with a passion for building dynamic and interactive web',
            'applications. With several years of experience in the field, I possess a deep understanding of',
            'JavaScript\'s...',
        ].join(' ')

        expect(getTruncatedBio(bio))
            .toEqual({
                isTruncated: true,
                text: expectedBio,
            })
    })

    it('backs up to the closest previous word when the limit lands mid-word', () => {
        expect(getTruncatedBio('The quick brown fox jumps', 18))
            .toEqual({
                isTruncated: true,
                text: 'The quick brown...',
            })
    })

    it('uses the configured profile bio preview length by default', () => {
        const bio = `${'a'.repeat(PROFILE_BIO_TRUNCATION_LENGTH)} more text`

        expect(getTruncatedBio(bio))
            .toEqual({
                isTruncated: true,
                text: `${'a'.repeat(PROFILE_BIO_TRUNCATION_LENGTH)}...`,
            })
    })
})
