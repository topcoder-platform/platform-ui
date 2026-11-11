/* eslint-disable import/no-extraneous-dependencies */
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { fetchStatistics, formatValue } from './statistics.service'
import ReportTable from './ReportTable'
import StatisticsPage from './StatisticsPage'

jest.mock('~/config', () => ({
    AppSubdomain: { statistics: 'statistics' },
    EnvironmentConfig: {
        REPORTS_API: 'https://api.example.com/v6/reports',
        SUBDOMAIN: 'www',
        USER_PROFILE_URL: 'https://profiles.example.com',
    },
}), { virtual: true })

const report = {
    columns: [{ field: 'handle', label: 'Member', member: true }, { field: 'count', label: 'Wins' }],
    path: 'qa/wins',
    title: 'First-place wins',
}

function wrapper(props: { children: React.ReactNode }): JSX.Element {
    return <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>{props.children}</SWRConfig>
}

beforeEach(() => { global.fetch = jest.fn() })

it('loads public data, preserves zero, sorts numeric strings, filters and links handles safely', async () => {
    (fetch as jest.Mock).mockResolvedValue({
        json: async () => [
            { count: '2', handle: '2', rank: 2 },
            { count: '10', handle: 'a/b', rank: 1 },
            { count: 0, handle: 'zero', rank: 3 },
        ],
        ok: true,
    })
    render(<ReportTable report={report} />, { wrapper })
    expect(screen.getByRole('status').textContent)
        .toContain('Loading')
    await screen.findByRole('link', { name: 'a/b' })
    expect(fetch)
        .toHaveBeenCalledWith('https://api.example.com/v6/reports/statistics/qa/wins')
    expect(screen.getByRole('link', { name: 'a/b' })
        .getAttribute('href'))
        .toBe('https://profiles.example.com/a%2Fb')
    expect(screen.getByRole('link', { name: '2' }).textContent)
        .toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Wins' }))
    expect(within(screen.getAllByRole('row')[1])
        .getByRole('link').textContent)
        .toBe('a/b')
    fireEvent.click(screen.getByRole('button', { name: 'Wins' }))
    expect(within(screen.getAllByRole('row')[1])
        .getByRole('link').textContent)
        .toBe('zero')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zero' } })
    expect(screen.getAllByRole('row'))
        .toHaveLength(2)
    expect(screen.getByText('0'))
        .toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } })
    expect(screen.getByRole('status').textContent)
        .toBe('No matching results.')
})

it('recovers from an API failure and distinguishes an empty report', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ json: async () => [], ok: true })
    render(<ReportTable report={report} />, { wrapper })
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText('No statistics available yet.')
    expect(screen.queryByRole('alert'))
        .toBeNull()
})

it('renders more than the initial page without losing report rows', async () => {
    (fetch as jest.Mock).mockResolvedValue({
        json: async () => Array.from({ length: 30 }, (_, index) => ({ count: index, handle: `member${index}` })),
        ok: true,
    })
    render(<ReportTable report={report} />, { wrapper })
    await screen.findByText('25 of 30 results')
    expect(screen.getAllByRole('link'))
        .toHaveLength(25)
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))
    expect(screen.getAllByRole('link'))
        .toHaveLength(30)
})

it('opens a bookmarked category and only fetches its reports plus the summary', async () => {
    (fetch as jest.Mock).mockResolvedValue({ json: async () => [], ok: true })
    render(<MemoryRouter initialEntries={['/statistics/qa']}><StatisticsPage /></MemoryRouter>, { wrapper })
    await waitFor(() => expect(fetch)
        .toHaveBeenCalledTimes(4))
    expect(screen.getByRole('link', { name: 'QA' })
        .getAttribute('aria-current'))
        .toBe('page')
    expect(screen.getByRole('link', { name: 'Design' })
        .getAttribute('href'))
        .toBe('/statistics/design')
    expect(screen.getByRole('heading', { name: 'First-place wins' }))
        .toBeTruthy()
})

it('normalizes singleton totals and rejects malformed reports', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => ({ total: '0' }), ok: true })
        .mockResolvedValueOnce({ json: async () => 'not rows', ok: true })
    expect(await fetchStatistics('general/total-prizes'))
        .toEqual([{ total: '0' }])
    await expect(fetchStatistics('general/total-prizes')).rejects.toThrow('unexpected response')
    expect(formatValue(0))
        .toBe('0')
    expect(formatValue('12345', true))
        .toBe('12345')
    expect(formatValue('12345.67'))
        .toBe('12,345.67')
})
