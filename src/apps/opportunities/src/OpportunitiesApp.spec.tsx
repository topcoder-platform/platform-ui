/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'

import { routerContext } from '~/libs/core'

import OpportunitiesApp from './OpportunitiesApp'

jest.mock('~/libs/core', () => {
    const React = jest.requireActual('react')
    return { routerContext: React.createContext({ getChildRoutes: () => [] }) }
}, { virtual: true })
jest.mock('./opportunities.routes', () => ({ toolTitle: 'Opportunities' }))

describe('OpportunitiesApp', () => {
    afterEach(() => {
        document.body.className = ''
    })

    it('scopes the 2026 design system to app content instead of universal navigation', () => {
        const getChildRoutes = jest.fn(() => [
            <Route element={<div>Opportunities</div>} key='root' path='/' />,
        ])
        const result = render(
            <MemoryRouter>
                <routerContext.Provider value={{
                    getChildRoutes,
                } as any}
                >
                    <OpportunitiesApp />
                </routerContext.Provider>
            </MemoryRouter>,
        )

        expect(result.container.querySelector('.opportunities-app.tc-2026'))
            .toBeInTheDocument()
        expect(document.body)
            .toHaveClass('opportunities-page')
        expect(document.body)
            .not.toHaveClass('opportunities-app', 'tc-2026')

        result.unmount()
        expect(document.body)
            .not.toHaveClass('opportunities-page')
    })
})
