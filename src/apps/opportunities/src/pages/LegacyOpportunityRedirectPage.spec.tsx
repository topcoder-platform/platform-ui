/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { LegacyOpportunityRedirectPage } from './LegacyOpportunityRedirectPage'

let mockTopgear = true
jest.mock('../utils/topgear.utils', () => ({
    isTopgearCommunity: () => mockTopgear,
    TOPGEAR_CHALLENGES_ROUTE: '/opportunities/challenge',
}))

/** Displays the resolved URL, including repeated legacy filters and fragments. */
const Destination = (): JSX.Element => {
    const location = useLocation()
    return <output data-testid='destination'>{`${location.pathname}${location.search}${location.hash}`}</output>
}

describe('legacy Topgear challenge redirects', () => {
    it.each([
        [true, '/opportunities/challenge'],
        [false, '/opportunities/competitions'],
    ])('preserves filters and fragments with Topgear=%s', (topgear, target) => {
        mockTopgear = topgear
        const suffix = '?groups[]=one&types[]=CH&types[]=F2F&search=React%20Native#results'
        render(
            <MemoryRouter initialEntries={[`/challenges${suffix}`]}>
                <Routes>
                    <Route path='/challenges' element={<LegacyOpportunityRedirectPage list />} />
                    <Route path='/opportunities/:kind' element={<Destination />} />
                </Routes>
            </MemoryRouter>,
        )
        expect(screen.getByTestId('destination'))
            .toHaveTextContent(`${target}${suffix}`)
    })
})
