/* eslint-disable import/no-extraneous-dependencies */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
    getPublication,
    getPublicationConfig,
    publishWebsite,
} from './website-publication.service'
import { WebsitePublicationPage } from './WebsitePublicationPage'

jest.mock('~/libs/ui', () => ({
    Button: (props: any) => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.children}</button>
    ),
}), { virtual: true })
jest.mock('../lib', () => ({ PageWrapper: (props: any) => <div>{props.children}</div> }))
jest.mock('./website-publication.service', () => ({
    getPublication: jest.fn(),
    getPublicationConfig: jest.fn(),
    publicationEndpoint: 'https://cms.test/api/website-publication',
    publicationFinished: (status: string) => ['success', 'failed'].includes(status),
    publishWebsite: jest.fn(),
}))

const release = {
    environment: 'production' as const,
    pipelineId: 'publication-1',
    status: 'running',
    url: 'https://app.circleci.com/pipelines/github/topcoder-platform/topcoder-website/42',
}

describe('WebsitePublicationPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        sessionStorage.clear();
        (getPublicationConfig as jest.Mock).mockResolvedValue({ enabled: true, environment: 'production' });
        (publishWebsite as jest.Mock).mockResolvedValue({ ...release, status: 'pending' });
        (getPublication as jest.Mock).mockResolvedValue(release)
    })

    it('shows the actual target environment and disables repeated clicks while publishing', async () => {
        render(<WebsitePublicationPage />)
        await screen.findByText('Production website')
        fireEvent.click(screen.getByRole('button', { name: 'Publish Website' }))
        await screen.findByText('Publication status: running')
        expect(screen.getByRole('button', { name: 'Publishing…' }))
            .toBeDisabled()
        expect(publishWebsite)
            .toHaveBeenCalledTimes(1)
        expect(getPublication)
            .toHaveBeenCalledWith('publication-1')
        expect(sessionStorage.getItem('website-publication:https://cms.test/api/website-publication'))
            .toBe('publication-1')
    })

    it('resumes a pending pipeline after reload and reports a failed deployment', async () => {
        sessionStorage.setItem('website-publication:https://cms.test/api/website-publication', 'publication-1');
        (getPublication as jest.Mock).mockResolvedValue({ ...release, status: 'failed' })
        render(<WebsitePublicationPage />)
        await screen.findByText('Publication status: failed')
        expect(publishWebsite).not.toHaveBeenCalled()
        expect(screen.getByRole('link', { name: 'View publication details' }))
            .toHaveAttribute('href', release.url)
        await waitFor(() => expect(screen.getByRole('button', { name: 'Publish Website' }))
            .toBeEnabled())
        expect(sessionStorage.getItem('website-publication:https://cms.test/api/website-publication'))
            .toBeNull()
    })

    it('keeps publishing disabled when the server has not been configured', async () => {
        (getPublicationConfig as jest.Mock).mockResolvedValue({ enabled: false, environment: 'dev' })
        render(<WebsitePublicationPage />)
        await screen.findByText('Website publishing has not been enabled for this environment.')
        expect(screen.getByRole('button', { name: 'Publish Website' }))
            .toBeDisabled()
    })

    it('reports submission failures without claiming the website was published', async () => {
        (publishWebsite as jest.Mock).mockRejectedValue(new Error('Check CircleCI before trying again.'))
        render(<WebsitePublicationPage />)
        await screen.findByText('Production website')
        fireEvent.click(screen.getByRole('button', { name: 'Publish Website' }))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Check CircleCI before trying again.')
        expect(screen.queryByText('Website publication completed.')).not.toBeInTheDocument()
        expect(getPublication).not.toHaveBeenCalled()
    })
})
