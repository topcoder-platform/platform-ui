import { FC } from 'react'
import { Helmet } from 'react-helmet'

interface PageTitleProps {
    children: string
}

const PageTitle: FC<PageTitleProps> = (props: PageTitleProps) => (
    <Helmet>
        <title>{props.children}</title>
    </Helmet>
)

export default PageTitle
