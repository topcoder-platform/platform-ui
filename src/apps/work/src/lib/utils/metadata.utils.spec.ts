import { GiteaTeam } from '../models'

import {
    giteaTeamsToMetadata,
    metadataToGiteaTeams,
    normalizeGiteaTeams,
} from './metadata.utils'

describe('normalizeGiteaTeams', () => {
    it('trims, de-duplicates by id and preserves order', () => {
        expect(normalizeGiteaTeams([
            { id: 34, name: ' reviewers ', organization: ' topcoder ' },
            { id: '12', name: 'devs', organization: 'partner' },
            { id: 34, name: 'reviewers', organization: 'topcoder' },
        ]))
            .toEqual([
                { id: 34, name: 'reviewers', organization: 'topcoder' },
                { id: 12, name: 'devs', organization: 'partner' },
            ])
    })

    it('drops entries without a usable id or name', () => {
        expect(normalizeGiteaTeams([
            'legacy-team-name',
            42,
            { name: 'no-id', organization: 'topcoder' },
            { id: 0, name: 'zero' },
            { id: -3, name: 'negative' },
            { id: 7.5, name: 'fractional' },
            { id: 9, name: '   ' },
            { id: 11, name: 'kept' },
        ]))
            .toEqual([{ id: 11, name: 'kept', organization: '' }])
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
    it('reads unique teams from the JSON metadata entry', () => {
        const result = metadataToGiteaTeams([{
            name: 'gitea',
            value: '{"teams":[{"id":12,"name":"devs","organization":"topcoder"},'
                + '{"id":34,"name":"reviewers","organization":"partner"},'
                + '{"id":12,"name":"devs","organization":"topcoder"}]}',
        }], 'gitea')

        expect(result)
            .toEqual([
                { id: 12, name: 'devs', organization: 'topcoder' },
                { id: 34, name: 'reviewers', organization: 'partner' },
            ])
    })

    it.each([
        ['a missing metadata entry', undefined],
        ['an empty value', [{ name: 'gitea', value: '' }]],
        ['a malformed JSON value', [{ name: 'gitea', value: '{teams:' }]],
        ['a value without a teams array', [{ name: 'gitea', value: '{"teams":"12"}' }]],
        ['teams stored as bare names', [{ name: 'gitea', value: '{"teams":["my-team"]}' }]],
    ])('returns an empty list for %s', (_label, metadata) => {
        expect(metadataToGiteaTeams(metadata, 'gitea'))
            .toEqual([])
    })
})

describe('giteaTeamsToMetadata', () => {
    it('serializes unique teams, with their ids, into the metadata entry', () => {
        const result = giteaTeamsToMetadata(
            [{ name: 'existing_metadata', value: 'preserved' }],
            'gitea',
            [
                { id: 12, name: 'devs', organization: 'topcoder' },
                { id: 34, name: 'reviewers', organization: 'partner' },
                { id: 12, name: 'devs', organization: 'topcoder' },
            ],
        )

        expect(result)
            .toEqual([
                {
                    name: 'existing_metadata',
                    value: 'preserved',
                },
                {
                    name: 'gitea',
                    value: '{"teams":[{"id":12,"name":"devs","organization":"topcoder"},'
                        + '{"id":34,"name":"reviewers","organization":"partner"}]}',
                },
            ])
    })

    it('replaces an existing entry instead of appending a duplicate', () => {
        const result = giteaTeamsToMetadata(
            [{ name: 'gitea', value: '{"teams":[{"id":99,"name":"old"}]}' }],
            'gitea',
            [{ id: 12, name: 'devs', organization: 'topcoder' }],
        )

        expect(result)
            .toEqual([{
                name: 'gitea',
                value: '{"teams":[{"id":12,"name":"devs","organization":"topcoder"}]}',
            }])
    })

    it.each([
        ['an empty selection', []],
        ['an undefined selection', undefined],
        ['a selection without usable ids', [{ name: 'no-id' } as unknown as GiteaTeam]],
    ])('removes the metadata entry for %s', (_label, teams) => {
        const result = giteaTeamsToMetadata(
            [
                { name: 'existing_metadata', value: 'preserved' },
                { name: 'gitea', value: '{"teams":[{"id":99,"name":"old"}]}' },
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
