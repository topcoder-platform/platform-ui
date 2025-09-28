/**
 * Past Reviews Page.
 */
import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { forEach } from 'lodash'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import { Pagination, TableLoading } from '~/apps/admin/src/lib'
import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import {
    DEFAULT_PAST_REVIEWS_PER_PAGE,
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

const DEFAULT_SORT: Sort = {
    direction: 'desc',
    fieldName: 'challengeEndDate',
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
    const [sort, setSort] = useState<Sort | undefined>(() => ({ ...DEFAULT_SORT }))
    const {
        pastReviews,
        isLoading: isLoadingPastReviews,
        loadPastReviews,
        pagination,
    }: useFetchPastReviewsProps = useFetchPastReviews()

    const breadCrumb = useMemo(
        () => [{ index: 1, label: 'My Past Challenges' }],
        [],
    )

    const selectedChallengeTypeId = challengeType?.challengeTypeId

    useEffect(() => {
        if (challengeType && loginUserInfo) {
            loadPastReviews({
                challengeTypeId: selectedChallengeTypeId,
                page: 1,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                sortBy: sort?.fieldName,
                sortOrder: sort?.direction,
            })
        }
    }, [challengeType, loadPastReviews, loginUserInfo, selectedChallengeTypeId, sort])

    const handlePageChange = useCallback(
        (nextPage: number) => {
            loadPastReviews({
                challengeTypeId: selectedChallengeTypeId,
                page: nextPage,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                sortBy: sort?.fieldName,
                sortOrder: sort?.direction,
            })
        },
        [loadPastReviews, selectedChallengeTypeId, sort],
    )

    const handleSortChange = useCallback(
        (nextSort?: Sort) => {
            setSort(nextSort)
        },
        [],
    )

    return (
        <PageWrapper
            pageTitle='My Past Challenges'
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
            ) : pastReviews.length === 0 ? (
                <TableNoRecord className={styles.blockTable} />
            ) : (
                <>
                    <TableActiveReviews
                        datas={pastReviews}
                        className={styles.blockTable}
                        hideStatusColumns
                        onToggleSort={handleSortChange}
                        sort={sort}
                    />
                    {pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default PastReviewsPage
