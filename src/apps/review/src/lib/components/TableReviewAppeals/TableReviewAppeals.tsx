/**
 * Table Review Appeals.
 */
import { FC, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn, Tooltip } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { TableWrapper } from '../TableWrapper'
import { ChallengeDetailContextModel, MappingReviewAppeal, SubmissionInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'
import { APPROVAL, NO_RESOURCE_ID, REVIEWER, WITHOUT_APPEAL } from '../../../config/index.config'
import { useRole, useRoleProps } from '../../hooks'
import { getHandleUrl, isReviewPhase } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    tab: string
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    hideHandleColumn?: boolean
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
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
    } = useSubmissionDownloadAccess()

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => {
            const submissionColumn: TableColumn<SubmissionInfo> = {
                className: styles.textBlue,
                label: 'Submission ID',
                propertyName: 'id',
                renderer: (data: SubmissionInfo) => {
                    const isButtonDisabled = Boolean(
                        props.isDownloading[data.id]
                        || isSubmissionDownloadRestricted,
                    )

                    const button = (
                        <button
                            onClick={function onClick() {
                                if (isSubmissionDownloadRestricted) {
                                    return
                                }
                                props.downloadSubmission(data.id)
                            }}
                            className={styles.textBlue}
                            disabled={isButtonDisabled}
                            type='button'
                        >
                            {data.id}
                        </button>
                    )

                    if (!isSubmissionDownloadRestricted) {
                        return button
                    }

                    return (
                        <Tooltip content={restrictionMessage} triggerOn='click-hover'>
                            <span
                                className={styles.tooltipTrigger}
                            >
                                {button}
                            </span>
                        </Tooltip>
                    )
                },
                type: 'element',
            }

            const handleColumn: TableColumn<SubmissionInfo> | undefined = props.hideHandleColumn
                ? undefined
                : {
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
                }

            const reviewDateColumn: TableColumn<SubmissionInfo> = {
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
            }

            const scoreColumn: TableColumn<SubmissionInfo> = {
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
            }

            const initalColumns: TableColumn<SubmissionInfo>[] = [
                submissionColumn,
                ...(handleColumn ? [handleColumn] : []),
                reviewDateColumn,
                scoreColumn,
            ]
            const actionColumns = actionChallengeRole === REVIEWER && isReviewPhase(challengeInfo) ? [
                {
                    className: styles.textBlue,
                    label: 'Action',
                    renderer: (data: SubmissionInfo) => {
                        const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                        const reviewStatus = (data.review?.status ?? '').toUpperCase()
                        const hasReview = !!data.review?.id
                        const actionLink = (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                className={classNames(
                                    styles.submit,
                                    'last-element',
                                )}
                            >
                                <i className='icon-upload' />
                                Submit Review
                            </Link>
                        )

                        if (includes(['COMPLETED', 'SUBMITTED'], reviewStatus)) {
                            return (
                                <div
                                    aria-label='Review completed'
                                    className={classNames(
                                        styles.completedAction,
                                        'last-element',
                                    )}
                                    title='Review completed'
                                >
                                    <span className={styles.completedIcon} aria-hidden='true'>
                                        &check;
                                    </span>
                                </div>
                            )
                        }

                        if (
                            includes(['PENDING', 'IN_PROGRESS'], reviewStatus)
                        ) {
                            return actionLink
                        }

                        if (!reviewStatus && hasReview) {
                            return (
                                <Link
                                    to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                    className={classNames(
                                        styles.submit,
                                        'last-element',
                                    )}
                                >
                                    <i className='icon-reopen' />
                                    Reopen Review
                                </Link>
                            )
                        }

                        return actionLink
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
            props.tab,
            challengeInfo,
            actionChallengeRole,
            props.isDownloading,
            props.downloadSubmission,
            props.mappingReviewAppeal,
            props.hideHandleColumn,
            isSubmissionDownloadRestricted,
            restrictionMessage,
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
