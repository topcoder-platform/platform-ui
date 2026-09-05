/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { PropsWithChildren, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { SWRConfig } from 'swr'

import {
    downloadChallengeSubmissionArtifact,
    getChallengeSubmissionArtifacts,
} from '../services'

import { SubmissionArtifactsModal } from './SubmissionArtifactsModal'

jest.mock('../services', () => ({
    downloadChallengeSubmissionArtifact: jest.fn(),
    getChallengeSubmissionArtifacts: jest.fn(),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn() },
}))

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        BaseModal: (props: PropsWithChildren<{
            ariaLabelledby?: string
            open: boolean
            title?: ReactNode
        }>): JSX.Element => (props.open ? (
            <div aria-labelledby={props.ariaLabelledby} role='dialog'>
                {props.title}
                {props.children}
            </div>
        ) : <></>),
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })

const mockedGetArtifacts = getChallengeSubmissionArtifacts as jest.Mock
const mockedDownloadArtifact = downloadChallengeSubmissionArtifact as jest.Mock

describe('SubmissionArtifactsModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetArtifacts.mockResolvedValue(['scorer-results'])
        mockedDownloadArtifact.mockResolvedValue(new Blob(['results'], { type: 'application/zip' }))
        Object.defineProperty(window.URL, 'createObjectURL', {
            configurable: true,
            value: jest.fn()
                .mockReturnValue('blob:artifact'),
        })
        Object.defineProperty(window.URL, 'revokeObjectURL', {
            configurable: true,
            value: jest.fn(),
        })
        jest.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => undefined)
    })

    it('loads and downloads the selected scorer artifact through Review API', async () => {
        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    onClose={jest.fn()}
                    open
                    submissionId='submission/id'
                />
            </SWRConfig>,
        )

        expect(await screen.findByRole('table', { name: 'Submission artifacts' }))
            .toBeInTheDocument()
        expect(mockedGetArtifacts)
            .toHaveBeenCalledWith('submission/id')

        fireEvent.click(screen.getByRole('button', { name: 'Download artifact scorer-results' }))

        await waitFor(() => expect(mockedDownloadArtifact)
            .toHaveBeenCalledWith('submission/id', 'scorer-results'))
        await waitFor(() => expect(window.URL.createObjectURL)
            .toHaveBeenCalled())
        expect(HTMLAnchorElement.prototype.click)
            .toHaveBeenCalled()
        expect(toast.error)
            .not.toHaveBeenCalled()
    })

    it('prevents overlapping artifact downloads', async () => {
        let finishDownload!: (blob: Blob) => void
        mockedGetArtifacts.mockResolvedValue(['first-results', 'second-results'])
        mockedDownloadArtifact.mockImplementation(() => new Promise<Blob>(resolve => {
            finishDownload = resolve
        }))

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    onClose={jest.fn()}
                    open
                    submissionId='submission-id'
                />
            </SWRConfig>,
        )

        const firstDownload = await screen.findByRole('button', {
            name: 'Download artifact first-results',
        })
        const secondDownload = screen.getByRole('button', {
            name: 'Download artifact second-results',
        })
        fireEvent.click(firstDownload)

        await waitFor(() => expect(secondDownload)
            .toBeDisabled())
        fireEvent.click(secondDownload)
        expect(mockedDownloadArtifact)
            .toHaveBeenCalledTimes(1)

        finishDownload(new Blob(['results'], { type: 'application/zip' }))
        await waitFor(() => expect(secondDownload)
            .not.toBeDisabled())
    })
})
