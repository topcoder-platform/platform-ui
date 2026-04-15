/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import styles from './ChallengesFilter.module.scss'
import { ChallengesFilter } from './ChallengesFilter'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            DIRECT_URL: 'https://example.com/direct',
            REVIEW_UI_URL: 'https://example.com/review',
        },
        API: {
            V5: 'https://example.com/v5',
            V6: 'https://example.com/v6',
        },
        CHALLENGE_API_URL: 'https://example.com/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://example.com/community',
        COPILOTS_URL: 'https://example.com/copilots',
        DIRECT_PROJECT_URL: 'https://example.com/direct-project',
        ENGAGEMENTS_URL: 'https://example.com/engagements',
        REVIEW_APP_URL: 'https://example.com/review',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://example.com/finance',
        TOPCODER_URL: 'https://example.com/topcoder',
    },
}), {
    virtual: true,
})

jest.mock('react-select', () => {
    const MockSelect = (): JSX.Element => <div data-testid='mock-select' />

    return MockSelect
})

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        className?: string
        label: string
        onClick?: () => void
        secondary?: boolean
        size?: string
    }) => (
        <button
            className={props.className}
            data-secondary={props.secondary
                ? 'true'
                : 'false'}
            data-size={props.size}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        SearchIcon: () => <span>search-icon</span>,
        XIcon: () => <span>close-icon</span>,
    },
    InputDatePicker: (props: { label: string }) => <div>{props.label}</div>,
}), {
    virtual: true,
})

describe('ChallengesFilter', () => {
    it('renders the reset filters button with the compact secondary styling', () => {
        const onResetFilters = jest.fn()

        render(
            <ChallengesFilter
                challengeTypes={[]}
                filters={{}}
                onFiltersChange={jest.fn()}
                onResetFilters={onResetFilters}
            />,
        )

        const resetButton = screen.getByRole('button', { name: 'Reset Filters' })

        expect(resetButton.getAttribute('data-secondary'))
            .toBe('true')
        expect(resetButton.getAttribute('data-size'))
            .toBe('md')
        expect(resetButton.className)
            .toContain(styles.resetButton)

        fireEvent.click(resetButton)

        expect(onResetFilters)
            .toHaveBeenCalledTimes(1)
    })
})
