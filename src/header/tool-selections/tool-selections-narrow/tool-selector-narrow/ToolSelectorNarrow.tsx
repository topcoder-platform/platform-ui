import { FC } from 'react'
import { Link } from 'react-router-dom'

import { ContentLayout } from '../../../../lib'
import { toolSelectors } from '../../config'

import styles from './ToolSelectorNarrow.module.scss'

const ToolSelectorNarrow: FC<{}> = () => {

    const toolSelectorElements: Array<JSX.Element> = toolSelectors
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
                        {/* TODO: create an svg file */}
                        <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M6 3.33329L10.6667 7.99996L6 12.6666' stroke='white' strokeWidth='1.13' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
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
