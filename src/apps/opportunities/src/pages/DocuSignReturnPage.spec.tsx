/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import DocuSignReturnPage from './DocuSignReturnPage'

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

describe('DocuSignReturnPage', () => {
    const originalParent = window.parent

    afterEach(() => {
        Object.defineProperty(window, 'parent', { configurable: true, value: originalParent })
        window.history.replaceState({}, '', '/')
    })

    it('posts the DocuSign outcome to its same-origin parent frame', () => {
        const postMessage = jest.fn()
        Object.defineProperty(window, 'parent', { configurable: true, value: { postMessage } })
        window.history.replaceState({}, '', '/opportunities/terms/docusign-return?event=signing_complete')

        render(<DocuSignReturnPage />)

        expect(postMessage)
            .toHaveBeenCalledWith({ event: 'signing_complete', type: 'DocuSign' }, window.location.origin)
        expect(screen.getByRole('status').textContent)
            .toContain('Returning to your challenge terms')
    })

    it('explains the finished session when opened outside a frame', () => {
        const postMessage = jest.spyOn(window, 'postMessage')

        render(<DocuSignReturnPage />)

        expect(postMessage)
            .not.toHaveBeenCalled()
        expect(screen.getByRole('status').textContent)
            .toContain('You can close this tab')
        postMessage.mockRestore()
    })
})
