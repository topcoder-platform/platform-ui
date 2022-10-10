import * as React from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../../lib'
import useMarkdown from '../../../dev-center-lib/hooks/useMarkdown'
import MarkdownDoc from '../../../dev-center-lib/MarkdownDoc'
import LayoutDocHeader from '../../../dev-center-lib/MarkdownDoc/LayoutDocHeader'
import { toolTitle } from '../../../dev-center.routes'

import gettingStartedGuide from './GettingStartedGuide.md'
import styles from './GettingStartedGuide.module.scss'

export const GettingStartedGuide: React.FC = () => {
  const { doc, toc, title }: ReturnType<typeof useMarkdown> = useMarkdown({ uri: gettingStartedGuide })
  const breadcrumb: Array<BreadcrumbItemModel> = React.useMemo(() => [
    { name: toolTitle, url: '/dev-center' },
    { name: title, url: '#' },
  ], [title])

  return (
    <ContentLayout contentClass={styles['contentLayout']} outerClass={styles['contentLayout-outer']} innerClass={styles['contentLayout-inner']}>

      <Breadcrumb items={breadcrumb} />
      <LayoutDocHeader title={title} subtitle='Getting started Guide' />
      <MarkdownDoc doc={doc} toc={toc} />
    </ContentLayout>
  )
}

export default GettingStartedGuide
