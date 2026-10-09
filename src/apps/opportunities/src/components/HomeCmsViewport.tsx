import { FC } from 'react'
import classNames from 'classnames'

import { CmsMarkdown } from '~/libs/cms'

import { useHomeCmsViewport } from '../hooks/use-home-cms-viewport'

import { HomeBannerSlider } from './HomeBannerSlider'
import styles from './HomeCmsViewport.module.scss'

/** Presentation of a CMS slot on the member home page. */
export type HomeCmsViewportVariant = 'banner' | 'sidebar'

interface HomeCmsViewportProps {
    /** Accessible name for the slot's region. */
    label: string
    /**
     * `banner` renders full-width images for the center column. `sidebar`
     * renders links as call-to-action buttons for the side columns.
     */
    variant: HomeCmsViewportVariant
    /** Retained Payload `default`-space viewport entry ID. */
    viewportId: string
}

/**
 * Renders one community-app dashboard CMS viewport on the member home page.
 *
 * Content stays editable in Payload CMS. Markdown blocks render through the
 * shared `CmsMarkdown` sanitizer (so authored inline styles are dropped and
 * the 2026 Opportunities styling applies instead) and `contentSlider` entries
 * render as a `HomeBannerSlider`. The banner slot shows a placeholder while it
 * loads. A slot with no renderable content, or whose CMS request fails,
 * renders nothing so the rest of the page remains usable.
 *
 * @param props viewport ID, presentation variant, and accessible label.
 * @returns the CMS-authored content for this slot, or nothing.
 * @throws Does not throw; CMS errors collapse the slot.
 */
export const HomeCmsViewport: FC<HomeCmsViewportProps> = (props: HomeCmsViewportProps) => {
    const viewport = useHomeCmsViewport(props.viewportId)
    const contentClassName = classNames(styles.content, styles[props.variant])

    if (viewport.loading) {
        return props.variant === 'banner'
            ? <div aria-label={`Loading ${props.label}`} className={styles.placeholder} role='status' />
            : <></>
    }

    if (!viewport.blocks.length) {
        return <></>
    }

    return (
        <section aria-label={props.label} className={styles.viewport}>
            {viewport.blocks.map(block => (block.kind === 'slider' ? (
                <HomeBannerSlider
                    autoplay={block.autoplay}
                    contentClassName={contentClassName}
                    intervalMs={block.intervalMs}
                    key={block.id}
                    label={props.label}
                    slides={block.slides}
                />
            ) : (
                <CmsMarkdown className={contentClassName} key={block.id}>{block.text}</CmsMarkdown>
            )))}
        </section>
    )
}

export default HomeCmsViewport
