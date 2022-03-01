import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import Home from './Home'

describe('<Home />', () => {

    test('it should render the title prop', () => {
        render(<Home />)
        const home: HTMLElement = screen.getByText('Home')
        expect(home).toBeInTheDocument()
    })
})
