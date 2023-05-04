import * as React from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '~/libs/ui'

import { toolTitle } from '../../../dev-center.routes'
import { LayoutDocHeader, MarkdownDoc } from '../../../dev-center-lib/MarkdownDoc'
import useMarkdown from '../../../dev-center-lib/hooks/useMarkdown'

import storybookMarkdown from './Storybook.md'
import styles from './Storybook.module.scss'

export const Storybook: React.FC = () => {
    const { doc, toc, title }: ReturnType<typeof useMarkdown> = useMarkdown({ uri: storybookMarkdown })
    const breadcrumb: Array<BreadcrumbItemModel> = React.useMemo(() => [
        { name: toolTitle, url: '/dev-center' },
        { name: title, url: '#' },
    ], [title])

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
        >

            <Breadcrumb items={breadcrumb} />
            <LayoutDocHeader title={title} subtitle='Platform UI Storybook' />
            <MarkdownDoc doc={doc} toc={toc} />
        </ContentLayout>
    )
}

export default Storybook
