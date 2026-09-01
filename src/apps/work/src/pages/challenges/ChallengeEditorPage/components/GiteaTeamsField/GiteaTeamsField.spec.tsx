/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    act,
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

import {
    ChallengeEditorFormData,
    GiteaTeam,
} from '../../../../../lib/models'
import { searchGiteaTeams } from '../../../../../lib/services'

import { GiteaTeamsField } from './GiteaTeamsField'

interface MockFormSelectOption {
    label: string
    value: string
}

interface MockFormSelectFieldProps {
    disabled?: boolean
    fromFieldValue?: (value: unknown) => MockFormSelectOption[]
    hint?: string
    isAsync?: boolean
    isMulti?: boolean
    label: string
    loadOptions?: (inputValue: string) => Promise<MockFormSelectOption[]>
    name: string
    toFieldValue?: (selected: unknown) => unknown
}

let mockLastLoadOptions: ((inputValue: string) => Promise<MockFormSelectOption[]>) | undefined
let mockLoadedOptions: MockFormSelectOption[] = []

jest.mock('../../../../../lib/services', () => ({
    searchGiteaTeams: jest.fn(),
}))

jest.mock('../../../../../lib/components/form', () => ({
    FormSelectField: function MockFormSelectField(props: MockFormSelectFieldProps) {
        const reactHookForm: typeof import('react-hook-form') = jest.requireActual('react-hook-form')
        const formContext = reactHookForm.useFormContext()
        const controller = reactHookForm.useController({
            control: formContext.control,
            name: props.name,
        })
        const options = props.fromFieldValue?.(controller.field.value) || []

        mockLastLoadOptions = props.loadOptions

        function handleAppendLoadedClick(): void {
            const nextOptions = [
                ...options,
                ...mockLoadedOptions,
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
                        isAsync: props.isAsync === true,
                        isMulti: props.isMulti === true,
                    })}
                </output>
                <output data-testid='select-options'>{JSON.stringify(options)}</output>
                {/* eslint-disable-next-line react/jsx-no-bind */}
                <button onClick={handleAppendLoadedClick} type='button'>Add loaded teams</button>
            </div>
        )
    },
}))

const searchGiteaTeamsMock = searchGiteaTeams as jest.MockedFunction<typeof searchGiteaTeams>

interface TestHarnessProps {
    defaultGiteaTeams?: GiteaTeam[]
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

const devsTeam: GiteaTeam = {
    id: 12,
    name: 'devs',
    organization: 'topcoder',
}

const reviewersTeam: GiteaTeam = {
    id: 34,
    name: 'reviewers',
    organization: 'partner',
}

const designersTeam: GiteaTeam = {
    id: 56,
    name: 'designers',
    organization: 'topcoder',
}

async function loadOptions(inputValue: string): Promise<MockFormSelectOption[]> {
    let result: MockFormSelectOption[] = []

    await act(async () => {
        const pending = mockLastLoadOptions?.(inputValue) ?? Promise.resolve([])
        jest.advanceTimersByTime(500)
        result = await pending
    })

    return result
}

describe('GiteaTeamsField', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        mockLastLoadOptions = undefined
        mockLoadedOptions = []
        searchGiteaTeamsMock.mockReset()
        searchGiteaTeamsMock.mockResolvedValue([])
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders an async multi-select with the registration sync hint', () => {
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
                isAsync: true,
                isMulti: true,
            })
    })

    it('forwards the read-only state to the select', () => {
        render(<TestHarness disabled />)

        expect(JSON.parse(screen.getByTestId('select-flags').textContent || '{}').disabled)
            .toBe(true)
    })

    it('labels saved teams with the organization owning them', () => {
        render(<TestHarness defaultGiteaTeams={[reviewersTeam, devsTeam, reviewersTeam]} />)

        expect(JSON.parse(screen.getByTestId('select-options').textContent || '[]'))
            .toEqual([
                expect.objectContaining({
                    label: 'reviewers (partner)',
                    value: '34',
                }),
                expect.objectContaining({
                    label: 'devs (topcoder)',
                    value: '12',
                }),
            ])
    })

    it('omits the organization when the teams all come from one', () => {
        render(<TestHarness defaultGiteaTeams={[devsTeam, designersTeam]} />)

        expect(JSON.parse(screen.getByTestId('select-options').textContent || '[]'))
            .toEqual([
                expect.objectContaining({
                    label: 'devs',
                    value: '12',
                }),
                expect.objectContaining({
                    label: 'designers',
                    value: '56',
                }),
            ])
    })

    it('labels search results with the organization only when they span several', async () => {
        searchGiteaTeamsMock.mockResolvedValue([devsTeam, designersTeam])

        render(<TestHarness />)

        expect((await loadOptions('de')).map(option => option.label))
            .toEqual(['devs', 'designers'])

        searchGiteaTeamsMock.mockResolvedValue([devsTeam, reviewersTeam])

        expect((await loadOptions('de')).map(option => option.label))
            .toEqual(['devs (topcoder)', 'reviewers (partner)'])
    })

    it('searches teams once typing settles', async () => {
        searchGiteaTeamsMock.mockResolvedValue([devsTeam])

        render(<TestHarness />)

        const optionsPromise = act(async () => {
            mockLastLoadOptions?.('de')
            mockLastLoadOptions?.('dev')
            const pending = mockLastLoadOptions?.('devs')
            jest.advanceTimersByTime(499)
            expect(searchGiteaTeamsMock).not.toHaveBeenCalled()
            jest.advanceTimersByTime(1)
            await pending
        })

        await optionsPromise

        expect(searchGiteaTeamsMock.mock.calls)
            .toEqual([['devs']])
    })

    it('does not search until the keyword is long enough', async () => {
        render(<TestHarness />)

        expect(await loadOptions('d'))
            .toEqual([])
        expect(searchGiteaTeamsMock).not.toHaveBeenCalled()
    })

    it('resolves to no options when the search fails', async () => {
        searchGiteaTeamsMock.mockRejectedValue(new Error('review api down'))

        render(<TestHarness />)

        expect(await loadOptions('devs'))
            .toEqual([])
    })

    it('persists the id, name and organization of the selected teams', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        render(<TestHarness defaultGiteaTeams={[reviewersTeam]} />)
        mockLoadedOptions = [{
            label: 'devs (topcoder)',
            value: '12',
            ...{ team: devsTeam },
        }]

        await user.click(screen.getByRole('button', { name: 'Add loaded teams' }))

        expect(screen.getByTestId('gitea-teams-value').textContent)
            .toBe(JSON.stringify([reviewersTeam, devsTeam]))
    })

    it('keeps the persisted teams unique when a duplicate is added', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        render(<TestHarness defaultGiteaTeams={[devsTeam]} />)
        mockLoadedOptions = [{
            label: 'devs (topcoder)',
            value: '12',
            ...{ team: devsTeam },
        }]

        await user.click(screen.getByRole('button', { name: 'Add loaded teams' }))

        expect(screen.getByTestId('gitea-teams-value').textContent)
            .toBe(JSON.stringify([devsTeam]))
    })
})
