/**
 * Terms Add Page.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { PageWrapper, TermsAddForm } from '../../../lib'
import { useAutoScrollTopWhenInit } from '../../../lib/hooks'

import styles from './TermsAddPage.module.scss'

interface Props {
    className?: string
}

export const TermsAddPage: FC<Props> = (props: Props) => {
    useAutoScrollTopWhenInit()

    return (
        <PageWrapper
            pageTitle='New Terms of Use'
            className={classNames(styles.container, props.className)}
        >
            <TermsAddForm />
        </PageWrapper>
    )
}

export default TermsAddPage
