/**
 * Active Reviews Page.
 */
import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { forEach, toString } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { TableLoading } from '~/apps/admin/src/lib'

import {
    useFetchActiveReviews,
    useFetchActiveReviewsProps,
    useFetchChallengeTracks,
    useFetchChallengeTracksProps,
    useFetchChallengeTypes,
    useFetchChallengeTypesProps,
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

import styles from './ActiveReviewsPage.module.scss'

interface Props {
    className?: string
}

export const ActiveReviewsPage: FC<Props> = (props: Props) => {
    const {
        cancelLoadMyRoleInfos,
        loginUserInfo,
        myRoleInfosMapping,
        resourceRoleMapping,
        loadMyRoleInfos,
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
        totalPages,
        page,
        setPage,
        activeReviews,
        isLoading: isLoadingActiveReviews,
        loadActiveReviews,
    }: useFetchActiveReviewsProps = useFetchActiveReviews(
        loadMyRoleInfos,
        cancelLoadMyRoleInfos,
    )

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'My Active Challenges' }],
        [],
    )

    useEffect(() => {
        if (challengeType && loginUserInfo) {
            loadActiveReviews(
                toString(challengeType.challengeTypeId ?? ''),
                toString(challengeType.challengeTrackId ?? ''),
                toString(loginUserInfo.userId),
            )
        }
    }, [challengeType, loadActiveReviews, loginUserInfo])

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
                    options={challengeTypeOptions}
                    defaultValue={challengeType}
                    onChange={setChallengeType}
                    isLoading={isLoadingChallengeType}
                    isDisabled={isLoadingActiveReviews}
                />
            </div>

            {isLoadingActiveReviews ? (
                <TableLoading />
            ) : (
                <>
                    {activeReviews.length === 0 ? (
                        <TableNoRecord className={styles.blockTable} />
                    ) : (
                        <TableActiveReviews
                            totalPages={totalPages}
                            page={page}
                            setPage={setPage}
                            datas={activeReviews}
                            className={styles.blockTable}
                            resourceRoleMapping={resourceRoleMapping}
                            myRoleInfosMapping={myRoleInfosMapping}
                        />
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default ActiveReviewsPage
