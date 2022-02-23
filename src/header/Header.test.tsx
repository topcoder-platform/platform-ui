import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Header from './Header'

describe('<Header />', () => {

    test('it should render the header', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        )
        const headerElement: HTMLElement = screen.getByTestId('header')
        expect(headerElement).toBeInTheDocument()
    })
})
