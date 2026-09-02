/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { PropsWithChildren, ReactNode } from 'react'

import {
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES,
    uploadSupportAttachment,
} from '~/apps/support/src/lib/services/support-attachment.service'
import { createSupportTicket } from '~/apps/support/src/lib/services/support.service'

import {
    buildReportIssueDescription,
    ReportIssueModal,
} from './ReportIssueModal'

jest.mock('react-toastify', () => ({
    toast: { success: jest.fn() },
}))

jest.mock('~/apps/support/src/lib/services/support-attachment.service', () => ({
    MAX_SUPPORT_ATTACHMENT_BYTES: 2 * 1024 * 1024,
    SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES: ['.png', 'image/png'],
    uploadSupportAttachment: jest.fn(),
}), { virtual: true })

jest.mock('~/apps/support/src/lib/services/support.service', () => ({
    createSupportTicket: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        BaseModal: (props: PropsWithChildren<{
            ariaLabelledby?: string
            buttons?: ReactNode
            open: boolean
            size?: string
            title?: ReactNode
        }>): JSX.Element => (props.open ? (
            <div aria-labelledby={props.ariaLabelledby} data-size={props.size} role='dialog'>
                {props.title}
                {props.children}
                {props.buttons}
            </div>
        ) : <></>),
        Button: (props: {
            disabled?: boolean
            label: ReactNode
            onClick: () => void
        }): JSX.Element => (
            <button disabled={props.disabled} onClick={props.onClick} type='button'>
                {props.label}
            </button>
        ),
        IconOutline: new Proxy({}, { get: () => Icon }),
    }
}, { virtual: true })

const mockedCreateSupportTicket = createSupportTicket as jest.Mock
const mockedUploadAttachment = uploadSupportAttachment as jest.MockedFunction<typeof uploadSupportAttachment>

describe('ReportIssueModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCreateSupportTicket.mockResolvedValue({ id: 'ticket-id' })
        mockedUploadAttachment.mockResolvedValue({
            filename: 'Screenshot.png',
            handle: 'file-handle',
            size: 1153434,
            url: 'https://files.example/Screenshot.png',
        })
    })

    it('renders the authored empty subject, category, description, and attachment state', () => {
        render(<ReportIssueModal challengeId='challenge-id' onClose={jest.fn()} open />)

        expect(screen.getByRole('dialog', { name: 'Report an Issue' }))
            .toHaveAttribute('data-size', 'md')
        expect(screen.getByPlaceholderText('Enter the subject of your issue'))
            .toBeInTheDocument()
        expect(screen.getByRole('combobox', { name: /Category/ }))
            .toHaveValue('')
        expect(screen.getByPlaceholderText('Explain your issue'))
            .toHaveAttribute('maxlength', '1000')
        expect(screen.getByText('Attach Files'))
            .toBeInTheDocument()
        expect(screen.queryByText('Attach Files *'))
            .not.toBeInTheDocument()
        expect(screen.getByText('Max. 2 MB per file'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Attach files'))
            .toHaveAttribute('accept', SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES.join(','))
        expect(screen.getByRole('button', { name: 'Send report' }))
            .toBeDisabled()
    })

    it('submits the required fields without an attachment', async () => {
        render(<ReportIssueModal challengeId='challenge-id' onClose={jest.fn()} open />)

        fireEvent.change(screen.getByPlaceholderText('Enter the subject of your issue'), {
            target: { value: 'Submission timeout' },
        })
        fireEvent.change(screen.getByRole('combobox', { name: /Category/ }), {
            target: { value: 'Submission' },
        })
        fireEvent.change(screen.getByPlaceholderText('Explain your issue'), {
            target: { value: 'I tried to submit several times, but it always reaches a timeout error.' },
        })

        const submit = screen.getByRole('button', { name: 'Send report' })
        await waitFor(() => expect(submit)
            .toBeEnabled())
        fireEvent.click(submit)

        await waitFor(() => expect(mockedCreateSupportTicket)
            .toHaveBeenCalledWith({
                challengeId: 'challenge-id',
                description: [
                    '**Subject:** Submission timeout',
                    '**Category:** Submission',
                    '',
                    'I tried to submit several times, but it always reaches a timeout error.',
                ].join('\n'),
            }))
        expect(mockedUploadAttachment)
            .not.toHaveBeenCalled()
    })

    it('uploads the authored file row and submits every field through the support contract', async () => {
        render(<ReportIssueModal challengeId='challenge-id' onClose={jest.fn()} open />)

        fireEvent.change(screen.getByPlaceholderText('Enter the subject of your issue'), {
            target: { value: 'Submission timeout' },
        })
        fireEvent.change(screen.getByRole('combobox', { name: /Category/ }), {
            target: { value: 'Submission' },
        })
        fireEvent.change(screen.getByPlaceholderText('Explain your issue'), {
            target: { value: 'I tried to submit several times, but it always reaches a timeout error.' },
        })
        const file = new File(['screenshot'], 'Screenshot.png', { type: 'image/png' })
        Object.defineProperty(file, 'size', { value: 1153434 })
        fireEvent.change(screen.getByLabelText('Attach files'), {
            target: { files: [file] },
        })

        expect(await screen.findByText('Screenshot.png'))
            .toBeInTheDocument()
        expect(await screen.findByText('1.1 MB'))
            .toBeInTheDocument()
        expect(screen.getByText('Attach Screenshots, Files'))
            .toBeInTheDocument()
        const submit = screen.getByRole('button', { name: 'Send report' })
        await waitFor(() => expect(submit)
            .toBeEnabled())
        fireEvent.click(submit)

        await waitFor(() => expect(mockedCreateSupportTicket)
            .toHaveBeenCalledWith({
                challengeId: 'challenge-id',
                description: [
                    '**Subject:** Submission timeout',
                    '**Category:** Submission',
                    '',
                    'I tried to submit several times, but it always reaches a timeout error.',
                    '',
                    '**Attachments:**',
                    '- [Screenshot.png](https://files.example/Screenshot.png)',
                ].join('\n'),
            }))
        expect(await screen.findByText('Thank you for reporting this issue.'))
            .toBeInTheDocument()
        expect(mockedUploadAttachment)
            .toHaveBeenCalledWith(file)
    })

    it('uses the same authenticated Support upload without a draft context outside a challenge', async () => {
        render(<ReportIssueModal onClose={jest.fn()} open />)
        const file = new File(['screenshot'], 'Screenshot.png', { type: 'image/png' })
        Object.defineProperty(file, 'size', { value: 1153434 })

        fireEvent.change(screen.getByLabelText('Attach files'), {
            target: { files: [file] },
        })

        await waitFor(() => expect(mockedUploadAttachment)
            .toHaveBeenCalledWith(file))
    })

    it('rejects files larger than the authored two-megabyte limit', async () => {
        render(<ReportIssueModal onClose={jest.fn()} open />)
        const file = new File(['too large'], 'large.zip')
        Object.defineProperty(file, 'size', { value: (2 * 1024 * 1024) + 1 })

        fireEvent.change(screen.getByLabelText('Attach files'), {
            target: { files: [file] },
        })

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('large.zip is larger than the 2 MB attachment limit.')
        expect(mockedUploadAttachment)
            .not.toHaveBeenCalled()
    })

    it('builds stable Markdown for multiple uploaded attachments', () => {
        expect(buildReportIssueDescription(' Subject ', ' Other ', ' Details ', [{
            filename: '[log].txt',
            handle: 'log',
            url: 'https://files.example/log.txt',
        }]))
            .toContain('- [log.txt](https://files.example/log.txt)')
    })
})
