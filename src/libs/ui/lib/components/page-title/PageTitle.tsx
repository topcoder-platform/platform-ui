import { FC } from 'react'
import { Helmet } from 'react-helmet'

interface PageTitleProps {
    children: string
}

const PageTitle: FC<PageTitleProps> = (props: PageTitleProps) => (
    // @ts-expect-error: TS2786: Helmet cannot be used as a JSX component
    <Helmet>
        <title>{props.children}</title>
    </Helmet>
)

export default PageTitle
