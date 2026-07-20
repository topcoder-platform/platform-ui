/* eslint-disable import/no-extraneous-dependencies, unicorn/no-null */
import {
    formatBytes,
    formatLatency,
    formatRatio,
    sortBySeverity,
} from './status.utils'

describe('Status display utilities', () => {
    it('keeps critical and warning rows above healthy changes and stable rows', () => {
        const rows = [
            { id: 'healthy', severity: 'healthy' as const },
            { id: 'change', severity: 'healthy-change' as const },
            { id: 'critical', severity: 'critical' as const },
            { id: 'warning', severity: 'warning' as const },
        ]

        expect(sortBySeverity(rows, row => row.severity)
            .map(row => row.id))
            .toEqual(['critical', 'warning', 'change', 'healthy'])
    })

    it('preserves unavailable ratios, latency, and storage as unknown', () => {
        expect(formatRatio(null))
            .toBe('—')
        expect(formatLatency(undefined))
            .toBe('—')
        expect(formatBytes(null))
            .toBe('—')
        expect(formatRatio(0))
            .toBe('0.0%')
    })
})
