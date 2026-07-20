/* eslint-disable @typescript-eslint/typedef, import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import { ExternalAwsLink, HealthBadge, IncompleteDataNotice } from './StatusUi'

describe('Status UI primitives', () => {
    it('uses icon and text for critical state', () => {
        render(<HealthBadge severity='critical' />)

        expect(screen.getByLabelText('Status: Critical'))
            .toBeTruthy()
        expect(screen.getByText('Critical'))
            .toBeTruthy()
    })

    it('renders structured incomplete warnings', () => {
        render(
            <IncompleteDataNotice
                meta={{
                    complete: false,
                    generatedAt: '2026-07-20T00:00:00.000Z',
                    source: ['cloudwatch-logs'],
                    warnings: [{
                        code: 'SOURCE_WARMING',
                        message: 'History is still warming',
                        source: 'cloudwatch-logs',
                    }],
                }}
            />,
        )

        expect(screen.getByText('Incomplete monitoring data'))
            .toBeTruthy()
        expect(screen.getByText(/History is still warming/))
            .toBeTruthy()
    })

    it('allows only HTTPS AWS Console links and applies safe target attributes', () => {
        const { rerender } = render(
            <ExternalAwsLink href='https://us-east-1.console.aws.amazon.com/ecs/home'>AWS</ExternalAwsLink>,
        )
        const link = screen.getByRole('link', { name: /AWS/ })

        expect(link.getAttribute('target'))
            .toBe('_blank')
        expect(link.getAttribute('rel'))
            .toBe('noopener noreferrer')

        rerender(<ExternalAwsLink href='https://example.com/steal'>Unsafe</ExternalAwsLink>)
        expect(screen.queryByRole('link'))
            .toBeNull()
        expect(screen.getByText('Unavailable'))
            .toBeTruthy()
    })
})
