/* eslint-disable import/no-extraneous-dependencies */
import {
    act,
    fireEvent,
    render,
    RenderResult,
    screen,
} from '@testing-library/react'
import '@testing-library/jest-dom'

import { HomeBannerSlider } from './HomeBannerSlider'

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

const slides = [
    { id: 'nasa', kind: 'markdown' as const, text: 'NASA banner' },
    { id: 'airtm', kind: 'markdown' as const, text: 'Airtm banner' },
    { id: 'academy', kind: 'markdown' as const, text: 'Academy banner' },
]

/**
 * Reads the visible slide's CMS text.
 *
 * @returns text of the slide that is not hidden from assistive technology, if any.
 */
function visibleSlide(): string | undefined {
    return screen.getAllByRole('group', { hidden: true })
        .find(slide => slide.getAttribute('aria-hidden') === 'false')?.textContent ?? undefined
}

describe('HomeBannerSlider', () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders one slide without carousel controls', () => {
        render(<HomeBannerSlider autoplay intervalMs={5000} label='Featured' slides={slides.slice(0, 1)} />)

        expect(screen.getByRole('region', { name: 'Featured' }))
            .toHaveAttribute('aria-roledescription', 'carousel')
        expect(visibleSlide())
            .toBe('NASA banner')
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('moves between slides with previous, next, and dot controls', () => {
        render(<HomeBannerSlider autoplay={false} intervalMs={5000} label='Featured' slides={slides} />)

        expect(visibleSlide())
            .toBe('NASA banner')
        fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
        expect(visibleSlide())
            .toBe('Academy banner')
        fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
        expect(visibleSlide())
            .toBe('NASA banner')
        fireEvent.click(screen.getByRole('button', { name: 'Show slide 2 of 3' }))
        expect(visibleSlide())
            .toBe('Airtm banner')
        expect(screen.getByRole('button', { name: 'Show slide 2 of 3' }))
            .toHaveAttribute('aria-current', 'true')
    })

    it('auto-advances at the authored interval and pauses while hovered', () => {
        jest.useFakeTimers()
        render(<HomeBannerSlider autoplay intervalMs={5000} label='Featured' slides={slides} />)

        act(() => {
            jest.advanceTimersByTime(5000)
        })
        expect(visibleSlide())
            .toBe('Airtm banner')

        fireEvent.mouseEnter(screen.getByRole('region', { name: 'Featured' }))
        act(() => {
            jest.advanceTimersByTime(15000)
        })
        expect(visibleSlide())
            .toBe('Airtm banner')

        fireEvent.mouseLeave(screen.getByRole('region', { name: 'Featured' }))
        act(() => {
            jest.advanceTimersByTime(5000)
        })
        expect(visibleSlide())
            .toBe('Academy banner')
        act(() => {
            jest.advanceTimersByTime(5000)
        })
        expect(visibleSlide())
            .toBe('NASA banner')
    })

    it('does not auto-advance when autoplay is off or reduced motion is requested', () => {
        jest.useFakeTimers()
        const { unmount }: RenderResult = render(
            <HomeBannerSlider autoplay={false} intervalMs={5000} label='Featured' slides={slides} />,
        )
        act(() => {
            jest.advanceTimersByTime(20000)
        })
        expect(visibleSlide())
            .toBe('NASA banner')
        unmount()

        const matchMedia = window.matchMedia
        window.matchMedia = jest.fn()
            .mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
        try {
            render(<HomeBannerSlider autoplay intervalMs={5000} label='Featured' slides={slides} />)
            act(() => {
                jest.advanceTimersByTime(20000)
            })
            expect(visibleSlide())
                .toBe('NASA banner')
        } finally {
            window.matchMedia = matchMedia
        }
    })

    it('renders nothing without slides', () => {
        const { container }: RenderResult = render(
            <HomeBannerSlider autoplay intervalMs={5000} label='Featured' slides={[]} />,
        )

        expect(container)
            .toBeEmptyDOMElement()
    })
})
