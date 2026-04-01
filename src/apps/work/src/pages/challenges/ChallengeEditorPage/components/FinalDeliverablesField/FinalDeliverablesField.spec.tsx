/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
    FormEvent,
} from 'react'
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

import { FinalDeliverablesField } from './FinalDeliverablesField'

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        secondary?: boolean
        size?: string
        type?: 'button' | 'submit'
    }) => (
        <button
            data-secondary={props.secondary
                ? 'true'
                : 'false'}
            data-size={props.size}
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit'
                ? 'submit'
                : 'button'}
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

interface TestHarnessProps {
    defaultMetadata?: Array<{
        name: string
        value: unknown
    }>
}

const MetadataWatcher: FC = () => {
    const metadata = useWatch<ChallengeEditorFormData>({
        name: 'metadata',
    })

    return <output data-testid='metadata-value'>{JSON.stringify(metadata || [])}</output>
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            metadata: props.defaultMetadata,
            name: 'Design challenge',
            skills: [],
            tags: [],
            trackId: 'design-track',
            typeId: 'design-type',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <FinalDeliverablesField />
            <MetadataWatcher />
        </FormProvider>
    )
}

describe('FinalDeliverablesField', () => {
    it('adds unique file types to the saved metadata payload', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness />,
        )

        await user.type(screen.getByRole('textbox'), 'PNG')
        await user.click(screen.getByRole('button', {
            name: 'Add File Type',
        }))

        expect(screen.getByText('PNG'))
            .toBeTruthy()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'fileTypes',
                value: JSON.stringify(['PNG']),
            }]))
    })

    it('adds a file type on Enter without submitting the outer challenge form', async () => {
        const user = userEvent.setup()
        const handleSubmit = jest.fn()

        function handleOuterFormSubmit(event: FormEvent<HTMLFormElement>): void {
            event.preventDefault()
            handleSubmit()
        }

        render(
            <form onSubmit={handleOuterFormSubmit}>
                <TestHarness />
            </form>,
        )

        await user.type(screen.getByRole('textbox'), 'ZIP{enter}')

        expect(screen.getByText('ZIP'))
            .toBeTruthy()
        expect(handleSubmit)
            .not.toHaveBeenCalled()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'fileTypes',
                value: JSON.stringify(['ZIP']),
            }]))
    })

    it('prevents duplicate file types and supports removing existing ones', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'fileTypes',
                    value: JSON.stringify(['PNG']),
                }]}
            />,
        )

        const addButton = screen.getByRole('button', {
            name: 'Add File Type',
        })

        await user.type(screen.getByRole('textbox'), 'png')

        expect(addButton)
            .toBeDisabled()

        await user.clear(screen.getByRole('textbox'))
        await user.click(screen.getByRole('button', {
            name: 'Remove PNG',
        }))

        expect(screen.queryByText('PNG'))
            .toBeNull()
        expect(screen.getByTestId('metadata-value').textContent)
            .toBe(JSON.stringify([{
                name: 'fileTypes',
                value: JSON.stringify([]),
            }]))
    })
})
