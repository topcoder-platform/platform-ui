/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'

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

function createBadge(badgeName: string): UserBadge {
    return {
        awarded_at: new Date('2026-06-04T00:00:00.000Z'),
        awarded_by: 'admin',
        org_badge: {
            active: true,
            badge_description: 'Awarded for AI profile work.',
            badge_image_url: 'https://example.com/ai-rookie.svg',
            badge_name: badgeName,
            badge_status: 'active',
            id: 'badge-1',
            organization_id: 'topcoder',
            orgranization: {
                id: 'topcoder',
                name: 'Topcoder',
            },
            tags_id_tags: [],
        },
        org_badge_id: 'badge-1',
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
})
