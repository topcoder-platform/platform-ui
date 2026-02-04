import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { PageWrapper } from '../../../lib'

import styles from './TalentSearchPage.module.scss'

export const TalentSearchPage: FC = () => {
    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Talent Search' }],
        [],
    )
    return (
        <PageWrapper
            pageTitle='Talent Search'
            className={classNames(styles.container)}
            breadCrumb={breadCrumb}
        >
            <div />
        </PageWrapper>
    )
}

export default TalentSearchPage
