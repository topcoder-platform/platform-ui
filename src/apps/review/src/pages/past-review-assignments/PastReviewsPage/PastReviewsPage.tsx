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
import { Button, IconOutline } from '~/libs/ui'

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
import { SelectOption } from '../../../lib/models/SelectOption.model'

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

    const challengeTrackOptions = useMemo<SelectOption[]>(() => {
        const results: SelectOption[] = [CHALLENGE_TYPE_SELECT_ALL_OPTION]
        forEach(challengeTracks, challengeTrack => {
            results.push({ label: challengeTrack.name, value: challengeTrack.id })
        })
        return results
    }, [challengeTracks])

    const challengeTypeOptions = useMemo<SelectOption[]>(() => {
        const results: SelectOption[] = [CHALLENGE_TYPE_SELECT_ALL_OPTION]
        forEach(challengeTypes, challengeType => {
            results.push({ label: challengeType.name, value: challengeType.id })
        })
        return results
    }, [challengeTypes])

    const [challengeTrack, setChallengeTrack] = useState<
        SingleValue<SelectOption>
    >(CHALLENGE_TYPE_SELECT_ALL_OPTION)
    const [challengeType, setChallengeType] = useState<
        SingleValue<SelectOption>
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

    const selectedChallengeTrackId = challengeTrack?.value || undefined
    const selectedChallengeTypeId = challengeType?.value || undefined

    useEffect(() => {
        if (challengeType && loginUserInfo) {
            loadPastReviews({
                challengeTrackId: selectedChallengeTrackId || undefined,
                challengeTypeId: selectedChallengeTypeId || undefined,
                page: 1,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                sortBy: sort?.fieldName,
                sortOrder: sort?.direction,
            })
        }
    }, [
        challengeTrack,
        challengeType,
        loadPastReviews,
        loginUserInfo,
        selectedChallengeTrackId,
        selectedChallengeTypeId,
        sort,
    ])

    const handlePageChange = useCallback(
        (nextPage: number) => {
            loadPastReviews({
                challengeTrackId: selectedChallengeTrackId || undefined,
                challengeTypeId: selectedChallengeTypeId || undefined,
                page: nextPage,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                sortBy: sort?.fieldName,
                sortOrder: sort?.direction,
            })
        },
        [loadPastReviews, selectedChallengeTrackId, selectedChallengeTypeId, sort],
    )

    const handleSortChange = useCallback(
        (nextSort?: Sort) => {
            setSort(nextSort)
        },
        [],
    )

    const handleClear = useCallback(() => {
        setChallengeTrack(CHALLENGE_TYPE_SELECT_ALL_OPTION)
        setChallengeType(CHALLENGE_TYPE_SELECT_ALL_OPTION)
        loadPastReviews({
            challengeTrackId: undefined,
            challengeTypeId: undefined,
            page: 1,
            perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
            sortBy: sort?.fieldName,
            sortOrder: sort?.direction,
        })
    }, [loadPastReviews, sort])

    return (
        <PageWrapper
            pageTitle='My Past Challenges'
            className={classNames(styles.container, props.className)}
            breadCrumb={breadCrumb}
        >
            <div className={styles['filter-bar']}>
                <div className={styles.filterGroup}>
                    <label>Challenge track</label>
                    <Select
                        className='react-select-container'
                        classNamePrefix='select'
                        options={challengeTrackOptions}
                        value={challengeTrack}
                        onChange={setChallengeTrack}
                        isLoading={isLoadingChallengeType}
                        isDisabled={isLoadingPastReviews}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>Challenge type</label>
                    <Select
                        className='react-select-container'
                        classNamePrefix='select'
                        options={challengeTypeOptions}
                        value={challengeType}
                        onChange={setChallengeType}
                        isLoading={isLoadingChallengeType}
                        isDisabled={isLoadingPastReviews}
                    />
                </div>
                <div className={styles.actions}>
                    <Button
                        className={styles.clearButton}
                        label='Clear'
                        secondary
                        size='lg'
                        onClick={handleClear}
                        icon={IconOutline.XIcon}
                        iconToLeft
                    />
                </div>
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
