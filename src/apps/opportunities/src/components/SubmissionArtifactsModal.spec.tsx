/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { unzipSync } from 'fflate'
import { PropsWithChildren, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { SWRConfig } from 'swr'

import {
    downloadChallengeSubmissionArtifact,
    getChallengeSubmissionArtifacts,
} from '../services'

import { SubmissionArtifactsModal } from './SubmissionArtifactsModal'

jest.mock('fflate', () => {
    const actual = jest.requireActual('fflate')
    return {
        ...actual,
        zip: (data: object, _options: object, callback: (error: undefined, output: Uint8Array) => void): void => {
            callback(undefined, actual.zipSync(data))
        },
    }
})

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
        Tooltip: (props: PropsWithChildren): JSX.Element => <>{props.children}</>,
    }
}, { virtual: true })

const mockedGetArtifacts = getChallengeSubmissionArtifacts as jest.Mock
const mockedDownloadArtifact = downloadChallengeSubmissionArtifact as jest.Mock

describe('SubmissionArtifactsModal', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockedGetArtifacts.mockResolvedValue(['example'])
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

    it.each([false, true])('filters internal artifact controls when access is %s', async allowInternalArtifacts => {
        mockedGetArtifacts.mockResolvedValue([
            'example', 'regular-results', 'example-internal', 'provisional-internal', 'system-INTERNAL',
        ])
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    allowInternalArtifacts={allowInternalArtifacts}
                    onClose={jest.fn()}
                    open
                    submissionId='submission-id'
                />
            </SWRConfig>,
        )
        expect(await screen.findByRole('button', { name: 'Download artifact example' }))
            .toBeInTheDocument()
        expect(screen.queryAllByRole('button', { name: /Download artifact .*internal/i }))
            .toHaveLength(allowInternalArtifacts ? 3 : 0)
        expect(screen.queryAllByRole('button', { name: 'Download artifact regular-results' }))
            .toHaveLength(allowInternalArtifacts ? 1 : 0)
        expect(screen.queryByRole('button', { name: 'Download all' }))
            .not.toBeInTheDocument()
    })

    it('shows the active match example with its exact submission-prefixed API ID', async () => {
        const submissionId = 'YtoH-k9To2Ggxx'
        const exampleId = `${submissionId}-example`
        mockedGetArtifacts.mockResolvedValue([
            exampleId, `${submissionId}-example-internal`, `${submissionId}-provisional-internal`,
            `${submissionId}-system-internal`, 'other-submission-example', `${submissionId}-example-extra`,
        ])
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <SubmissionArtifactsModal onClose={jest.fn()} open submissionId={submissionId} />
            </SWRConfig>,
        )
        fireEvent.click(await screen.findByRole('button', { name: `Download artifact ${exampleId}` }))
        expect(screen.getAllByRole('row'))
            .toHaveLength(2)
        expect(screen.queryByRole('button', { name: 'Download all' })).not.toBeInTheDocument()
        await waitFor(() => expect(mockedDownloadArtifact)
            .toHaveBeenCalledWith(submissionId, exampleId))
        await waitFor(() => expect(HTMLAnchorElement.prototype.click)
            .toHaveBeenCalled())
        expect((HTMLAnchorElement.prototype.click as jest.Mock).mock.instances[0].download)
            .toBe(`${exampleId}.zip`)
    })

    it('filters cached prefixed internal artifacts when management access is removed', async () => {
        const artifactIds = ['submission-id-example', 'submission-id-example-internal']
        mockedGetArtifacts.mockResolvedValue(artifactIds)
        const cache: Map<string, unknown> = new Map()
        const { rerender }: ReturnType<typeof render> = render(
            <SWRConfig value={{ provider: () => cache }}>
                <SubmissionArtifactsModal
                    allowInternalArtifacts
                    onClose={jest.fn()}
                    open
                    submissionId='submission-id'
                />
            </SWRConfig>,
        )
        await screen.findByRole('button', { name: `Download artifact ${artifactIds[1]}` })
        rerender(
            <SWRConfig value={{ provider: () => cache }}>
                <SubmissionArtifactsModal onClose={jest.fn()} open submissionId='submission-id' />
            </SWRConfig>,
        )
        await screen.findByRole('button', { name: `Download artifact ${artifactIds[0]}` })
        expect(screen.queryByRole('button', { name: `Download artifact ${artifactIds[1]}` }))
            .not.toBeInTheDocument()
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

        fireEvent.click(screen.getByRole('button', { name: 'Download artifact example' }))

        await waitFor(() => expect(mockedDownloadArtifact)
            .toHaveBeenCalledWith('submission/id', 'example'))
        await waitFor(() => expect(window.URL.createObjectURL)
            .toHaveBeenCalled())
        expect(HTMLAnchorElement.prototype.click)
            .toHaveBeenCalled()
        expect(toast.error)
            .not.toHaveBeenCalled()
    })

    it('prevents overlapping artifact downloads', async () => {
        let finishDownload!: (blob: Blob) => void
        mockedGetArtifacts.mockResolvedValue(['example', 'second-results'])
        mockedDownloadArtifact.mockImplementation(() => new Promise<Blob>(resolve => {
            finishDownload = resolve
        }))

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    allowInternalArtifacts
                    onClose={jest.fn()}
                    open
                    submissionId='submission-id'
                />
            </SWRConfig>,
        )

        const firstDownload = await screen.findByRole('button', {
            name: 'Download artifact example',
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

    it('shows submission metadata and saves all authorized artifacts in one complete ZIP', async () => {
        const artifactIds = ['example-internal', 'example', 'provisional-internal', 'system-internal']
            .map(id => `completed-submission-${id}`)
        const onClose = jest.fn()
        mockedGetArtifacts.mockResolvedValue(artifactIds)
        mockedDownloadArtifact.mockImplementation((_submissionId, id) => (
            Promise.resolve(new Blob([id], { type: 'text/plain' }))
        ))
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    allowInternalArtifacts
                    completed
                    handle='wleite'
                    rating={2400}
                    onClose={onClose}
                    open
                    submissionId='completed-submission'
                />
            </SWRConfig>,
        )
        expect(screen.getByText('Submission ID:').parentElement)
            .toHaveTextContent('completed-submission')
        expect(screen.getByText('Handle:').parentElement)
            .toHaveTextContent('wleite')
        fireEvent.click(await screen.findByRole('button', { name: 'Download all' }))
        await waitFor(() => expect(window.URL.createObjectURL)
            .toHaveBeenCalledTimes(1))
        expect(mockedDownloadArtifact)
            .toHaveBeenCalledTimes(4)
        artifactIds.forEach(id => expect(mockedDownloadArtifact)
            .toHaveBeenCalledWith('completed-submission', id))
        const blob = (window.URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob
        expect(blob.type)
            .toBe('application/zip')
        const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (): void => resolve(reader.result as ArrayBuffer)
            reader.onerror = reject
            reader.readAsArrayBuffer(blob)
        })
        const files = unzipSync(new Uint8Array(bytes))
        expect(Object.keys(files)
            .sort())
            .toEqual(artifactIds.map(id => `${id}.txt`)
                .sort())
        artifactIds.forEach(id => expect(Array.from(files[`${id}.txt`]))
            .toEqual(Array.from(id)
                .map(character => character.charCodeAt(0))))
        expect((HTMLAnchorElement.prototype.click as jest.Mock).mock.instances[0].download)
            .toBe('submission-artifacts-completed-submission.zip')
        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
        expect(onClose)
            .toHaveBeenCalledTimes(1)
    })

    it('reports bulk download failure without saving a partial archive and allows retry', async () => {
        mockedGetArtifacts.mockResolvedValue(['example', 'system-internal'])
        mockedDownloadArtifact.mockRejectedValueOnce(new Error('Artifact unavailable'))
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <SubmissionArtifactsModal
                    allowInternalArtifacts
                    completed
                    onClose={jest.fn()}
                    open
                    submissionId='submission-id'
                />
            </SWRConfig>,
        )
        fireEvent.click(await screen.findByRole('button', { name: 'Download all' }))
        await waitFor(() => expect(toast.error)
            .toHaveBeenCalledWith('Artifact unavailable'))
        expect(window.URL.createObjectURL).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Download all' }))
            .toBeEnabled()
        fireEvent.click(screen.getByRole('button', { name: 'Download all' }))
        await waitFor(() => expect(window.URL.createObjectURL)
            .toHaveBeenCalledTimes(1))
    })

    it.each([[], undefined])('keeps Close available for empty or failed artifact lists: %s', async artifacts => {
        if (artifacts) mockedGetArtifacts.mockResolvedValue(artifacts)
        else mockedGetArtifacts.mockRejectedValue(new Error('Unavailable'))
        render(
            <SWRConfig value={{ provider: () => new Map() }}>
                <SubmissionArtifactsModal completed onClose={jest.fn()} open submissionId='submission-id' />
            </SWRConfig>,
        )
        await screen.findByText(artifacts
            ? 'No submission artifacts are available.' : 'Unable to load submission artifacts.')
        expect(screen.getByRole('button', { name: 'Close' }))
            .toBeEnabled()
        expect(screen.queryByRole('button', { name: 'Download all' })).not.toBeInTheDocument()
    })

})
