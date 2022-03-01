import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import Tool from './Tool'

describe('<Tool />', () => {

    test('it should render the title prop', () => {
        const titleProp: string = 'Tool'
        render(<Tool title={titleProp} />)
        const home: HTMLElement = screen.getByText(titleProp)
        expect(home).toBeInTheDocument()
    })
})
