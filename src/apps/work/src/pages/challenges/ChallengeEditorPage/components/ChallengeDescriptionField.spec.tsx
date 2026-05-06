/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ChallengeDescriptionField } from './ChallengeDescriptionField'

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

describe('ChallengeDescriptionField', () => {
    it('renders the public specification editor with the template link', () => {
        render(<ChallengeDescriptionField />)

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
        render(<ChallengeDescriptionField readOnly />)

        expect(screen.getByTestId('description'))
            .toHaveAttribute('data-read-only', 'true')
    })
})
