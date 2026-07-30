/* eslint-disable @typescript-eslint/no-var-requires, global-require */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    COPILOT_RESOURCE_ROLE_ID,
    PAST_CHALLENGE_ROLE_SELECT_OPTIONS,
    REVIEWER_RESOURCE_ROLE_IDS,
    SUBMITTER_RESOURCE_ROLE_ID,
} from '../../../config/index.config'
import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchPastReviews,
} from '../../../lib/hooks'

import { PastReviewsPage } from './PastReviewsPage'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.example.com',
        },
    },
}), { virtual: true })

jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: {
        inputId?: string
        isDisabled?: boolean
        onChange: (option?: { label: string; value: string }) => void
        options: Array<{ label: string; value: string }>
        value?: { label: string; value: string }
    }) => {
        function handleChange(event: { target: { value: string } }): void {
            const selectedOption = props.options.find(
                option => option.value === event.target.value,
            )
            props.onChange(selectedOption)
        }

        return (
            <select
                aria-label={props.inputId}
                disabled={props.isDisabled}
                id={props.inputId}
                onChange={handleChange}
                value={props.value?.value ?? ''}
            >
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    },
}))

jest.mock('~/apps/admin/src/lib', () => ({
    Pagination: () => <div>Pagination</div>,
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
    }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconOutline: {
        XIcon: () => <span>clear-icon</span>,
    },
    InputText: (props: {
        name: string
        onChange?: (event: { target: { value: string } }) => void
        value?: string
    }) => (
        <input
            aria-label={props.name}
            name={props.name}
            onChange={props.onChange}
            value={props.value}
        />
    ),
}), { virtual: true })

jest.mock('../../../lib', () => {
    const React = require('react') as typeof import('react')

    return {
        PageWrapper: (props: React.PropsWithChildren) => <div>{props.children}</div>,
        ReviewAppContext: React.createContext({
            loginUserInfo: {
                userId: '40587818',
            },
        }),
        TableActiveReviews: () => <div>Past reviews</div>,
        TableNoRecord: () => <div>No records</div>,
    }
})

jest.mock('../../../lib/hooks', () => ({
    useFetchChallengeTracks: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
    useFetchPastReviews: jest.fn(),
}))

jest.mock('../../../lib/utils', () => ({
    CHALLENGE_STATUS_SELECT_ALL_OPTION: {
        label: 'All statuses',
        value: '',
    },
    PAST_CHALLENGE_STATUS_OPTIONS: [
        {
            label: 'All statuses',
            value: '',
        },
    ],
}))

const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedUseFetchPastReviews = useFetchPastReviews as jest.Mock
const loadPastReviews = jest.fn()

describe('PastReviewsPage role filter', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        loadPastReviews.mockResolvedValue(undefined)
        mockedUseFetchChallengeTracks.mockReturnValue({
            challengeTracks: [],
            isLoading: false,
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
            isLoading: false,
        })
        mockedUseFetchPastReviews.mockReturnValue({
            isLoading: false,
            loadPastReviews,
            pagination: {
                page: 1,
                perPage: 50,
                totalCount: 0,
                totalPages: 1,
            },
            pastReviews: [],
        })
    })

    it('offers every supported role and loads page one with every reviewer role ID', async () => {
        render(<PastReviewsPage />)

        const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement
        expect(Array.from(roleSelect.options)
            .map(option => option.text))
            .toEqual(['All roles', 'Reviewer', 'Copilot', 'Submitter'])
        expect(PAST_CHALLENGE_ROLE_SELECT_OPTIONS)
            .toHaveLength(4)

        fireEvent.change(roleSelect, {
            target: {
                value: REVIEWER_RESOURCE_ROLE_IDS.join(','),
            },
        })

        await waitFor(() => {
            expect(loadPastReviews)
                .toHaveBeenLastCalledWith(expect.objectContaining({
                    page: 1,
                    resourceRoleIds: REVIEWER_RESOURCE_ROLE_IDS,
                }))
        })
    })

    it.each([
        ['Copilot', COPILOT_RESOURCE_ROLE_ID],
        ['Submitter', SUBMITTER_RESOURCE_ROLE_ID],
    ])('loads page one for the %s role', async (_label, resourceRoleId) => {
        render(<PastReviewsPage />)

        fireEvent.change(screen.getByLabelText('Role'), {
            target: {
                value: resourceRoleId,
            },
        })

        await waitFor(() => {
            expect(loadPastReviews)
                .toHaveBeenLastCalledWith(expect.objectContaining({
                    page: 1,
                    resourceRoleIds: [resourceRoleId],
                }))
        })
    })

    it('removes the reviewer role IDs when filters are cleared', async () => {
        render(<PastReviewsPage />)

        const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement
        fireEvent.change(roleSelect, {
            target: {
                value: REVIEWER_RESOURCE_ROLE_IDS.join(','),
            },
        })

        await waitFor(() => {
            expect(loadPastReviews)
                .toHaveBeenLastCalledWith(expect.objectContaining({
                    resourceRoleIds: REVIEWER_RESOURCE_ROLE_IDS,
                }))
        })

        loadPastReviews.mockClear()
        fireEvent.click(screen.getByRole('button', { name: 'Clear' }))

        await waitFor(() => {
            expect(loadPastReviews)
                .toHaveBeenCalledWith(expect.objectContaining({
                    page: 1,
                    resourceRoleIds: undefined,
                }))
        })
        expect(roleSelect.value)
            .toBe('')
    })
})
