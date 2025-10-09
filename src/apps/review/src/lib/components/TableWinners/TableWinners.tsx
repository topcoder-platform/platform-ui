/**
 * Table Winners.
 */
import { FC, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn, Tooltip } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ProjectResult } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ORDINAL_SUFFIX } from '../../../config/index.config'
import { getHandleUrl } from '../../utils'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableWinners.module.scss'

interface Props {
    className?: string
    datas: ProjectResult[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TableWinners: FC<Props> = (props: Props) => {
    const className = props.className
    const datas = props.datas
    const isDownloading = props.isDownloading
    const downloadSubmission = props.downloadSubmission
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const location = useLocation()
    const reviewTabUrl = useMemo(() => {
        const searchParams = new URLSearchParams(location.search)
        searchParams.set('tab', 'review-appeals')
        const queryString = searchParams.toString()

        return `${location.pathname}${queryString ? `?${queryString}` : ''}`
    }, [location.pathname, location.search])
    const firstSubmission: ProjectResult | undefined = useMemo(
        () => datas[0],
        [datas],
    )

    const {
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const columns = useMemo<TableColumn<ProjectResult>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: ProjectResult) => {
                    const isRestrictedForRow = data.submissionId
                        ? isSubmissionDownloadRestrictedForMember(data.userId)
                        : false
                    const tooltipMessage = getRestrictionMessageForMember(data.userId)
                        ?? restrictionMessage
                    const isButtonDisabled = Boolean(
                        (data.submissionId
                            ? isDownloading[data.submissionId]
                            : false)
                        || isRestrictedForRow,
                    )

                    const downloadButton = data.submissionId ? (
                        <button
                            onClick={function onClick() {
                                if (isRestrictedForRow) {
                                    return
                                }

                                downloadSubmission(data.submissionId)
                            }}
                            className={styles.textBlue}
                            disabled={isButtonDisabled}
                            type='button'
                        >
                            {data.submissionId}
                        </button>
                    ) : (
                        <span>
                            Submission unavailable
                        </span>
                    )

                    const renderedDownloadButton = data.submissionId && isRestrictedForRow ? (
                        <Tooltip
                            content={tooltipMessage}
                            triggerOn='click-hover'
                        >
                            <span className={styles.tooltipTrigger}>
                                {downloadButton}
                            </span>
                        </Tooltip>
                    ) : (
                        downloadButton
                    )

                    return (
                        <div className={styles.blockPlacementContainer}>
                            {data.placement && data.placement < 4 ? (
                                <i
                                    className={`icon-${ORDINAL_SUFFIX.get(
                                        data.placement,
                                    )}`}
                                />
                            ) : undefined}
                            <span>
                                {renderedDownloadButton}
                                <span className={styles.spacing}>-</span>
                                <span>
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
                                        {data.userInfo?.memberHandle}
                                    </a>
                                </span>
                            </span>
                        </div>
                    )
                },
                type: 'element',
            },
            {
                label: 'Final Review Score',
                renderer: (data: ProjectResult) => {
                    const formatted = (typeof data.finalScore === 'number'
                        && Number.isFinite(data.finalScore))
                        ? data.finalScore.toFixed(2)
                        : `${data.finalScore}`

                    return (
                        <Link to={reviewTabUrl} className={styles.textBlue}>
                            {formatted}
                        </Link>
                    )
                },
                type: 'element',
            },
            ...(firstSubmission?.reviews ?? [])
                .map((_unusedReview, index) => (
                    [
                        {
                            label: 'Review Date',
                            renderer: (data: ProjectResult) => (
                                <span>
                                    {data.reviews[index]?.createdAtString}
                                </span>
                            ),
                            type: 'element',
                        },
                    ] as TableColumn<ProjectResult>[]
                ))
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [
            firstSubmission,
            downloadSubmission,
            isDownloading,
            reviewTabUrl,
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<ProjectResult>[][]>(
        () => columns.map(column => [
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
        ] as MobileTableColumn<ProjectResult>[]),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={datas} />
            ) : (
                <Table
                    columns={columns}
                    data={datas}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableWinners
