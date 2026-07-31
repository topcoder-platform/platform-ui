/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import { copyTextToClipboard } from '~/libs/shared'

import type { ChallengeEditorFormData } from '../../../../lib/models'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import { ChallengeDescriptionField } from './ChallengeDescriptionField'

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: jest.fn()
        .mockResolvedValue(undefined),
}), { virtual: true })

jest.mock('../../../../lib/components/form', () => ({
    FormMarkdownEditor: (props: {
        label: string
        name: string
        readOnly?: boolean
        required?: boolean
    }) => (
        <div
            data-read-only={props.readOnly === true ? 'true' : 'false'}
            data-required={props.required === true ? 'true' : 'false'}
            data-testid={props.name}
        >
            {props.label}
        </div>
    ),
}))

jest.mock('../../../../lib/utils', () => ({
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const specification = '# Public specification\n\nCopy this Markdown exactly.'

interface TestHarnessProps {
    readOnly?: boolean
}

/**
 * Supplies the public specification form state and mirrors the disabled fieldset used in view mode.
 *
 * @param props Controls whether the field and its surrounding fieldset render as read-only.
 * @returns The challenge description field inside its required form context.
 */
const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: specification,
        },
    })

    return (
        <FormProvider {...formMethods}>
            <fieldset disabled={props.readOnly}>
                <ChallengeDescriptionField readOnly={props.readOnly} />
            </fieldset>
        </FormProvider>
    )
}

describe('ChallengeDescriptionField', () => {
    beforeEach(jest.clearAllMocks)

    it('renders the public specification editor with the template link', () => {
        render(<TestHarness />)

        expect(screen.getByTestId('description'))
            .toHaveTextContent('Public Specification')
        expect(screen.getByTestId('description'))
            .toHaveAttribute('data-required', 'true')
        expect(screen.getByRole('link', {
            name: 'here',
        }))
            .toHaveAttribute('href', 'https://github.com/topcoder-platform-templates/specification-templates')
    })

    it('passes read-only mode to the public specification editor', () => {
        render(<TestHarness readOnly />)

        expect(screen.getByTestId('description'))
            .toHaveAttribute('data-read-only', 'true')
    })

    it.each([
        ['edit', false],
        ['view', true],
    ])('copies the current Markdown in %s mode', async (
        _mode: string,
        readOnly: boolean,
    ) => {
        render(<TestHarness readOnly={readOnly} />)

        const copySpecControl = screen.getByRole('button', {
            name: 'Copy spec',
        })

        expect(copySpecControl)
            .toBeEnabled()
        fireEvent.click(copySpecControl)

        await waitFor(() => {
            expect(copyTextToClipboard)
                .toHaveBeenCalledWith(specification)
        })
        expect(copyTextToClipboard)
            .toHaveBeenCalledTimes(1)
        expect(showSuccessToast)
            .toHaveBeenCalledWith('Specification copied to clipboard.')
        expect(showErrorToast)
            .not.toHaveBeenCalled()
    })

    it('supports copying with the keyboard in view mode', async () => {
        render(<TestHarness readOnly />)

        fireEvent.keyDown(screen.getByRole('button', {
            name: 'Copy spec',
        }), {
            key: 'Enter',
        })

        await waitFor(() => {
            expect(copyTextToClipboard)
                .toHaveBeenCalledWith(specification)
        })
    })
})
