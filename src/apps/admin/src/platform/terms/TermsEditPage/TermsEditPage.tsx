/**
 * Terms Edit Page.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { PageWrapper, TermsAddForm } from '../../../lib'
import { useAutoScrollTopWhenInit } from '../../../lib/hooks'

import styles from './TermsEditPage.module.scss'

interface Props {
    className?: string
}

export const TermsEditPage: FC<Props> = (props: Props) => {
    useAutoScrollTopWhenInit()

    return (
        <PageWrapper
            pageTitle='Edit Terms of Use'
            className={classNames(styles.container, props.className)}
        >
            <TermsAddForm />
        </PageWrapper>
    )
}

export default TermsEditPage
