/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires, react/jsx-no-constructed-context-values */
import {
    ReactNode,
} from 'react'
import type { Context } from 'react'
import {
    createRoot,
    Root,
} from 'react-dom/client'
import { act } from 'react-dom/test-utils'

import {
    Challenge,
    WorkAppContextModel,
} from '../../../../../lib/models'

import { ResourcesSection } from './ResourcesSection'

const mockCanDeleteResource = jest.fn()
const mockShowErrorToast = jest.fn()
const mockShowSuccessToast = jest.fn()
const mockSortResources = jest.fn()

const mockUseFetchResourceRoles = jest.fn()
const mockUseFetchResources = jest.fn()
const mockUseFetchReviews = jest.fn()
const mockUseFetchSubmissions = jest.fn()
var mockWorkAppContext: Context<WorkAppContextModel>
const baseContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string; onClick: () => void }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

jest.mock('../../../../../lib/components', () => ({
    ConfirmationModal: (): JSX.Element => <div>Confirmation modal</div>,
    LoadingSpinner: (): JSX.Element => <div>Loading spinner</div>,
    ResourceAddModal: (): JSX.Element => <div>Resource add modal</div>,
    ResourcesTable: (): JSX.Element => <div>Resources table</div>,
}))

jest.mock('../../../../../lib/contexts', () => {
    const React = require('react') as typeof import('react')

    mockWorkAppContext = React.createContext<WorkAppContextModel>({
        isAdmin: false,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: [],
    })

    return {
        WorkAppContext: mockWorkAppContext,
    }
})

jest.mock('../../../../../lib/hooks', () => ({
    useFetchResourceRoles: (...args: unknown[]): unknown => mockUseFetchResourceRoles(...args),
    useFetchResources: (...args: unknown[]): unknown => mockUseFetchResources(...args),
    useFetchReviews: (...args: unknown[]): unknown => mockUseFetchReviews(...args),
    useFetchSubmissions: (...args: unknown[]): unknown => mockUseFetchSubmissions(...args),
}))

jest.mock('../../../../../lib/services', () => ({
    deleteResource: jest.fn(),
    updateResourceRoleAssignment: jest.fn(),
}))

jest.mock('../../../../../lib/utils', () => ({
    canDeleteResource: (...args: unknown[]): unknown => mockCanDeleteResource(...args),
    showErrorToast: (...args: unknown[]): unknown => mockShowErrorToast(...args),
    showSuccessToast: (...args: unknown[]): unknown => mockShowSuccessToast(...args),
    sortResources: (...args: unknown[]): unknown => mockSortResources(...args),
}))

interface RenderResult {
    container: HTMLDivElement
    root: Root
}

interface TestProviderProps {
    children: ReactNode
    value?: Partial<WorkAppContextModel>
}

const baseChallenge: Challenge = {
    id: 'challenge-1',
    name: 'Challenge',
    status: 'ACTIVE',
}

function createMutationResult(): { mutate: jest.Mock } {
    return {
        mutate: jest.fn(),
    }
}

const TestProvider = (props: TestProviderProps): JSX.Element => {
    const contextValue: WorkAppContextModel = {
        ...baseContextValue,
        ...props.value,
    }
    const MockWorkAppContext = mockWorkAppContext

    return (
        <MockWorkAppContext.Provider
            value={contextValue}
        >
            {props.children}
        </MockWorkAppContext.Provider>
    )
}

function renderIntoDocument(element: JSX.Element): RenderResult {
    const container = document.createElement('div')
    const root = createRoot(container)

    document.body.append(container)

    act(() => {
        root.render(element)
    })

    return {
        container,
        root,
    }
}

function cleanupRendered(result: RenderResult): void {
    act(() => {
        result.root.unmount()
    })

    result.container.remove()
}

describe('ResourcesSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockCanDeleteResource.mockReturnValue(true)
        mockSortResources.mockImplementation(resources => resources)
        mockUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [],
        })
        mockUseFetchResources.mockReturnValue({
            ...createMutationResult(),
            isLoading: false,
            resources: [],
        })
        mockUseFetchReviews.mockReturnValue({
            ...createMutationResult(),
            isError: false,
            isLoading: false,
            reviews: [],
        })
        mockUseFetchSubmissions.mockReturnValue({
            ...createMutationResult(),
            isError: false,
            isLoading: false,
            submissions: [],
            total: 0,
        })
    })

    it('skips reviewer deletion rule fetches for users without editable resource roles', () => {
        const renderResult = renderIntoDocument(
            <TestProvider>
                <ResourcesSection challenge={baseChallenge} challengeId='challenge-1' />
            </TestProvider>,
        )

        try {
            expect(mockUseFetchReviews)
                .toHaveBeenCalledWith(undefined)
            expect(mockUseFetchSubmissions)
                .toHaveBeenCalledWith(undefined, 1, 5000)
            expect(renderResult.container.textContent)
                .not
                .toContain('Reviews could not be loaded.')
        } finally {
            cleanupRendered(renderResult)
        }
    })

    it('shows the reviewer deletion warning when an editor cannot load reviews', () => {
        mockUseFetchResources.mockReturnValue({
            ...createMutationResult(),
            isLoading: false,
            resources: [
                {
                    challengeId: 'challenge-1',
                    id: 'resource-1',
                    memberHandle: 'manager1',
                    memberId: '123',
                    roleId: 'manager-role-id',
                },
            ],
        })
        mockUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [
                {
                    fullReadAccess: true,
                    fullWriteAccess: true,
                    id: 'manager-role-id',
                    name: 'Manager',
                },
            ],
        })
        mockUseFetchReviews.mockReturnValue({
            ...createMutationResult(),
            isError: true,
            isLoading: false,
            reviews: [],
        })

        const renderResult = renderIntoDocument(
            <TestProvider
                value={{
                    loginUserInfo: {
                        handle: 'manager1',
                        userId: 123,
                    } as WorkAppContextModel['loginUserInfo'],
                }}
            >
                <ResourcesSection challenge={baseChallenge} challengeId='challenge-1' />
            </TestProvider>,
        )

        try {
            expect(mockUseFetchReviews)
                .toHaveBeenCalledWith('challenge-1')
            expect(renderResult.container.textContent)
                .toContain('Reviews could not be loaded.')
        } finally {
            cleanupRendered(renderResult)
        }
    })
})
