import { FC } from 'react'

import { PageTitle as RootPageTitle } from '../../../../lib'

interface PageTitleProps {
    children: string
}

const PageTitle: FC<PageTitleProps> = (props: PageTitleProps) => (
    <RootPageTitle>
        {`${props.children} - Topcoder Academy`}
    </RootPageTitle>
)

export default PageTitle
