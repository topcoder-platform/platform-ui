/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import Tooltip from './Tooltip'

const mockReactTooltip = jest.fn<JSX.Element, [unknown]>(() => <></>)

jest.mock('react-tooltip', () => ({
    Tooltip: (props: unknown): JSX.Element => mockReactTooltip(props),
}))

jest.mock('uuid', () => ({
    v4: (): string => 'tooltip-id',
}))

describe('Tooltip event modes', () => {
    beforeEach(() => {
        mockReactTooltip.mockClear()
    })

    it('uses explicit hover, focus, and click toggle events for click-hover mode', () => {
        render(
            <Tooltip content='Role details' triggerOn='click-hover'>
                <button type='button'>Role info</button>
            </Tooltip>,
        )

        const tooltipProps = mockReactTooltip.mock.calls[0][0]

        expect(screen.getByRole('button', { name: 'Role info' }))
            .toHaveAttribute('data-tooltip-delay-show', '0')
        expect(tooltipProps)
            .toEqual(expect.objectContaining({
                closeEvents: {
                    blur: true,
                    click: true,
                    mouseout: true,
                },
                openEvents: {
                    click: true,
                    focus: true,
                    mouseover: true,
                },
                openOnClick: false,
            }))
    })

    it('reserves openOnClick for click-only mode', () => {
        render(
            <Tooltip content='Help' triggerOn='click'>
                <button type='button'>Help</button>
            </Tooltip>,
        )

        const tooltipProps = mockReactTooltip.mock.calls[0][0]

        expect(tooltipProps)
            .toEqual(expect.objectContaining({
                closeEvents: undefined,
                openEvents: undefined,
                openOnClick: true,
            }))
    })
})
