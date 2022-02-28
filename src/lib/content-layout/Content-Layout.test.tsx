import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import ContentLayout from './Content-Layout'

describe('<ContentLayout />', () => {

    test('it should render the content', () => {
        const titleProp: string = 'Home'
        render(
            <ContentLayout>
                <>
                    {titleProp}
                </>
            </ContentLayout>
        )
        const home: HTMLElement = screen.getByText(titleProp)
        expect(home).toBeInTheDocument()
    })
})
