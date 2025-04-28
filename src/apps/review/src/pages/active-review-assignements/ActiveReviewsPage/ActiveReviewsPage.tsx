/**
 * Active Reviews Page.
 */
import { FC, useEffect, useMemo, useState } from 'react'
import { toString } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { SelectOption } from '~/apps/admin/src/lib/models'

import {
    useFetchActiveReviews,
    useFetchActiveReviewsProps,
} from '../../../lib/hooks'
import { CHALLENGE_TYPE_SELECT_OPTIONS } from '../../../config/index.config'
import { PageWrapper, TableActiveReviews, TableNoRecord } from '../../../lib'

import styles from './ActiveReviewsPage.module.scss'

interface Props {
    className?: string
}

export const ActiveReviewsPage: FC<Props> = (props: Props) => {
    const [challengeType, setChallengeType] = useState<
        SingleValue<SelectOption>
    >(CHALLENGE_TYPE_SELECT_OPTIONS[0])
    const { activeReviews, loadActiveReviews }: useFetchActiveReviewsProps
        = useFetchActiveReviews()

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'My Active Challenges' }],
        [],
    )

    useEffect(() => {
        if (challengeType) {
            loadActiveReviews(toString(challengeType.label))
        }
    }, [challengeType, loadActiveReviews])

    return (
        <PageWrapper
            pageTitle='My Active Challenges'
            className={classNames(styles.container, props.className)}
            breadCrumb={breadCrumb}
        >
            <div className={styles['filter-bar']}>
                <label>Challenge type</label>
                <Select
                    className='react-select-container'
                    classNamePrefix='select'
                    options={CHALLENGE_TYPE_SELECT_OPTIONS}
                    defaultValue={challengeType}
                    onChange={setChallengeType}
                />
            </div>

            {activeReviews.length === 0 ? (
                <TableNoRecord className={styles.blockTable} />
            ) : (
                <TableActiveReviews
                    datas={activeReviews}
                    className={styles.blockTable}
                />
            )}
        </PageWrapper>
    )
}

export default ActiveReviewsPage
