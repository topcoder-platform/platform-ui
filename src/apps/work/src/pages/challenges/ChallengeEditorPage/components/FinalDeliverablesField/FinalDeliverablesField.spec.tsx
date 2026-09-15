/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    FC,
    FormEvent,
} from 'react'
import {
    render,
    RenderResult,
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
import { commitPendingFinalDeliverable } from '../../../../../lib/utils/final-deliverables.utils'

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
    onSave?: (formData: ChallengeEditorFormData) => void
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

    /** Submits the editor values using the create/save metadata normalization. */
    function handleSave(): void {
        props.onSave?.(commitPendingFinalDeliverable(formMethods.getValues()))
    }

    return (
        <FormProvider {...formMethods}>
            <FinalDeliverablesField />
            <MetadataWatcher />
            {props.onSave && (
                <button onClick={handleSave} type='button'>
                    Save challenge
                </button>
            )}
        </FormProvider>
    )
}

describe('FinalDeliverablesField', () => {
    it('saves a pending file type when Save is clicked and restores it from saved metadata', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { unmount }: RenderResult = render(
            <TestHarness
                defaultMetadata={[{ name: 'allowStockArt', value: 'true' }]}
                onSave={onSave}
            />,
        )

        await user.type(screen.getByRole('textbox'), '  PNG  ')
        await user.click(screen.getByRole('button', { name: 'Save challenge' }))

        expect(onSave)
            .toHaveBeenCalledWith(expect.objectContaining({
                metadata: [
                    { name: 'allowStockArt', value: 'true' },
                    { name: 'fileTypes', value: '["PNG"]' },
                ],
            }))
        unmount()
        render(<TestHarness defaultMetadata={onSave.mock.calls[0][0].metadata} />)
        expect(screen.getByText('PNG'))
            .toBeInTheDocument()
        expect(screen.getByRole('textbox'))
            .toHaveValue('')
    })

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
