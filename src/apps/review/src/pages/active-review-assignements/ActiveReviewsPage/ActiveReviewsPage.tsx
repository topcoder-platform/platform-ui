/**
 * Active Reviews Page.
 */
import { ChangeEvent, FC, useEffect, useState } from 'react'
import classNames from 'classnames'

import {
    useFetchActiveReviews,
    useFetchActiveReviewsProps,
} from '../../../lib/hooks'
import { CHALLENGE_TYPE_SELECT_OPTIONS } from '../../../config/index.config'
import {
    FieldSelect,
    PageWrapper,
    TableActiveReviews,
    TableNoRecord,
} from '../../../lib'

import styles from './ActiveReviewsPage.module.scss'

interface Props {
    className?: string
}

export const ActiveReviewsPage: FC<Props> = (props: Props) => {
    const [challengeType, setChallengeType] = useState('')
    const { activeReviews, loadActiveReviews }: useFetchActiveReviewsProps
        = useFetchActiveReviews()

    useEffect(() => {
        loadActiveReviews(challengeType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challengeType])

    return (
        <PageWrapper
            pageTitle='Active Reviews'
            className={classNames(styles.container, props.className)}
        >
            <FieldSelect
                name='challengeType'
                label='Challenge type'
                placeholder='Select'
                options={CHALLENGE_TYPE_SELECT_OPTIONS}
                value={challengeType}
                onChange={function onChange(
                    event: ChangeEvent<HTMLInputElement>,
                ) {
                    setChallengeType(event.target.value)
                }}
                classNameWrapper={styles.fieldSelect}
            />

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
