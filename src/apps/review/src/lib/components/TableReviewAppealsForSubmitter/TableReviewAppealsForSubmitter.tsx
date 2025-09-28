/**
 * Table Winners.
 */
import { FC, MouseEvent, useCallback, useContext, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { includes, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, MappingReviewAppeal, ReviewResult, SubmissionInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getFinalScore } from '../../utils'
import { NO_RESOURCE_ID, WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableReviewAppealsForSubmitter.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
}

export const TableReviewAppealsForSubmitter: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])
    const firstSubmission: SubmissionInfo | undefined = props.firstSubmissions

    const finalScore = useCallback((data: ReviewResult[] | undefined) => getFinalScore(data), [])

    const prevent = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            {
                className: styles.submissionColumn,
                label: 'Submission ID',
                propertyName: 'id',
                renderer: (data: SubmissionInfo) => {
                    const isButtonDisabled = Boolean(
                        props.isDownloading[data.id]
                        || isSubmissionDownloadRestricted,
                    )

                    const downloadButton = (
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

                    async function handleCopySubmissionId(
                        event: MouseEvent<HTMLButtonElement>,
                    ): Promise<void> {
                        event.stopPropagation()
                        event.preventDefault()

                        if (!data.id) {
                            return
                        }

                        await copyTextToClipboard(data.id)
                        toast.success('Submission ID copied to clipboard', {
                            toastId: `challenge-submission-id-copy-${data.id}`,
                        })
                    }

                    const renderedDownloadButton = isSubmissionDownloadRestricted ? (
                        <Tooltip content={restrictionMessage} triggerOn='click-hover'>
                            <span
                                className={styles.tooltipTrigger}
                            >
                                {downloadButton}
                            </span>
                        </Tooltip>
                    ) : (
                        downloadButton
                    )

                    return (
                        <span className={styles.submissionCell}>
                            {renderedDownloadButton}
                            <button
                                type='button'
                                className={styles.copyButton}
                                aria-label='Copy submission ID'
                                title='Copy submission ID'
                                onClick={handleCopySubmissionId}
                                disabled={!data.id}
                            >
                                <IconOutline.DocumentDuplicateIcon />
                            </button>
                        </span>
                    )
                },
                type: 'element',
            },
            {
                label: 'Review Score',
                renderer: (data: SubmissionInfo) => (
                    <Link
                        to={`./../scorecard-details/${data.id}/review/${data.review?.resourceId || NO_RESOURCE_ID}`}
                        className={styles.textBlue}
                    >
                        {finalScore(data.reviews)}
                    </Link>
                ),
                type: 'element',
            },
            ...(firstSubmission?.reviews ?? [])
                .map(review => {
                    const initalColumns = [
                        {
                            label: 'Reviewer',
                            renderer: () => (
                                <NavLink
                                    to='#'
                                    onClick={prevent}
                                    className={styles.reviewer}
                                    style={{
                                        color: review.reviewerHandleColor,
                                    }}
                                >
                                    {review.reviewerHandle}
                                </NavLink>
                            ),
                            type: 'element',
                        },
                        {
                            label: 'Review Date',
                            renderer: () => (
                                <span>{review.createdAtString}</span>
                            ),
                            type: 'element',
                        },
                        {
                            label: 'Score',
                            renderer: (data: SubmissionInfo) => {
                                const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                                return (
                                    <Link
                                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                        className={styles.textBlue}
                                    >
                                        {review.score}
                                    </Link>
                                )
                            },
                            type: 'element',
                        },
                    ]
                    if (
                        includes(WITHOUT_APPEAL, challengeType)
                        || includes(WITHOUT_APPEAL, challengeTrack)
                    ) {
                        return initalColumns as TableColumn<SubmissionInfo>[]
                    }

                    return [
                        ...initalColumns,
                        {
                            className: styles.tableCellNoWrap,
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
                                            className={classNames(
                                                styles.appealsLink,
                                                'last-element',
                                            )}
                                            to={
                                                `./../scorecard-details/${data.id}/review/${resourceId}`
                                            }
                                        >
                                            <span className={styles.textBlue}>
                                                {appealInfo.finishAppeals}
                                            </span>
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
                        },
                    ] as TableColumn<SubmissionInfo>[]
                })
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [
            firstSubmission,
            finalScore,
            prevent,
            props,
            isSubmissionDownloadRestricted,
            restrictionMessage,
            challengeType,
            challengeTrack,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(
        () => columns.map(
            column => [{
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
            ] as MobileTableColumn<SubmissionInfo>[],
        ),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    disableSorting
                    onToggleSort={noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableReviewAppealsForSubmitter
