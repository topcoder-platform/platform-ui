import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import Placeholder from './Placeholder'

describe('<Placeholder />', () => {

    test('it should render the title prop', () => {
        const titleProp: string = 'Home'
        render(<Placeholder title={titleProp} />)
        const home: HTMLElement = screen.getByText(titleProp)
        expect(home).toBeInTheDocument()
    })
})
