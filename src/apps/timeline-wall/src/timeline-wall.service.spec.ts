import { tokenGetAsync } from '~/libs/core'

import { approveEvent, createEvent, getEvents, rejectEvent } from './timeline-wall.service'

jest.mock('~/config', () => ({ EnvironmentConfig: { API: { V5: 'https://api.example.test/v5' } } }), { virtual: true })
jest.mock('~/libs/core', () => ({ tokenGetAsync: jest.fn() }), { virtual: true })

beforeEach(() => {
    jest.resetAllMocks()
    global.fetch = jest.fn()
        .mockResolvedValue({ ok: true, text: async () => '[]' })
    // Jest's DOM environment lacks Headers; the production browser supplies it.
    global.Headers = class {
        values: Record<string, string>

        constructor(values: Record<string, string> = {}) { this.values = values }

        set(key: string, value: string): void { this.values[key] = value }

        get(key: string): string { return this.values[key] }
    } as unknown as typeof Headers;
    (tokenGetAsync as jest.Mock).mockResolvedValue({ token: 'fresh-token' })
})

it('keeps public reads anonymous and sends multipart media with a fresh token', async () => {
    await getEvents()
    expect(tokenGetAsync).not.toHaveBeenCalled()
    const photo = new File(['photo'], 'memory.png', { type: 'image/png' })
    await createEvent({ description: 'Memory', eventDate: '2022-01-01', files: [photo], title: 'Event' })
    const [url, request] = (fetch as jest.Mock).mock.calls[1]
    expect(url)
        .toBe('https://api.example.test/v5/timeline-wall/timelineEvents')
    expect(request.method)
        .toBe('POST')
    expect(request.headers.get('Authorization'))
        .toBe('Bearer fresh-token')
    expect(request.headers.get('Content-Type'))
        .toBeUndefined()
    expect(request.body.get('title'))
        .toBe('Event')
    expect(request.body.getAll('mediaFiles'))
        .toEqual([photo])
})

it('rejects HTTP errors and never treats a forbidden moderation action as success', async () => {
    (fetch as jest.Mock).mockResolvedValue({ json: async () => ({ message: 'Forbidden' }), ok: false, status: 403 })
    await expect(approveEvent(7)).rejects.toThrow('Forbidden')
    await expect(rejectEvent(8, 'Duplicate Event', 'Already shared')).rejects.toThrow('Forbidden')
    const [url, request] = (fetch as jest.Mock).mock.calls[1]
    expect(url)
        .toContain('/8/reject')
    expect(JSON.parse(request.body))
        .toEqual({ note: 'Already shared', reason: 'Duplicate Event' })
})

it('does not send a protected request without a platform token', async () => {
    (tokenGetAsync as jest.Mock).mockResolvedValue({})
    await expect(approveEvent(7)).rejects.toThrow('Please sign in')
    expect(fetch).not.toHaveBeenCalled()
})
