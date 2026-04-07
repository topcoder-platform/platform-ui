/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useWatch,
} from 'react-hook-form'

import { WorkAppContext } from '../../../../../lib/contexts/WorkAppContext'
import type { WorkAppContextModel } from '../../../../../lib/models/WorkAppContextModel.model'

import { GroupsField } from './GroupsField'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        children: ReactNode
        open?: boolean
    }) => (props.open
        ? <div data-testid='create-group-modal'>{props.children}</div>
        : undefined),
    IconOutline: {
        PlusIcon: () => <svg data-testid='create-group-icon' />,
    },
}), { virtual: true })

jest.mock('../../../../groups', () => ({
    GroupsPage: (props: {
        onClose?: () => void
        onCreateSuccess?: (createdGroup: {
            id: string
            name: string
        }) => void
    }): JSX.Element => {
        const handleCompleteCreateGroupClick = (): void => {
            props.onCreateSuccess?.({
                id: 'new-group-id',
                name: 'New Group',
            })
            props.onClose?.()
        }

        return (
            <div data-testid='groups-page'>
                <button
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={handleCompleteCreateGroupClick}
                    type='button'
                >
                    Complete create group
                </button>
            </div>
        )
    },
}))

jest.mock('../../../../../lib/components/form', () => ({
    FormGroupsSelect: (props: {
        additionalGroups?: Array<{
            id: string
            name: string
        }>
        name: string
    }) => {
        const reactHookForm = jest.requireActual('react-hook-form') as typeof import('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const selectedGroupIds = reactHookForm.useWatch({
            control: formContext.control,
            name: props.name,
        })

        return (
            <div data-testid='groups-select'>
                {JSON.stringify({
                    additionalGroups: props.additionalGroups,
                    selectedGroupIds,
                })}
            </div>
        )
    },
}))

interface FormValues {
    groups: string[]
}

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

const FormValueProbe = (): JSX.Element => {
    const selectedGroupIds = useWatch<FormValues>({
        name: 'groups',
    })

    return (
        <div data-testid='groups-value'>
            {JSON.stringify(selectedGroupIds)}
        </div>
    )
}

const TestForm = (props: {
    contextOverrides?: Partial<WorkAppContextModel>
    defaultGroups?: string[]
}): JSX.Element => {
    const formMethods = useForm<FormValues>({
        defaultValues: {
            groups: props.defaultGroups || [],
        },
    })
    const contextValue = useMemo(
        () => ({
            ...defaultContextValue,
            ...props.contextOverrides,
        }),
        [props.contextOverrides],
    )

    return (
        <WorkAppContext.Provider value={contextValue}>
            <FormProvider {...formMethods}>
                <GroupsField />
                <FormValueProbe />
            </FormProvider>
        </WorkAppContext.Provider>
    )
}

function renderGroupsField(
    contextOverrides?: Partial<WorkAppContextModel>,
    defaultGroups?: string[],
): void {
    render(
        <TestForm
            contextOverrides={contextOverrides}
            defaultGroups={defaultGroups}
        />,
    )
}

describe('GroupsField', () => {
    it('opens the create group modal and adds the created group to the field', async () => {
        const user = userEvent.setup()

        renderGroupsField({
            isManager: true,
        })

        expect(screen.getByTestId('groups-select'))
            .toHaveTextContent('"selectedGroupIds":[]')

        await user.click(screen.getByRole('button', {
            name: 'Create Group',
        }))

        expect(screen.getByTestId('create-group-modal'))
            .toBeInTheDocument()

        await user.click(screen.getByRole('button', {
            name: 'Complete create group',
        }))

        expect(screen.queryByTestId('create-group-modal'))
            .not.toBeInTheDocument()
        expect(screen.getByTestId('groups-value'))
            .toHaveTextContent('["new-group-id"]')
        expect(screen.getByTestId('groups-select'))
            .toHaveTextContent('"additionalGroups":[{"id":"new-group-id","name":"New Group"}]')
    })

    it('hides the create group button for users who cannot manage groups', () => {
        renderGroupsField()

        expect(screen.queryByRole('button', {
            name: 'Create Group',
        })).not.toBeInTheDocument()
    })
})
