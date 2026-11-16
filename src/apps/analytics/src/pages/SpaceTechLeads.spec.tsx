/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { fetchSpaceTechSubmissions } from '../../../reports/src/lib/services/forms.service'

import SpaceTechLeads from './SpaceTechLeads'

jest.mock('../../../reports/src/lib/services/forms.service', () => ({
    fetchSpaceTechSubmissions: jest.fn(),
    formatFormValue: (value: unknown) => (value === undefined ? '—' : String(value)),
}))

const filters = { from: '2026-11-01', to: '2026-11-17' }
const report = { columns: [],
    data: [
        { full_name: 'First lead', submission_id: '1', utm_source: 'linkedin' },
        { full_name: 'Second lead', submission_id: '2', utm_source: 'email' },
    ],
    form: 'space_tech_challenge',
    labels: {},
    nextCursor: null,
    total: 2 }

describe('SpaceTech private leads', () => {
    beforeEach(() => { jest.clearAllMocks(); (fetchSpaceTechSubmissions as jest.Mock).mockResolvedValue(report) })

    it('applies report dates and UTM filters while retaining column filtering and submitted status', async () => {
        render(<SpaceTechLeads filters={{ ...filters, source: 'linkedin' }} />)
        await screen.findByText('First lead')
        expect(screen.queryByText('Second lead')).not.toBeInTheDocument()
        expect(fetchSpaceTechSubmissions)
            .toHaveBeenCalledWith({ endDate: filters.to, startDate: filters.from }, expect.any(Function))
        expect(screen.getByText('Submitted'))
            .toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Filter form_status'), { target: { value: 'incomplete' } })
        expect(screen.getByText('No leads match these filters.'))
            .toBeInTheDocument()
    })

    it('keeps a permission failure separate from analytics and supports retry', async () => {
        (fetchSpaceTechSubmissions as jest.Mock).mockRejectedValueOnce(new Error('403'))
        render(<SpaceTechLeads filters={filters} />)
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Forms reporting access is required')
        fireEvent.click(screen.getByRole('button', { name: 'Retry leads' }))
        await screen.findByText('First lead')
        expect(fetchSpaceTechSubmissions)
            .toHaveBeenCalledTimes(2)
    })

    it('ignores stale results after the date range changes', async () => {
        let resolveOld: (value: typeof report) => void = () => undefined;
        (fetchSpaceTechSubmissions as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
            resolveOld = resolve
        }))
        const view = render(<SpaceTechLeads filters={filters} />)
        view.rerender(<SpaceTechLeads filters={{ ...filters, from: '2026-11-02' }} />)
        await screen.findByText('First lead')
        expect((fetchSpaceTechSubmissions as jest.Mock).mock.calls[0][1]())
            .toBe(false)
        resolveOld({ ...report, data: [] })
        await waitFor(() => expect(screen.getByText('First lead'))
            .toBeInTheDocument())
    })
})
