import { FC } from 'react'
import { Link } from 'react-router-dom'

import { ChevronRightIcon, ContentLayout } from '../../../../lib'
import { toolSelectorsRoutes } from '../../tool-selectors-routes.config'

import styles from './ToolSelectorNarrow.module.scss'

const ToolSelectorNarrow: FC<{}> = () => {

    const toolSelectorElements: Array<JSX.Element> = toolSelectorsRoutes
        .map(toolSelector => {
            return (
                <Link
                    className={styles['tool-selector-narrow-link']}
                    key={toolSelector.route}
                    to={toolSelector.route}
                >
                    <div>
                        {toolSelector.title}
                    </div>
                    <div>
                        <ChevronRightIcon />
                    </div>
                </Link>
            )
        })
    return (
        <ContentLayout classNames='bg-black-100'>
            <span className={styles['tool-selector-narrow']}>
                {toolSelectorElements}
            </span>
        </ContentLayout>
    )
}

export default ToolSelectorNarrow
