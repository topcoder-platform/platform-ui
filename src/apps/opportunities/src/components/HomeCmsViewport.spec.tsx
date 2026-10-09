/* eslint-disable import/no-extraneous-dependencies */
import { render, RenderResult, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { useHomeCmsViewport } from '../hooks/use-home-cms-viewport'

import { HomeCmsViewport } from './HomeCmsViewport'

jest.mock('../hooks/use-home-cms-viewport', () => ({
    useHomeCmsViewport: jest.fn(),
}))

jest.mock('~/libs/cms', () => ({
    CmsMarkdown: (props: { children: string; className?: string }) => (
        <div className={props.className} data-testid='cms-markdown'>{props.children}</div>
    ),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

const mockedUseHomeCmsViewport = useHomeCmsViewport as jest.MockedFunction<typeof useHomeCmsViewport>

describe('HomeCmsViewport', () => {
    beforeEach(() => jest.clearAllMocks())

    it('shows a placeholder only for the loading banner slot', () => {
        mockedUseHomeCmsViewport.mockReturnValue({ blocks: [], loading: true })

        const { container, rerender }: RenderResult = render(
            <HomeCmsViewport label='Featured announcements' variant='banner' viewportId='banner-id' />,
        )

        expect(screen.getByRole('status', { name: 'Loading Featured announcements' }))
            .toBeInTheDocument()
        expect(mockedUseHomeCmsViewport)
            .toHaveBeenCalledWith('banner-id')

        rerender(<HomeCmsViewport label='Community' variant='sidebar' viewportId='sidebar-id' />)
        expect(container)
            .toBeEmptyDOMElement()
    })

    it('collapses a slot whose content is empty or failed to load', () => {
        mockedUseHomeCmsViewport.mockReturnValue({
            blocks: [],
            error: new Error('Payload CMS request failed with status 500.') as never,
            loading: false,
        })

        const { container }: RenderResult = render(
            <HomeCmsViewport label='Featured announcements' variant='banner' viewportId='banner-id' />,
        )

        expect(container)
            .toBeEmptyDOMElement()
    })

    it('renders Markdown blocks and sliders with the slot variant styling', () => {
        mockedUseHomeCmsViewport.mockReturnValue({
            blocks: [
                {
                    autoplay: true,
                    id: 'slider',
                    intervalMs: 5000,
                    kind: 'slider',
                    slides: [
                        { id: 'one', kind: 'markdown', text: 'First banner' },
                        { id: 'two', kind: 'markdown', text: 'Second banner' },
                    ],
                },
                { id: 'discord', kind: 'markdown', text: 'Join us on Discord' },
            ],
            loading: false,
        })

        render(<HomeCmsViewport label='Community' variant='sidebar' viewportId='sidebar-id' />)

        const region = screen.getAllByRole('region', { name: 'Community' })
        expect(region)
            .toHaveLength(2)
        expect(screen.getAllByTestId('cms-markdown')
            .map(block => block.textContent))
            .toEqual(['First banner', 'Second banner', 'Join us on Discord'])
        expect(screen.getByText('Join us on Discord'))
            .toHaveClass('content', 'sidebar')
        expect(screen.getByRole('button', { name: 'Next slide' }))
            .toBeInTheDocument()
    })
})
