/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { TopgearHero } from './TopgearHero'

describe('TopgearHero', () => {
    it('renders the community-app TopGear banner without category cells or totals', () => {
        render(<TopgearHero />)

        expect(screen.getByRole('region', { name: 'TopGear challenges' }))
            .toBeInTheDocument()
        expect(screen.getByRole('img', {
            name: 'TopGear: amazing platform for design, testing and development challenges',
        }))
            .toHaveAttribute('src', expect.stringContaining('topgear-challenges-banner'))
        expect(screen.queryByRole('link'))
            .not.toBeInTheDocument()
        expect(screen.queryByText(/Find your next/))
            .not.toBeInTheDocument()
    })
})
