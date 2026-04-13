/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    useFetchProjectMembers,
} from '../../../../../lib/hooks'
import {
    ChallengeEditorFormData,
} from '../../../../../lib/models'
import {
    searchProfilesByUserIds,
} from '../../../../../lib/services'

import CopilotField from './CopilotField'

jest.mock('../../../../../lib/components/form', () => ({
    FormSelectField: (props: {
        name: string
    }) => {
        const {
            useController,
            useFormContext,
        }: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = useFormContext()
        const controller = useController({
            control: formContext.control,
            name: props.name,
        })

        return (
            <input
                aria-label='Copilot Field'
                readOnly
                value={controller.field.value || ''}
            />
        )
    },
}))
jest.mock('../../../../../lib/hooks', () => ({
    useFetchProjectMembers: jest.fn(),
}))
jest.mock('../../../../../lib/constants', () => ({
    PROJECT_ROLES: {
        COPILOT: 'copilot',
    },
}))
jest.mock('../../../../../lib/contexts', () => {
    const React = jest.requireActual('react') as typeof import('react')

    return {
        WorkAppContext: React.createContext({
            loginUserInfo: {
                handle: 'requester',
            },
        }),
    }
})
jest.mock('../../../../../lib/services', () => ({
    searchProfilesByUserIds: jest.fn(),
}))
jest.mock('~/libs/ui', () => ({
    Button: () => undefined,
}), {
    virtual: true,
})

const mockedUseFetchProjectMembers = useFetchProjectMembers as jest.Mock
const mockedSearchProfilesByUserIds = searchProfilesByUserIds as jest.Mock

const baseDefaultValues: ChallengeEditorFormData = {
    description: 'Copilot compatibility test',
    name: 'Copilot compatibility test',
    prizeSets: [],
    reviewers: [],
    skills: [],
    tags: [],
    trackId: '',
    typeId: '',
}

const TestHarness = (props: {
    defaultValues?: Partial<ChallengeEditorFormData>
}): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            ...baseDefaultValues,
            ...props.defaultValues,
        },
    })

    return (
        <FormProvider {...formMethods}>
            <CopilotField projectId='project-1' />
        </FormProvider>
    )
}

describe('CopilotField', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchProjectMembers.mockReturnValue({
            isLoading: false,
            members: [],
        })
        mockedSearchProfilesByUserIds.mockResolvedValue([])
    })

    it('normalizes persisted copilot user ids to project copilot handles', async () => {
        mockedUseFetchProjectMembers.mockReturnValue({
            isLoading: false,
            members: [{
                handle: 'copilot-user',
                role: 'copilot',
                userId: 40158994,
            }],
        })

        render(
            <TestHarness
                defaultValues={{
                    copilot: '40158994',
                }}
            />,
        )

        await waitFor(() => {
            expect(screen.getByLabelText('Copilot Field'))
                .toHaveValue('copilot-user')
        })
    })

    it('falls back to member-profile lookup when project copilot metadata has not loaded the handle', async () => {
        mockedSearchProfilesByUserIds.mockResolvedValue([{
            handle: 'profile-copilot',
            userId: '501',
        }])

        render(
            <TestHarness
                defaultValues={{
                    copilot: '501',
                }}
            />,
        )

        await waitFor(() => {
            expect(screen.getByLabelText('Copilot Field'))
                .toHaveValue('profile-copilot')
        })
    })
})
