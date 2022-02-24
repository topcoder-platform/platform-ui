import '@testing-library/jest-dom'
import { render, RenderResult } from '@testing-library/react'

import Utilities from './Utilities'

describe('<Utilities />', () => {

    test('it should display the utilities', () => {
        const renderResult: RenderResult = render(<Utilities />)
        const utilitiesElement: HTMLElement | null = renderResult.container.querySelector('.utilities')
        expect(utilitiesElement).toBeInTheDocument()
    })
})
