/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { HomeTopcoderTime } from './HomeTopcoderTime'

jest.mock('../hooks/use-topcoder-time', () => ({
    useTopcoderTime: () => 'Oct 8th, 07:31 UTC-4',
}))

describe('HomeTopcoderTime', () => {
    it('labels the current Topcoder Time', () => {
        render(<HomeTopcoderTime />)

        expect(screen.getByRole('region', { name: 'Topcoder Time' }))
            .toHaveTextContent('Oct 8th, 07:31 UTC-4')
    })
})
