/* eslint-disable import/no-extraneous-dependencies */
import {
    BULK_TRACK_OPTIONS,
    INDEXED_TRACK_OPTIONS,
} from './ingest-options'

jest.mock('~/libs/ui', () => ({}), { virtual: true })

describe('ingest-options', () => {
    describe('BULK_TRACK_OPTIONS', () => {
        // The v6 Challenges API resolves `tracks` against challengeTrack.abbreviation,
        // and an unmatched value silently widens the filter to every track rather
        // than erroring — so these are pinned rather than left to drift.
        it.each([
            ['Development', 'Dev'],
            ['Data Science', 'DS'],
            ['Design', 'Des'],
            ['Quality Assurance', 'QA'],
        ])('sends the %s abbreviation %s to the search API', (label, abbreviation) => {
            expect(BULK_TRACK_OPTIONS.find(option => option.label === label)?.value)
                .toBe(abbreviation)
        })

        it('keeps an unfiltered option that sends nothing', () => {
            expect(BULK_TRACK_OPTIONS[0])
                .toEqual({ label: 'Any track', value: '' })
        })
    })

    describe('INDEXED_TRACK_OPTIONS', () => {
        // These match stored chunk metadata, which holds the track's full name.
        it.each([
            'Development',
            'Data Science',
            'Design',
            'Quality Assurance',
        ])('filters stored metadata by the full name %s', name => {
            expect(INDEXED_TRACK_OPTIONS.find(option => option.label === name)?.value)
                .toBe(name)
        })
    })

    it('deliberately uses different values for the two surfaces', () => {
        // Guards against someone "aligning" the two lists: one talks to the
        // search API (abbreviations), the other to the vector index (names).
        const bulk = BULK_TRACK_OPTIONS.map(option => option.value)
        const indexed = INDEXED_TRACK_OPTIONS.map(option => option.value)

        expect(bulk).not.toEqual(indexed)
    })
})
