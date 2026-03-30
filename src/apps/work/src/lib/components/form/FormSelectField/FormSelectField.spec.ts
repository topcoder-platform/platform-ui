import { defaultToFieldValue } from './FormSelectField'

describe('FormSelectField defaultToFieldValue', () => {
    it('returns an empty array for multi-select clear actions', () => {
        expect(defaultToFieldValue(undefined, true))
            .toEqual([])
        expect(defaultToFieldValue({} as any, true))
            .toEqual([])
    })

    it('maps selected options to their values for multi-select', () => {
        expect(defaultToFieldValue([
            {
                label: 'Term A',
                value: 'term-a',
            },
            {
                label: 'Term B',
                value: 'term-b',
            },
        ], true))
            .toEqual([
                'term-a',
                'term-b',
            ])
    })
})
