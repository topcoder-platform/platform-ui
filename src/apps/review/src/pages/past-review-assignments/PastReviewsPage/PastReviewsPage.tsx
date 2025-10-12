/**
 * Past Reviews Page.
 */
import {
    ChangeEvent,
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
import { Button, IconOutline, InputText } from '~/libs/ui'

import { CHALLENGE_TYPE_SELECT_ALL_OPTION } from '../../../config/index.config'
import {
    PageWrapper,
    ReviewAppContext,
    TableActiveReviews,
    TableNoRecord,
} from '../../../lib'
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
import { SelectOption } from '../../../lib/models/SelectOption.model'
import { getAllowedTypeAbbreviationsByTrack } from '../../../lib/utils/challengeTypesByTrack'

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

    const [challengeTrack, setChallengeTrack] = useState<
        SingleValue<SelectOption>
    >(CHALLENGE_TYPE_SELECT_ALL_OPTION)
    const [challengeType, setChallengeType] = useState<
        SingleValue<SelectOption>
    >(CHALLENGE_TYPE_SELECT_ALL_OPTION)
    const [challengeName, setChallengeName] = useState<string>('')

    const challengeTypeOptions = useMemo<SelectOption[]>(() => {
        const results: SelectOption[] = [CHALLENGE_TYPE_SELECT_ALL_OPTION]

        // When a track is selected, filter type options by allowed abbreviations.
        const selectedTrack = challengeTracks.find(t => t.id === (challengeTrack?.value || ''))
        const allowedAbbrevs = getAllowedTypeAbbreviationsByTrack(selectedTrack?.track)

        forEach(challengeTypes, challengeTypeItem => {
            if (!allowedAbbrevs || allowedAbbrevs.includes(challengeTypeItem.abbreviation)) {
                results.push({ label: challengeTypeItem.name, value: challengeTypeItem.id })
            }
        })

        return results
    }, [challengeTypes, challengeTracks, challengeTrack])

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

    // If the selected type is not allowed for the selected track, reset to All
    useEffect(() => {
        const selectedTrack = challengeTracks.find(t => t.id === selectedChallengeTrackId)
        const allowedAbbrevs = getAllowedTypeAbbreviationsByTrack(selectedTrack?.track)
        if (!allowedAbbrevs) return

        const selectedType = challengeTypes.find(t => t.id === selectedChallengeTypeId)
        if (selectedType && !allowedAbbrevs.includes(selectedType.abbreviation)) {
            setChallengeType(CHALLENGE_TYPE_SELECT_ALL_OPTION)
        }
    }, [challengeTracks, challengeTypes, selectedChallengeTrackId, selectedChallengeTypeId])

    useEffect(() => {
        if (challengeType && loginUserInfo) {
            loadPastReviews({
                challengeName: challengeName || undefined,
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
        challengeName,
        loadPastReviews,
        loginUserInfo,
        selectedChallengeTrackId,
        selectedChallengeTypeId,
        sort,
    ])

    const handlePageChange = useCallback(
        (nextPage: number) => {
            loadPastReviews({
                challengeName: challengeName || undefined,
                challengeTrackId: selectedChallengeTrackId || undefined,
                challengeTypeId: selectedChallengeTypeId || undefined,
                page: nextPage,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                sortBy: sort?.fieldName,
                sortOrder: sort?.direction,
            })
        },
        [
            challengeName,
            loadPastReviews,
            selectedChallengeTrackId,
            selectedChallengeTypeId,
            sort,
        ],
    )

    const handleSortChange = useCallback(
        (nextSort?: Sort) => {
            setSort(nextSort)
        },
        [],
    )

    const handleChallengeNameChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setChallengeName(event.target.value)
        },
        [],
    )

    const handleClear = useCallback(() => {
        setChallengeTrack(CHALLENGE_TYPE_SELECT_ALL_OPTION)
        setChallengeType(CHALLENGE_TYPE_SELECT_ALL_OPTION)
        setChallengeName('')
        loadPastReviews({
            challengeName: undefined,
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
                <div className={classNames(styles.filterGroup, styles.searchGroup)}>
                    <InputText
                        name='challengeName'
                        type='text'
                        placeholder='Search challenges...'
                        value={challengeName}
                        forceUpdateValue
                        onChange={handleChallengeNameChange}
                        className='react-select-container'
                        classNameWrapper={styles.searchInputWrapper}
                        label={(
                            <span className={styles.srOnly}>
                                Search by name
                            </span>
                        )}
                    />
                </div>
                <div className={styles.filterRow}>
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
