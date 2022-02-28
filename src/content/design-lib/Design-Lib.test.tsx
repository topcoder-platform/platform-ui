import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import DesignLib from './Design-Lib'

describe('<DesignLib />', () => {

    test('it should render the title prop', () => {
        render(<DesignLib />)
        const titleElement: HTMLElement = screen.getByText('Design Library')
        expect(titleElement).toBeInTheDocument()
    })
})
