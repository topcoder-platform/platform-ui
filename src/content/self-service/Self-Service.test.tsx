import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import SelfService from './Self-Service'

describe('<SelfService />', () => {

    test('it should render the title prop', () => {
        render(<SelfService />)
        const titleElemen: HTMLElement = screen.getByText('Self Service')
        expect(titleElemen).toBeInTheDocument()
    })
})
