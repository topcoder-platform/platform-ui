import { FC } from 'react'
import classNames from 'classnames'

import { DefaultReviewersAddForm, PageWrapper } from '../../../lib'
import { useAutoScrollTopWhenInit } from '../../../lib/hooks'

import styles from './DefaultReviewersEditPage.module.scss'

export interface Props {
  className?: string
}

export const DefaultReviewersEditPage: FC<Props> = props => {
    useAutoScrollTopWhenInit()

    return (
        <PageWrapper
            pageTitle='Edit Default Reviewer'
            className={classNames(styles.container, props.className)}
        >
            <DefaultReviewersAddForm />
        </PageWrapper>
    )
}

export default DefaultReviewersEditPage
