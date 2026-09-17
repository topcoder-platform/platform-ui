/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import ShowcasePostDetails, { getShowcaseDetailItems, getShowcaseStorySections } from './ShowcasePostDetails'

jest.mock('~/libs/shared/lib/utils/text-format', () => ({
    textFormatDateLocaleShortString: (date: Date) => date.toISOString()
        .slice(0, 10),
}), { virtual: true })

const expectedDate = new Date(2026, 7, 15)
    .toISOString()
    .slice(0, 10)

describe('Showcase post details', () => {
    it('lists populated summary fields in order and hides missing ones', () => {
        expect(getShowcaseDetailItems({
            currentStatus: ' ',
            customer: 'Wipro',
            dealCloseDate: '2026-08-15',
            keyWin: 'Win-win',
            smu: 'Others',
            smuOther: 'LATAM',
            type: 'Private POD Delivery',
        }))
            .toEqual([
                { label: 'Type', value: 'Private POD Delivery' },
                { label: 'Customer', value: 'Wipro' },
                { label: 'SMU', value: 'LATAM' },
                { label: 'Deal Close Date', value: expectedDate },
                { label: 'Key Win', value: 'Win-win' },
            ])
    })

    it('returns only populated story sections', () => {
        expect(getShowcaseStorySections({ businessImpact: 'Impact', challenge: '', content: 'Solution' })
            .map(section => section.label))
            .toEqual(['The Solution', 'Business Impact Realised'])
    })

    it('renders labelled values and nothing when no fields are populated', () => {
        const view = render(<ShowcasePostDetails data={{}} />)
        expect(view.container)
            .toBeEmptyDOMElement()
        view.rerender(<ShowcasePostDetails data={{ owner: 'oww', smu: 'Americas1' }} />)
        expect(screen.getByText('SMU'))
            .toBeInTheDocument()
        expect(screen.getByText('Americas1'))
            .toBeInTheDocument()
        expect(screen.getByText('Owner'))
            .toBeInTheDocument()
        expect(screen.queryByText('Customer')).not.toBeInTheDocument()
    })
})
