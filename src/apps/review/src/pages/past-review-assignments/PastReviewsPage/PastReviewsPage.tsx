/**
 * Past Reviews Page.
 */
import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { forEach } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    useFetchChallengeTracks,
    useFetchChallengeTracksProps,
    useFetchChallengeTypes,
    useFetchChallengeTypesProps,
    useFetchPastReviews,
    useFetchPastReviewsProps,
} from '../../../lib/hooks'
import { ReviewAppContextModel } from '../../../lib/models'
import { CHALLENGE_TYPE_SELECT_ALL_OPTION } from '../../../config/index.config'
import {
    PageWrapper,
    ReviewAppContext,
    TableActiveReviews,
    TableNoRecord,
} from '../../../lib'
import { SelectOptionChallengeType } from '../../../lib/models/SelectOptionChallengeType.model'

import styles from './PastReviewsPage.module.scss'

interface Props {
    className?: string
}

export const PastReviewsPage: FC<Props> = (props: Props) => {
    const {
        loginUserInfo,
    }: ReviewAppContextModel = useContext(ReviewAppContext)

    const { challengeTypes, isLoading: isLoadingChallengeTypeOnly }: useFetchChallengeTypesProps
        = useFetchChallengeTypes()
    const { challengeTracks, isLoading: isLoadingChallengeTrackOnly }: useFetchChallengeTracksProps
        = useFetchChallengeTracks()
    const isLoadingChallengeType = isLoadingChallengeTypeOnly || isLoadingChallengeTrackOnly

    const challengeTypeOptions = useMemo<SelectOptionChallengeType[]>(() => {
        const results: SelectOptionChallengeType[] = [
            CHALLENGE_TYPE_SELECT_ALL_OPTION,
        ]
        forEach(challengeTracks, challengeTrack => {
            results.push({
                challengeTrackId: challengeTrack.id,
                isDisabled: true,
                label: `--- ${challengeTrack.name} ---`,
                value: challengeTrack.id,
            })

            forEach(challengeTypes, challengeType => {
                results.push({
                    challengeTrackId: challengeTrack.id,
                    challengeTypeId: challengeType.id,
                    label: challengeType.name,
                    value: `${challengeTrack.id}---${challengeType.id}`,
                })
            })
        })

        return results
    }, [challengeTypes, challengeTracks])
    const [challengeType, setChallengeType] = useState<
        SingleValue<SelectOptionChallengeType>
    >(CHALLENGE_TYPE_SELECT_ALL_OPTION)
    const {
        pastReviews,
        isLoading: isLoadingPastReviews,
        loadPastReviews,
    }: useFetchPastReviewsProps = useFetchPastReviews()

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'Past Review Assignments' }],
        [],
    )

    useEffect(() => {
        if (challengeType && loginUserInfo) {
            loadPastReviews(challengeType.challengeTypeId)
        }
    }, [challengeType, loadPastReviews, loginUserInfo])

    return (
        <PageWrapper
            pageTitle='Past Review Assignments'
            className={classNames(styles.container, props.className)}
            breadCrumb={breadCrumb}
        >
            <div className={styles['filter-bar']}>
                <label>Challenge type</label>
                <Select
                    className='react-select-container'
                    classNamePrefix='select'
                    options={challengeTypeOptions}
                    defaultValue={challengeType}
                    onChange={setChallengeType}
                    isLoading={isLoadingChallengeType}
                    isDisabled={isLoadingPastReviews}
                />
            </div>

            {isLoadingPastReviews ? (
                <TableLoading />
            ) : (
                <>
                    {pastReviews.length === 0 ? (
                        <TableNoRecord className={styles.blockTable} />
                    ) : (
                        <TableActiveReviews
                            datas={pastReviews}
                            className={styles.blockTable}
                            hideStatusColumns
                            disableNavigation
                        />
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default PastReviewsPage
