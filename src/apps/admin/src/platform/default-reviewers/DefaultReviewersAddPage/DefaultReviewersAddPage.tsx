import { FC } from 'react'
import classNames from 'classnames'

import { DefaultReviewersAddForm, PageWrapper } from '../../../lib'
import { useAutoScrollTopWhenInit } from '../../../lib/hooks'

import styles from './DefaultReviewersAddPage.module.scss'

export interface Props {
  className?: string
}

export const DefaultReviewersAddPage: FC<Props> = props => {
    useAutoScrollTopWhenInit()

    return (
        <PageWrapper
            pageTitle='New Default Reviewer'
            className={classNames(styles.container, props.className)}
        >
            <DefaultReviewersAddForm />
        </PageWrapper>
    )
}

export default DefaultReviewersAddPage
