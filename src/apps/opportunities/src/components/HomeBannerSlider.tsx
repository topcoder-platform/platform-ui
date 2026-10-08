/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useEffect,
    useState,
} from 'react'
import classNames from 'classnames'

import { CmsMarkdown } from '~/libs/cms'
import { IconOutline } from '~/libs/ui'

import type { HomeCmsMarkdownBlock } from '../utils/home.utils'

import styles from './HomeBannerSlider.module.scss'

interface HomeBannerSliderProps {
    /** Whether slides advance automatically (CMS `autoStart`). */
    autoplay: boolean
    /** Optional class applied to each slide's CMS Markdown wrapper. */
    contentClassName?: string
    /** Auto-advance interval in milliseconds (CMS `duration`). */
    intervalMs: number
    /** Accessible name for the carousel region. */
    label: string
    /** CMS Markdown slides in authored order. */
    slides: ReadonlyArray<HomeCmsMarkdownBlock>
}

/**
 * Reports whether the member asked the operating system to reduce motion.
 *
 * @returns true when `prefers-reduced-motion: reduce` matches.
 * @throws Does not throw; environments without `matchMedia` report false.
 */
function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Renders a CMS `contentSlider` as an accessible, auto-advancing banner carousel.
 *
 * Replaces community-app's nuka-carousel slider on the member home page. Slides
 * share one grid cell so the carousel keeps the height of its tallest slide.
 * Auto-advance pauses while the pointer or keyboard focus is inside the
 * carousel and is disabled when reduced motion is requested. Previous/next
 * buttons and slide dots appear only when there is more than one slide.
 *
 * @param props slides, autoplay settings, and accessible label.
 * @returns the banner carousel, or nothing when there are no slides.
 * @throws Does not throw.
 */
export const HomeBannerSlider: FC<HomeBannerSliderProps> = (props: HomeBannerSliderProps) => {
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const [reducedMotion] = useState(prefersReducedMotion)
    const count = props.slides.length
    const current = count ? active % count : 0
    const canAdvance = props.autoplay && count > 1 && !paused && !reducedMotion && props.intervalMs > 0

    useEffect(() => {
        if (!canAdvance) {
            return undefined
        }

        const timer = setTimeout(() => setActive(index => (index + 1) % count), props.intervalMs)
        return () => clearTimeout(timer)
    }, [canAdvance, count, current, props.intervalMs])

    if (!count) {
        return <></>
    }

    /**
     * Shows a slide, wrapping around at either end.
     *
     * @param index requested slide index, which may be -1 or `count`.
     * @returns void.
     * @throws Does not throw.
     */
    const show = (index: number): void => setActive((index + count) % count)

    return (
        <section
            aria-label={props.label}
            aria-roledescription='carousel'
            className={styles.slider}
            onBlur={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className={styles.track}>
                {props.slides.map((slide, index) => (
                    <div
                        aria-hidden={index !== current}
                        aria-label={`${index + 1} of ${count}`}
                        aria-roledescription='slide'
                        className={classNames(styles.slide, { [styles.activeSlide]: index === current })}
                        key={slide.id}
                        role='group'
                    >
                        <CmsMarkdown className={props.contentClassName}>{slide.text}</CmsMarkdown>
                    </div>
                ))}
            </div>
            {count > 1 && (
                <>
                    <button
                        aria-label='Previous slide'
                        className={classNames(styles.arrow, styles.previous)}
                        onClick={() => show(current - 1)}
                        type='button'
                    >
                        <IconOutline.ChevronLeftIcon aria-hidden='true' />
                    </button>
                    <button
                        aria-label='Next slide'
                        className={classNames(styles.arrow, styles.next)}
                        onClick={() => show(current + 1)}
                        type='button'
                    >
                        <IconOutline.ChevronRightIcon aria-hidden='true' />
                    </button>
                    <div className={styles.dots}>
                        {props.slides.map((slide, index) => (
                            <button
                                aria-current={index === current ? 'true' : undefined}
                                aria-label={`Show slide ${index + 1} of ${count}`}
                                className={classNames(styles.dot, { [styles.activeDot]: index === current })}
                                key={slide.id}
                                onClick={() => show(index)}
                                type='button'
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}

export default HomeBannerSlider
