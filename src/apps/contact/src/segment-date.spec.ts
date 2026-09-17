import { fromSegmentDateInput, toSegmentDateInput } from './segment-date'

describe('Contact inclusive date filters', () => {
    it.each(['2026-09-30', '2028-02-29', '2026-03-08'])('round-trips the upper calendar date %s', date => {
        const upper = fromSegmentDateInput(date, true)
        expect(toSegmentDateInput(upper, true))
            .toBe(date)
        expect(Date.parse(upper || '') - Date.parse(`${date}T00:00:00.000Z`))
            .toBe(86_400_000)
    })

    it('includes the selected upper date through its final millisecond', () => {
        expect(fromSegmentDateInput('2026-09-09', true))
            .toBe('2026-09-10T00:00:00.000Z')
        expect(fromSegmentDateInput('2026-09-09', false))
            .toBe('2026-09-09T00:00:00.000Z')
        expect(toSegmentDateInput(undefined, true))
            .toBe('')
        expect(fromSegmentDateInput('', true))
            .toBeUndefined()
    })
})
