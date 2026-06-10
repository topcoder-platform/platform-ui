/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { useMemberBadges, type UserBadge, type UserBadgesResponse, type UserProfile } from '~/libs/core'

import CommunityAwards from './CommunityAwards'

jest.mock('~/libs/core', () => ({
    useMemberBadges: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    Tooltip: (props: PropsWithChildren<{ content?: ReactNode }>): JSX.Element => (
        <div
            data-testid='award-tooltip'
            data-tooltip-content={String(props.content)}
        >
            {props.children}
        </div>
    ),
}), {
    virtual: true,
})

jest.mock('../../components', () => ({
    MemberBadgeModal: (): JSX.Element => <div data-testid='badge-modal' />,
}))

const mockUseMemberBadges = useMemberBadges as jest.MockedFunction<typeof useMemberBadges>

/**
 * Builds a profile award fixture for CommunityAwards tests. The badge name and
 * index are used to create stable display text and IDs, it returns a UserBadge
 * accepted by the component, and it does not raise exceptions.
 */
function createBadge(badgeName: string, index: number = 1): UserBadge {
    const badgeId: string = `badge-${index}`

    return {
        awarded_at: new Date('2026-06-04T00:00:00.000Z'),
        awarded_by: 'admin',
        org_badge: {
            active: true,
            badge_description: 'Awarded for AI profile work.',
            badge_image_url: `https://example.com/${badgeId}.svg`,
            badge_name: badgeName,
            badge_status: 'active',
            id: badgeId,
            organization_id: 'topcoder',
            orgranization: {
                id: 'topcoder',
                name: 'Topcoder',
            },
            tags_id_tags: [],
        },
        org_badge_id: badgeId,
        user_handle: 'tester',
        user_id: '123',
    }
}

describe('CommunityAwards', () => {
    beforeEach(() => {
        mockUseMemberBadges.mockReset()
    })

    it('renders awards with formatted tooltips instead of native title tooltips', () => {
        const memberBadges: UserBadgesResponse = {
            count: 1,
            rows: [createBadge('AI Rookie')],
        }

        mockUseMemberBadges.mockReturnValue(memberBadges)

        render(<CommunityAwards profile={{ userId: 123 } as UserProfile} />)

        const awardButton = screen.getByRole('button', {
            name: 'View AI Rookie award details',
        })

        expect(awardButton)
            .not
            .toHaveAttribute('title')
        expect(screen.getByTestId('award-tooltip'))
            .toHaveAttribute('data-tooltip-content', 'AI Rookie')
        expect(mockUseMemberBadges)
            .toHaveBeenCalledWith(123, { limit: 500 })
    })

    it('lets members expand awards and collapse them back to the default view', () => {
        const memberBadges: UserBadgesResponse = {
            count: 6,
            rows: Array.from({ length: 6 }, (_, index) => createBadge(`AI Award ${index + 1}`, index + 1)),
        }

        mockUseMemberBadges.mockReturnValue(memberBadges)

        render(<CommunityAwards profile={{ userId: 123 } as UserProfile} />)

        expect(screen.getByRole('button', { name: 'View AI Award 1 award details' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'View AI Award 4 award details' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'View AI Award 5 award details' }))
            .not
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: '+ 2 more badges' }))

        expect(screen.getByRole('button', { name: 'View AI Award 5 award details' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'See less' }))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'See less' }))

        expect(screen.queryByRole('button', { name: 'View AI Award 5 award details' }))
            .not
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: '+ 2 more badges' }))
            .toBeInTheDocument()
    })
})
