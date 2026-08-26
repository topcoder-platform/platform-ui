import {
    giteaTeamsToMetadata,
    metadataToGiteaTeams,
    normalizeGiteaTeams,
} from './metadata.utils'

describe('normalizeGiteaTeams', () => {
    it('trims, de-duplicates and drops empty entries while preserving order', () => {
        expect(normalizeGiteaTeams([' 34 ', '12', '', '34', 12, '  ']))
            .toEqual(['34', '12'])
    })

    it.each([
        ['undefined', undefined],
        ['a non-array value', 'not-an-array'],
    ])('returns an empty list for %s', (_label, value) => {
        expect(normalizeGiteaTeams(value))
            .toEqual([])
    })
})

describe('metadataToGiteaTeams', () => {
    it('reads unique team ids from the JSON metadata entry', () => {
        const result = metadataToGiteaTeams([{
            name: 'gitea',
            value: '{"teams":["12","34","12"]}',
        }], 'gitea')

        expect(result)
            .toEqual(['12', '34'])
    })

    it.each([
        ['a missing metadata entry', undefined],
        ['an empty value', [{ name: 'gitea', value: '' }]],
        ['a malformed JSON value', [{ name: 'gitea', value: '{teams:' }]],
        ['a value without a teams array', [{ name: 'gitea', value: '{"teams":"12"}' }]],
    ])('returns an empty list for %s', (_label, metadata) => {
        expect(metadataToGiteaTeams(metadata, 'gitea'))
            .toEqual([])
    })
})

describe('giteaTeamsToMetadata', () => {
    it('serializes unique team ids into the metadata entry', () => {
        const result = giteaTeamsToMetadata(
            [{ name: 'existing_metadata', value: 'preserved' }],
            'gitea',
            [' 12 ', '34', '12'],
        )

        expect(result)
            .toEqual([
                {
                    name: 'existing_metadata',
                    value: 'preserved',
                },
                {
                    name: 'gitea',
                    value: '{"teams":["12","34"]}',
                },
            ])
    })

    it('replaces an existing entry instead of appending a duplicate', () => {
        const result = giteaTeamsToMetadata(
            [{ name: 'gitea', value: '{"teams":["99"]}' }],
            'gitea',
            ['12'],
        )

        expect(result)
            .toEqual([{
                name: 'gitea',
                value: '{"teams":["12"]}',
            }])
    })

    it.each([
        ['an empty selection', []],
        ['an undefined selection', undefined],
        ['a selection of blanks', ['', '   ']],
    ])('removes the metadata entry for %s', (_label, teams) => {
        const result = giteaTeamsToMetadata(
            [
                { name: 'existing_metadata', value: 'preserved' },
                { name: 'gitea', value: '{"teams":["99"]}' },
            ],
            'gitea',
            teams,
        )

        expect(result)
            .toEqual([{
                name: 'existing_metadata',
                value: 'preserved',
            }])
    })
})
