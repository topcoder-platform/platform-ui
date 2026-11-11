/* eslint-disable max-len, import/no-extraneous-dependencies */
import { createContext } from 'react'

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { profileContext } from '~/libs/core'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import * as service from './timeline-wall.service'
import { TimelineEvent } from './timeline-wall.models'
import TimelineWall from './TimelineWall'

jest.mock('~/libs/core', () => {
    const React = jest.requireActual('react')
    return {
        authUrlLogin: () => '/login',
        authUrlSignup: () => '/signup',
        profileContext: React.createContext({ isLoggedIn: false }),
    }
}, { virtual: true })
jest.mock('~/config', () => ({ EnvironmentConfig: { API: { V5: 'https://api.example.test/v5' }, USER_PROFILE_URL: 'https://profiles.topcoder-dev.com' } }), { virtual: true })
jest.mock('./timeline-wall.service')

const event: TimelineEvent = {
    createdBy: 'member',
    createdDate: '2022-11-01T12:00:00Z',
    description: 'A memory from the community',
    eventDate: '2022-10-01T12:00:00Z',
    id: 1,
    mediaFiles: [
        { previewUrl: 'https://example.com/movie.mp4', url: 'https://example.com/movie.mp4' },
        { url: 'https://example.com/photo.jpg' },
    ],
    title: 'Community event',
}
const api = service as jest.Mocked<typeof service>
const Profile = profileContext as unknown as ReturnType<typeof createContext<{ isLoggedIn: boolean; profile?: { handle: string } }>>

beforeEach(() => {
    jest.resetAllMocks()
    api.getEvents.mockResolvedValue([event])
    api.getAvatar.mockResolvedValue('')
    api.getCurrentUser.mockResolvedValue({ isAdmin: false })
    api.getPendingEvents.mockResolvedValue([{ ...event, id: 2, title: 'Pending memory' }])
    api.errorMessage.mockImplementation(error => (error as Error).message)
    URL.createObjectURL = jest.fn(() => 'blob:preview')
    URL.revokeObjectURL = jest.fn()
    Element.prototype.scrollIntoView = jest.fn()
    window.scrollTo = jest.fn()
})

it('allows anonymous browsing, date navigation, and original video/photo viewing', async () => {
    render(<TimelineWall />)
    await screen.findByText('Community event')
    expect(document.querySelector('.timeline-media-strip video'))
        .toHaveAttribute('src', 'https://example.com/movie.mp4')
    expect(api.getCurrentUser).not.toHaveBeenCalled()
    expect(screen.queryByText(/Pending Approvals/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'login' }))
        .toHaveAttribute('href', '/login')
    fireEvent.click(screen.getByRole('button', { exact: true, name: '2022' }))
    expect(Element.prototype.scrollIntoView)
        .toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'View video 1 for Community event' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('video'))
        .toHaveAttribute('src', 'https://example.com/movie.mp4')
    fireEvent.click(within(dialog)
        .getByRole('button', { name: 'Next' }))
    expect(within(dialog)
        .getByRole('img'))
        .toHaveAttribute('src', 'https://example.com/photo.jpg')
})

it('preserves the draft after failed upload and confirms a member submission for review', async () => {
    const user = userEvent.setup()
    api.createEvent.mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(undefined)
    render(<Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'member' } }}><TimelineWall /></Profile.Provider>)
    await user.click(screen.getByRole('button', { name: /What event/ }))
    await user.type(screen.getByLabelText('Event name'), 'My memory')
    fireEvent.change(screen.getByLabelText('Event Date'), { target: { value: '2022-10-01' } })
    await user.type(screen.getByLabelText('Description'), 'Description of the event')
    const file = new File(['photo'], 'photo.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Upload photos or videos'), file)
    await user.click(screen.getByRole('button', { name: 'Share event' }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText('Event name'))
        .toHaveValue('My memory')
    await user.click(screen.getByRole('button', { name: 'Share event' }))
    await screen.findByText(/Your event was submitted for review/)
    expect(api.createEvent)
        .toHaveBeenLastCalledWith({ description: 'Description of the event', eventDate: '2022-10-01', files: [file], title: 'My memory' })
})

it('loads server-authorized moderation, refreshes both lists after approval, and removes admin UI at logout', async () => {
    api.getCurrentUser.mockResolvedValue({ isAdmin: true })
    api.approveEvent.mockResolvedValue(undefined)
    const view = render(<Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'admin' } }}><TimelineWall /></Profile.Provider>)
    const tab = await screen.findByRole('button', { name: 'Pending Approvals (1)' })
    fireEvent.click(tab)
    await screen.findByText('Pending memory')
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(api.approveEvent)
        .toHaveBeenCalledWith(2))
    await waitFor(() => expect(api.getEvents)
        .toHaveBeenCalledTimes(2))
    view.rerender(<Profile.Provider value={{ isLoggedIn: false }}><TimelineWall /></Profile.Provider>)
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByText('Pending memory')).not.toBeInTheDocument()
})

it('requires rejection reason and note and keeps a failed moderation dialog open', async () => {
    api.getCurrentUser.mockResolvedValue({ isAdmin: true })
    api.rejectEvent.mockRejectedValueOnce(new Error('Forbidden'))
        .mockResolvedValueOnce(undefined)
    render(<Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'admin' } }}><TimelineWall /></Profile.Provider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Pending Approvals (1)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    const dialog = await screen.findByRole('dialog')
    const submit = within(dialog)
        .getByRole('button', { name: 'Reject' })
    expect(submit)
        .toBeDisabled()
    fireEvent.change(within(dialog)
        .getByLabelText('Rejection Reason'), { target: { value: 'Duplicate Event' } })
    fireEvent.change(within(dialog)
        .getByLabelText('Note'), { target: { value: 'Already shared' } })
    fireEvent.click(submit)
    await within(dialog)
        .findByText('Forbidden')
    expect(api.rejectEvent)
        .toHaveBeenCalledWith(2, 'Duplicate Event', 'Already shared')
    fireEvent.click(submit)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('requires confirmation before deleting an event', async () => {
    api.getCurrentUser.mockResolvedValue({ isAdmin: true })
    api.deleteEvent.mockResolvedValue(undefined)
    render(<Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'admin' } }}><TimelineWall /></Profile.Provider>)
    fireEvent.click(await screen.findByRole('button', { exact: true, name: 'Delete' }))
    expect(api.deleteEvent).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('dialog'))
        .getByRole('button', { exact: true, name: 'Delete' }))
    await waitFor(() => expect(api.deleteEvent)
        .toHaveBeenCalledWith(1))
})

it('ignores a delayed administrator lookup after signing out', async () => {
    let resolveUser: (value: { isAdmin: boolean }) => void = () => undefined
    api.getCurrentUser.mockReturnValue(new Promise(resolve => { resolveUser = resolve }))
    const view = render(
        <Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'admin' } }}>
            <TimelineWall />
        </Profile.Provider>,
    )
    await screen.findByText('Community event')
    view.rerender(<Profile.Provider value={{ isLoggedIn: false }}><TimelineWall /></Profile.Provider>)
    await act(async () => { resolveUser({ isAdmin: true }) })
    expect(screen.queryByText(/Pending Approvals/)).not.toBeInTheDocument()
    expect(api.getPendingEvents).not.toHaveBeenCalled()
})

it('rejects more than three media attachments before submitting', async () => {
    const user = userEvent.setup()
    render(
        <Profile.Provider value={{ isLoggedIn: true, profile: { handle: 'member' } }}>
            <TimelineWall />
        </Profile.Provider>,
    )
    await user.click(screen.getByRole('button', { name: /What event/ }))
    const files = [1, 2, 3, 4].map(index => new File(['photo'], `photo-${index}.png`, { type: 'image/png' }))
    await user.upload(screen.getByLabelText('Upload photos or videos'), files)
    expect(await screen.findByRole('alert'))
        .toHaveTextContent('Upload up to 3')
    expect(api.createEvent).not.toHaveBeenCalled()
})
