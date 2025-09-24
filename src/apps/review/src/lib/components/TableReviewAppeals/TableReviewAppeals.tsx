/**
 * Table Review Appeals.
 */
import { FC, useCallback, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { TableWrapper } from '../TableWrapper'
import { ChallengeDetailContextModel, MappingReviewAppeal, SubmissionInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'
import { APPROVAL, NO_RESOURCE_ID, REVIEWER, WITHOUT_APPEAL } from '../../../config/index.config'
import { useRole, useRoleProps } from '../../hooks'
import { getHandleUrl, isReviewPhase } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    tab: string
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const {
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole }: useRoleProps = useRole()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => {
            const initalColumns = [
                {
                    className: styles.textBlue,
                    label: 'Submission ID',
                    propertyName: 'id',
                    renderer: (data: SubmissionInfo) => (
                        <button
                            onClick={function onClick() {
                                props.downloadSubmission(data.id)
                            }}
                            className={styles.textBlue}
                            disabled={props.isDownloading[data.id]}
                            type='button'
                        >
                            {data.id}
                        </button>
                    ),
                    type: 'element',
                },
                {
                    label: 'Handle',
                    propertyName: 'handle',
                    renderer: (data: SubmissionInfo) => (
                        <a
                            href={getHandleUrl(data.userInfo)}
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                color: data.userInfo?.handleColor,
                            }}
                            onClick={function onClick() {
                                window.open(
                                    getHandleUrl(data.userInfo),
                                    '_blank',
                                )
                            }}
                        >
                            {data.userInfo?.memberHandle ?? ''}
                        </a>
                    ),
                    type: 'element',
                },
                {
                    label: 'Review Date',
                    renderer: (data: SubmissionInfo) => {
                        if (!data.review || !data.review.id) {
                            return (
                                <span className={styles.notReviewed}>
                                    Not Reviewed
                                </span>
                            )
                        }

                        if (data.review) {
                            return (
                                <span>
                                    {data.review.updatedAtString
                                        || data.review.createdAtString}
                                </span>
                            )
                        }

                        return <></>
                    },
                    type: 'element',
                },
                {
                    label: 'Score',
                    renderer: (data: SubmissionInfo) => {
                        if (!data.review || !data.review.id) {
                            return (
                                <span className={styles.notReviewed}>
                                    Not Reviewed
                                </span>
                            )
                        }

                        if (!data.review.initialScore) {
                            if (!data.review.reviewProgress) {
                                return (
                                    <span className={styles.notReviewed}>
                                        Not Reviewed
                                    </span>
                                )
                            }

                            return (
                                <ProgressBar
                                    progress={data.review.reviewProgress}
                                />
                            )
                        }

                        const resourceId = data.review?.resourceId || NO_RESOURCE_ID

                        return (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                className={styles.textBlue}
                            >
                                {data.review.initialScore}
                            </Link>
                        )
                    },
                    type: 'element',
                },

            ]
            const actionColumns = actionChallengeRole === REVIEWER && isReviewPhase(challengeInfo) ? [
                {
                    className: styles.textBlue,
                    label: 'Action',
                    renderer: (data: SubmissionInfo) => {
                        const haveReview
                            = data.review
                            && !!data.review.id
                        const resourceId = data.review?.resourceId || NO_RESOURCE_ID

                        return (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                className={classNames(
                                    styles.submit,
                                    'last-element',
                                )}
                            >
                                <i
                                    className={
                                        haveReview
                                            ? 'icon-reopen'
                                            : 'icon-upload'
                                    }
                                />
                                {haveReview
                                    ? 'Reopen Review'
                                    : 'Submit Review'}
                            </Link>
                        )
                    },
                    type: 'element',
                },
            ] : []

            if (includes([APPROVAL], props.tab)) {
                return [...initalColumns] as MobileTableColumn<SubmissionInfo>[]
            }

            if (
                includes(WITHOUT_APPEAL, challengeType)
                || includes(WITHOUT_APPEAL, challengeTrack)
            ) {
                return [
                    ...initalColumns,
                    ...actionColumns,
                ] as TableColumn<SubmissionInfo>[]
            }

            return [...initalColumns, {
                label: 'Appeals',
                renderer: (data: SubmissionInfo) => {
                    if (!data.review || !data.review.id) {
                        return (
                            <span className={styles.notReviewed}>
                                Not Reviewed
                            </span>
                        )
                    }

                    const appealInfo = props.mappingReviewAppeal[data.review.id]
                    if (!appealInfo) {
                        return (
                            <span className={styles.notReviewed}>
                                loading...
                            </span>
                        )
                    }

                    const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                    const reviewStatus = (data.review?.status ?? '').toUpperCase()
                    const hasAppeals = appealInfo.totalAppeals > 0

                    if (!hasAppeals && reviewStatus !== 'COMPLETED') {
                        return undefined
                    }

                    return (
                        <>
                            [
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                className={styles.appealsLink}
                            >
                                <span className={styles.textBlue}>{appealInfo.finishAppeals}</span>
                                {' '}
                                /
                                {' '}
                                <span className={styles.textBlue}>
                                    {appealInfo.totalAppeals}
                                </span>
                            </Link>
                            ]
                        </>
                    )
                },
                type: 'element',
            }, ...actionColumns] as TableColumn<SubmissionInfo>[]
        },
        [
            prevent,
            props.tab,
            challengeInfo,
            actionChallengeRole,
            props.isDownloading,
            props.downloadSubmission,
            props.mappingReviewAppeal,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(
        () => columns.map(column => {
            if (column.label === 'Action') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
                {
                    ...column,
                    className: '',
                    label: `${column.label as string} label`,
                    mobileType: 'label',
                    renderer: () => (
                        <div>
                            {column.label as string}
                            :
                        </div>
                    ),
                    type: 'element',
                },
                {
                    ...column,
                    mobileType: 'last-value',
                },
            ] as MobileTableColumn<SubmissionInfo>[]
        }),
        [columns],
    )

    const submissions
        = includes([APPROVAL], props.tab)
            ? [props.firstSubmissions] as SubmissionInfo[]
            : props.datas

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={submissions} />
            ) : (
                <Table
                    columns={columns}
                    data={submissions}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableReviewAppeals
