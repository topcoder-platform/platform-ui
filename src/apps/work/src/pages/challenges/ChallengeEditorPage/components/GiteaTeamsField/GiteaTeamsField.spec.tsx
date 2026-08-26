/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useWatch,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { GiteaTeamsField } from './GiteaTeamsField'

interface MockFormSelectOption {
    label: string
    value: string
}

interface MockFormSelectFieldProps {
    disabled?: boolean
    fromFieldValue?: (value: unknown) => MockFormSelectOption[]
    hint?: string
    isCreatable?: boolean
    isMulti?: boolean
    label: string
    name: string
    toFieldValue?: (selected: unknown) => unknown
}

jest.mock('../../../../../lib/components/form', () => ({
    FormSelectField: function MockFormSelectField(props: MockFormSelectFieldProps) {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })
        const options = props.fromFieldValue?.(controller.field.value) || []

        function handleAppendClick(): void {
            const nextOptions = [
                ...options,
                {
                    label: '12',
                    value: '12',
                },
            ]
            controller.field.onChange(props.toFieldValue?.(nextOptions) ?? nextOptions)
        }

        return (
            <div>
                <output data-testid='select-hint'>{props.hint}</output>
                <output data-testid='select-label'>{props.label}</output>
                <output data-testid='select-flags'>
                    {JSON.stringify({
                        disabled: props.disabled === true,
                        isCreatable: props.isCreatable === true,
                        isMulti: props.isMulti === true,
                    })}
                </output>
                <output data-testid='select-options'>{JSON.stringify(options)}</output>
                {/* eslint-disable-next-line react/jsx-no-bind */}
                <button onClick={handleAppendClick} type='button'>Add team 12</button>
            </div>
        )
    },
}))

interface TestHarnessProps {
    defaultGiteaTeams?: string[]
    disabled?: boolean
}

const GiteaTeamsWatcher: FC = () => {
    const giteaTeams = useWatch<ChallengeEditorFormData>({
        name: 'giteaTeams',
    })

    return <output data-testid='gitea-teams-value'>{JSON.stringify(giteaTeams || [])}</output>
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            giteaTeams: props.defaultGiteaTeams,
            name: 'Challenge',
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <GiteaTeamsField disabled={props.disabled} />
            <GiteaTeamsWatcher />
        </FormProvider>
    )
}

describe('GiteaTeamsField', () => {
    it('renders a creatable multi-select with the registration sync hint', () => {
        render(<TestHarness />)

        expect(screen.getByTestId('select-label').textContent)
            .toBe('Gitea Teams')
        expect(screen.getByTestId('select-hint').textContent)
            .toBe(
                'Challenge participants will be automatically added to these Gitea teams'
                + ' upon registration and removed if they unregister.',
            )
        expect(JSON.parse(screen.getByTestId('select-flags').textContent || '{}'))
            .toEqual({
                disabled: false,
                isCreatable: true,
                isMulti: true,
            })
    })

    it('forwards the read-only state to the select', () => {
        render(<TestHarness disabled />)

        expect(JSON.parse(screen.getByTestId('select-flags').textContent || '{}').disabled)
            .toBe(true)
    })

    it('loads the saved team ids as options, dropping blanks and duplicates', () => {
        render(<TestHarness defaultGiteaTeams={[' 34 ', '12', '', '34']} />)

        expect(JSON.parse(screen.getByTestId('select-options').textContent || '[]'))
            .toEqual([
                {
                    label: '34',
                    value: '34',
                },
                {
                    label: '12',
                    value: '12',
                },
            ])
    })

    it('keeps the persisted team ids unique when a duplicate is added', async () => {
        const user = userEvent.setup()

        render(<TestHarness defaultGiteaTeams={['12']} />)

        await user.click(screen.getByRole('button', { name: 'Add team 12' }))

        expect(screen.getByTestId('gitea-teams-value').textContent)
            .toBe(JSON.stringify(['12']))
    })

    it('persists a newly created team id', async () => {
        const user = userEvent.setup()

        render(<TestHarness defaultGiteaTeams={['34']} />)

        await user.click(screen.getByRole('button', { name: 'Add team 12' }))

        expect(screen.getByTestId('gitea-teams-value').textContent)
            .toBe(JSON.stringify(['34', '12']))
    })
})
