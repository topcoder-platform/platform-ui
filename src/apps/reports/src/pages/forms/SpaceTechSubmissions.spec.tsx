/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import SpaceTechSubmissions, { selectSpaceTechLeads, spaceTechColumns } from './SpaceTechSubmissions'

jest.mock('../../lib/services/forms.service', () => ({
    formatFormValue: (value: unknown) => (value === undefined ? '—' : String(value)),
}))

const rows = Array.from({ length: 30 }, (_, index) => ({
    company: index === 0 ? 'Acme' : 'Space',
    full_name: `Lead ${index}`,
    submission_id: String(index),
    submitted_at: `2026-11-${String(index + 1)
        .padStart(2, '0')}T00:00:00Z`,
    utm_source: index === 0 ? 'linkedin' : 'email',
}))

describe('SpaceTech lead table', () => {
    it('filters every requested header and sorts the complete set without mutating it', () => {
        spaceTechColumns.forEach(([column]) => {
            const source = [{ [column]: 'Beta' }, { [column]: 'Alpha' }]
            expect(selectSpaceTechLeads(source, { [column]: 'ALP' }, column, false))
                .toEqual([{ [column]: 'Alpha' }])
            expect(selectSpaceTechLeads(source, {}, column, false))
                .toEqual([{ [column]: 'Alpha' }, { [column]: 'Beta' }])
            expect(source[0][column])
                .toBe('Beta')
        })
        expect(selectSpaceTechLeads(rows, { company: 'acme', utm_source: 'email' }, 'submitted_at', true))
            .toHaveLength(0)
    })

    it('finds a lead outside the visible first page and updates accessible sort state', () => {
        render(<SpaceTechSubmissions report={{
            columns: [], data: rows, form: 'space_tech_challenge', labels: {}, nextCursor: null, total: 30,
        }}
        />)
        expect(screen.queryByText('Lead 0')).not.toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Filter Company'), { target: { value: 'acme' } })
        expect(screen.getByText('Lead 0'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Next' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('button', { name: 'Name' }))
        expect(screen.getByRole('columnheader', { name: 'Name' }))
            .toHaveAttribute('aria-sort', 'ascending')
        fireEvent.click(screen.getByRole('button', { name: 'Clear column filters' }))
        expect(screen.getByText('30 matching leads of 30'))
            .toBeInTheDocument()
    })
})
