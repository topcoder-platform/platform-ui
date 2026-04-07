/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WorkAppContext } from '../../../lib/contexts/WorkAppContext'
import {
    useBulkCreateGroup,
    useBulkSearchMembers,
} from '../../../lib/hooks'
import type { WorkAppContextModel } from '../../../lib/models'

import { GroupsPage } from './GroupsPage'

jest.mock('../../../lib/contexts', () => {
    const actualContexts = jest.requireActual(
        '../../../lib/contexts/WorkAppContext',
    ) as typeof import('../../../lib/contexts/WorkAppContext')

    return {
        WorkAppContext: actualContexts.WorkAppContext,
    }
})

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit' | 'reset'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit'
                ? 'submit'
                : 'button'}
        >
            {props.label}
        </button>
    ),
    LoadingSpinner: () => <div>Loading</div>,
    PageTitle: (props: PropsWithChildren) => <>{props.children}</>,
}), { virtual: true })

jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: {
        message: string
    }) => <div>{props.message}</div>,
    GroupSuccessModal: (props: {
        groupName: string
        onClose: () => void
    }) => (
        <div>
            <div>{`${props.groupName} group created successfully`}</div>
            <button onClick={props.onClose} type='button'>OK</button>
        </div>
    ),
    NullLayout: (props: PropsWithChildren) => <>{props.children}</>,
    ValidationResultsTable: () => <div>Validation Results</div>,
}))

jest.mock('../../../lib/hooks', () => ({
    useBulkCreateGroup: jest.fn(),
    useBulkSearchMembers: jest.fn(),
}))

jest.mock('../../../lib/utils', () => ({
    parseCSVFile: jest.fn(),
}))

const mockedUseBulkCreateGroup
    = useBulkCreateGroup as jest.MockedFunction<typeof useBulkCreateGroup>
const mockedUseBulkSearchMembers
    = useBulkSearchMembers as jest.MockedFunction<typeof useBulkSearchMembers>

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: true,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

describe('GroupsPage', () => {
    it('returns the created group to the caller when used in the challenge editor modal', async () => {
        const user = userEvent.setup()
        const createdGroup = {
            id: 'new-group-id',
            memberResults: [],
            name: 'New Group',
        }
        const createGroup = jest.fn()
            .mockResolvedValue(createdGroup)
        const onClose = jest.fn()
        const onCreateSuccess = jest.fn()

        mockedUseBulkCreateGroup.mockReturnValue({
            createdGroup,
            createGroup,
            error: undefined,
            isCreating: false,
        })
        mockedUseBulkSearchMembers.mockReturnValue({
            error: undefined,
            isSearching: false,
            searchMembers: jest.fn(),
            validationResults: [],
        })

        render(
            <WorkAppContext.Provider value={defaultContextValue}>
                <GroupsPage
                    embedded
                    onClose={onClose}
                    onCreateSuccess={onCreateSuccess}
                />
            </WorkAppContext.Provider>,
        )

        await user.type(screen.getByRole('textbox', {
            name: /Group Name/i,
        }), 'New Group')
        await user.type(screen.getByRole('textbox', {
            name: /Description/i,
        }), 'New group description')
        await user.click(screen.getByRole('button', {
            name: 'Create Group',
        }))

        await waitFor(() => {
            expect(createGroup)
                .toHaveBeenCalledWith({
                    description: 'New group description',
                    name: 'New Group',
                    privateGroup: true,
                    selfRegister: false,
                    userIds: [],
                })
        })

        await user.click(await screen.findByRole('button', {
            name: 'OK',
        }))

        expect(onCreateSuccess)
            .toHaveBeenCalledWith(createdGroup)
        expect(onClose)
            .toHaveBeenCalledTimes(1)
    })

    it('does not submit the parent challenge form when the embedded form is submitted', async () => {
        const user = userEvent.setup()
        const createdGroup = {
            id: 'new-group-id',
            memberResults: [],
            name: 'New Group',
        }
        const createGroup = jest.fn()
            .mockResolvedValue(createdGroup)
        const onParentSubmit = jest.fn(event => {
            event.preventDefault()
        })

        mockedUseBulkCreateGroup.mockReturnValue({
            createdGroup,
            createGroup,
            error: undefined,
            isCreating: false,
        })
        mockedUseBulkSearchMembers.mockReturnValue({
            error: undefined,
            isSearching: false,
            searchMembers: jest.fn(),
            validationResults: [],
        })

        render(
            <WorkAppContext.Provider value={defaultContextValue}>
                <form onSubmit={onParentSubmit}>
                    <GroupsPage embedded />
                </form>
            </WorkAppContext.Provider>,
        )

        await user.type(screen.getByRole('textbox', {
            name: /Group Name/i,
        }), 'New Group')
        await user.type(screen.getByRole('textbox', {
            name: /Description/i,
        }), 'New group description')

        const embeddedForm = screen.getByRole('button', {
            name: 'Create Group',
        })
            .closest('form')

        expect(embeddedForm)
            .not.toBeNull()

        fireEvent.submit(embeddedForm as HTMLFormElement)

        await waitFor(() => {
            expect(createGroup)
                .toHaveBeenCalledWith({
                    description: 'New group description',
                    name: 'New Group',
                    privateGroup: true,
                    selfRegister: false,
                    userIds: [],
                })
        })

        expect(onParentSubmit)
            .not.toHaveBeenCalled()
    })
})
