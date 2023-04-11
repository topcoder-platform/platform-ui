import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { Button, ButtonProps } from '../button'

import styles from './ContentLayout.module.scss'

export interface ContentLayoutProps {
    buttonConfig?: ButtonProps
    children?: ReactNode
    contentClass?: string
    innerClass?: string
    outerClass?: string
    title?: string
    titleClass?: string
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => (
    <div className={classNames(styles.content, props.contentClass)}>

        <div className={classNames(styles['content-outer'], props.outerClass)}>

            <div className={classNames(styles['content-inner'], props.innerClass)}>

                {!!props.title && (
                    <div className={classNames(styles['page-header'], props.titleClass)}>

                        <h1>
                            {props.title}
                        </h1>

                        {!!props.buttonConfig && (
                            <div>
                                <Button
                                    {...props.buttonConfig}
                                    buttonStyle='primary'
                                    size='lg'
                                />
                            </div>
                        )}

                    </div>
                )}

                {props.children}

            </div>

        </div>

    </div>
)

export default ContentLayout
