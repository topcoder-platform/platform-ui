/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import type { ChallengeEditorFormData } from '../../../../lib/models'

import { ChallengePrivateDescriptionField } from './ChallengePrivateDescriptionField'

jest.mock('../../../../lib/components/form', () => ({
    FormMarkdownEditor: (props: {
        label: string
        name: string
    }) => (
        <div data-testid={props.name}>
            {props.label}
        </div>
    ),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
    }) => (
        <button
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

interface TestHarnessProps {
    privateDescription?: string
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public specification',
            name: 'Challenge name',
            privateDescription: props.privateDescription,
            skills: [],
            tags: [],
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengePrivateDescriptionField />
        </FormProvider>
    )
}

describe('ChallengePrivateDescriptionField', () => {
    it('reveals the template helper with a linked here label after enabling private specification', async () => {
        const user = userEvent.setup()

        render(<TestHarness />)

        await user.click(screen.getByRole('button', {
            name: 'Add private specification',
        }))

        const templateLink = screen.getByRole('link', {
            name: 'here',
        })

        expect(templateLink)
            .toHaveAttribute('href', 'https://github.com/topcoder-platform-templates/specification-templates')
        expect(screen.queryByRole('link', {
            name: 'Access specification templates',
        }))
            .not.toBeInTheDocument()
    })

    it('shows the editor immediately when a private specification already exists', () => {
        render(
            <TestHarness privateDescription='Private specification' />,
        )

        expect(screen.queryByRole('button', {
            name: 'Add private specification',
        }))
            .not.toBeInTheDocument()
        expect(screen.getByTestId('privateDescription'))
            .toHaveTextContent('Private Specification')
    })
})
