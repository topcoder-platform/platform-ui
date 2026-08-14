/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    createSupportTicket,
    getActiveMemberChallenges,
} from '../../services'

import { OpenSupportRequestModal } from './OpenSupportRequestModal'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({ profile: { userId: 12345 } }),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
        size?: string
        title?: string
    }): JSX.Element => (props.open ? (
        <div data-size={props.size} role='dialog'>
            <h2>{props.title}</h2>
            {props.children}
            {props.buttons}
        </div>
    ) : <></>),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

interface MockChallengeOption {
    label: string
    value: string
}

jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: {
        inputId?: string
        isDisabled?: boolean
        onChange: (option: MockChallengeOption | undefined) => void
        options: MockChallengeOption[]
        placeholder?: string
        value?: MockChallengeOption
    }): JSX.Element => {
        function handleChange(event: { target: { value: string } }): void {
            props.onChange(
                props.options.find(option => option.value === event.target.value),
            )
        }

        return (
            <select
                disabled={props.isDisabled}
                id={props.inputId}
                onChange={handleChange}
                value={props.value?.value || ''}
            >
                <option value=''>{props.placeholder}</option>
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        )
    },
}))

jest.mock('../SupportMarkdownEditor', () => ({
    SupportMarkdownEditor: (props: {
        disabled?: boolean
        label: string
        onChange: (value: string) => void
        value: string
    }): JSX.Element => (
        <label>
            {props.label}
            <textarea
                disabled={props.disabled}
                onChange={event => props.onChange(event.target.value)}
                value={props.value}
            />
        </label>
    ),
}))

jest.mock('../../services', () => ({
    createSupportTicket: jest.fn(),
    getActiveMemberChallenges: jest.fn(),
}))

jest.mock('../../utils', () => ({
    getSupportErrorMessage: jest.fn((_error: unknown, fallback: string) => fallback),
}))

const mockedCreateTicket = createSupportTicket as jest.Mock
const mockedGetActiveChallenges = getActiveMemberChallenges as jest.Mock

describe('OpenSupportRequestModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockReturnValue({
            data: [
                { id: 'challenge-1', name: 'First active challenge' },
                { id: 'challenge-2', name: 'Second active challenge' },
            ],
            error: undefined,
            isValidating: false,
        })
        mockedGetActiveChallenges.mockResolvedValue([])
        mockedCreateTicket.mockResolvedValue({ id: 'ticket-1' })
    })

    it('uses a wide modal and sends the selected active challenge identifier', async () => {
        const onCreated = jest.fn()
        render(
            <OpenSupportRequestModal
                onClose={jest.fn()}
                onCreated={onCreated}
                open
            />,
        )

        expect(screen.getByRole('dialog')
            .getAttribute('data-size'))
            .toBe('body')
        const challengeSelect = screen.getByLabelText('Active Challenge (if applicable)') as HTMLSelectElement
        expect(challengeSelect.options[0].text)
            .toBe('Select challenge')
        expect(mockUseSWR.mock.calls[0][0])
            .toBe('support-active-challenges:12345')

        const challengeFetcher = mockUseSWR.mock.calls[0][1] as () => Promise<unknown>
        await challengeFetcher()
        expect(mockedGetActiveChallenges)
            .toHaveBeenCalledWith('12345')

        fireEvent.change(screen.getByLabelText('Active Challenge (if applicable)'), {
            target: { value: 'challenge-2' },
        })
        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: ' Need help ' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Open support request' }))

        await waitFor(() => {
            expect(mockedCreateTicket)
                .toHaveBeenCalledWith({
                    challengeId: 'challenge-2',
                    description: 'Need help',
                })
        })
        await waitFor(() => {
            expect(onCreated)
                .toHaveBeenCalledWith({ id: 'ticket-1' })
        })
    })

    it('keeps the optional challenge out of the create payload when none is selected', async () => {
        const onCreated = jest.fn()
        render(
            <OpenSupportRequestModal
                onClose={jest.fn()}
                onCreated={onCreated}
                open
            />,
        )

        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'General help' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Open support request' }))

        await waitFor(() => {
            expect(mockedCreateTicket)
                .toHaveBeenCalledWith({ description: 'General help' })
            expect(onCreated)
                .toHaveBeenCalledWith({ id: 'ticket-1' })
        })
    })

    it('does not submit a stale challenge after the available options refresh', async () => {
        const onCreated = jest.fn()
        const rendered = render(
            <OpenSupportRequestModal
                onClose={jest.fn()}
                onCreated={onCreated}
                open
            />,
        )

        fireEvent.change(screen.getByLabelText('Active Challenge (if applicable)'), {
            target: { value: 'challenge-2' },
        })
        mockUseSWR.mockReturnValue({
            data: [],
            error: undefined,
            isValidating: false,
        })
        rendered.rerender(
            <OpenSupportRequestModal
                onClose={jest.fn()}
                onCreated={onCreated}
                open
            />,
        )

        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: 'General help after refresh' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Open support request' }))

        await waitFor(() => {
            expect(mockedCreateTicket)
                .toHaveBeenCalledWith({ description: 'General help after refresh' })
            expect(onCreated)
                .toHaveBeenCalledWith({ id: 'ticket-1' })
        })
    })
})
