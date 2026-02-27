import { FC, PropsWithChildren } from 'react'

import { AppFooter } from '~/apps/platform/src/components/app-footer'
import { AppHeader } from '~/apps/platform/src/components/app-header'
import { ContentLayout } from '~/libs/ui'

import styles from './Layout.module.scss'

export type LayoutVariant = 'standard' | 'community'

interface LayoutProps {
    variant?: LayoutVariant
}

/**
 * Passthrough layout used by routes that do not need additional wrappers.
 *
 * @param props Child content to render.
 * @returns The child content unchanged.
 */
export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

/**
 * Shared community app layout.
 *
 * @param props Layout variant and nested route content.
 * @returns The standard app shell/content layout or plain community children.
 */
export const Layout: FC<PropsWithChildren<LayoutProps>> = props => {
    const variant: LayoutVariant = props.variant ?? 'standard'

    if (variant === 'community') {
        return <>{props.children}</>
    }

    return (
        <>
            <AppHeader navType='community' />
            <ContentLayout
                innerClass={styles.contentLayoutInner}
                outerClass={styles.contentLayoutOuter}
            >
                <div className={styles.standardLayout}>{props.children}</div>
            </ContentLayout>
            <AppFooter />
        </>
    )
}

export default Layout
