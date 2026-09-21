/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import NotFoundPage from './NotFound'

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: PropsWithChildren): JSX.Element => <div>{props.children}</div>,
    IconOutline: {
        ExclamationCircleIcon: (): JSX.Element => <svg />,
    },
    LinkButton: (props: PropsWithChildren<{ to: string }>): JSX.Element => (
        <a href={props.to}>{props.children}</a>
    ),
    PageTitle: (): JSX.Element => <></>,
}), { virtual: true })

// `getRouteElement` renders a childless `PlatformRoute` as `<Route path={route.route} />`,
// so these paths mirror the platform `homeRoutes` and `notFoundRoutes` entries.
function renderPlatformRoutes(pathname: string): void {
    render(
        <MemoryRouter initialEntries={[pathname]}>
            <Routes>
                <Route element={<div>home page</div>} path='' />
                <Route element={<NotFoundPage />} path='*' />
            </Routes>
        </MemoryRouter>,
    )
}

describe('NotFoundPage', () => {
    it('renders a message instead of a blank page for an unmatched path', () => {
        renderPlatformRoutes('/opportunities')

        expect(screen.getByRole('alert'))
            .toBeInTheDocument()
        expect(screen.getByText('We were unable to find that page'))
            .toBeInTheDocument()
        expect(screen.getByText('Go to the home page'))
            .toHaveAttribute('href', '/')
    })

    it('does not shadow a route the platform does own', () => {
        renderPlatformRoutes('/')

        expect(screen.getByText('home page'))
            .toBeInTheDocument()
        expect(screen.queryByRole('alert'))
            .not.toBeInTheDocument()
    })
})
