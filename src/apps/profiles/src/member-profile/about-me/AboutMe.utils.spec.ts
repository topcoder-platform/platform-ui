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

    it('matches the collapsed bio preview length before adding the suffix', () => {
        const bio = [
            'I am a highly skilled JavaScript Developer with a passion for building dynamic and interactive web',
            'applications. With several years of experience in the field, I possess a deep understanding of',
            'JavaScript\'s intricacies.',
        ].join(' ')
        const expectedBio = [
            'I am a highly skilled JavaScript Developer with a passion for building dynamic and interactive web',
            'applications. With several years of experience in the field, I possess a deep understanding of...',
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

    it('keeps long profile previews from ending with a sparse extra line', () => {
        const bio = [
            'As a community manager, I work closely with our members to support them and organize events,',
            'create content to engage them. The best part of the job is meeting new members in online or onsite',
            'meetings and helping them connect with the right opportunities.',
        ].join(' ')

        expect(getTruncatedBio(bio))
            .toEqual({
                isTruncated: true,
                text: [
                    'As a community manager, I work closely with our members to support them and organize events,',
                    'create content to engage them. The best part of the job is meeting new members in online or',
                    'onsite...',
                ].join(' '),
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
