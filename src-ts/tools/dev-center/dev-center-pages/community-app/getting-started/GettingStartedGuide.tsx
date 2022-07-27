import * as React from 'react'

import { Breadcrumb, ContentLayout } from '../../../../../lib'
import { BreadcrumbItemModel } from '../../../../../lib/breadcrumb/breadcrumb-item/breadcrumb-item.model'
import useMarkdown from '../../../dev-center-lib/hooks/useMarkdown'
import MarkdownDoc from '../../../dev-center-lib/MarkdownDoc'
import LayoutDocFooter from '../../../dev-center-lib/MarkdownDoc/LayoutDocFooter'
import LayoutDocHeader from '../../../dev-center-lib/MarkdownDoc/LayoutDocHeader'
import { toolTitle } from '../landing-page/DevCenterLandingPage'

import gettingStartedGuide from './GettingStartedGuide.md'
import styles from './GettingStartedGuide.module.scss'

export const GettingStartedGuide: React.FunctionComponent = () => {
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
      <LayoutDocFooter />
    </ContentLayout>
  )
}

export default GettingStartedGuide
