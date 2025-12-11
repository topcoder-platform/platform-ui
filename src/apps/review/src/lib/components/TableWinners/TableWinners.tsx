/**
 * Table Winners.
 */
import { FC, useCallback, useContext, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn, Tooltip } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import {
    ChallengeDetailContextModel,
    ProjectResult,
    ReviewAppContextModel,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ORDINAL_SUFFIX } from '../../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { buildPhaseTabs, getHandleUrl } from '../../utils'
import type { PhaseOrderingOptions } from '../../utils'
import { useRolePermissions, UseRolePermissionsResult, useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TableWinners.module.scss'

interface Props {
    className?: string
    datas: ProjectResult[]
    aiReviewers?: { aiWorkflowId: string }[]
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
    const { challengeInfo }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { canViewAllSubmissions }: UseRolePermissionsResult = useRolePermissions()
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const phaseOrderingOptions = useMemo<PhaseOrderingOptions>(() => {
        const typeName = challengeInfo?.type?.name?.toLowerCase?.() || ''
        const typeAbbrev = challengeInfo?.type?.abbreviation?.toLowerCase?.() || ''
        const simplifiedType = typeName.replace(/\s|-/g, '')

        return {
            isF2F: typeAbbrev === 'f2f' || simplifiedType === 'first2finish',
            isTask: typeAbbrev === 'task' || typeAbbrev === 'tsk' || simplifiedType === 'task',
        }
    }, [challengeInfo?.type?.abbreviation, challengeInfo?.type?.name])

    const isCompletedDesignChallenge = useMemo(() => {
        if (!challengeInfo) return false
        const type = challengeInfo.track.name ? String(challengeInfo.track.name)
            .toLowerCase() : ''
        const status = challengeInfo.status ? String(challengeInfo.status)
            .toLowerCase() : ''
        return type === 'design' && (
            status === 'completed'
        )
    }, [challengeInfo])

    const isSubmissionsViewable = useMemo(() => {
        if (!challengeInfo?.metadata?.length) return false
        return challengeInfo.metadata.some(m => m.name === 'submissionsViewable' && String(m.value)
            .toLowerCase() === 'true')
    }, [challengeInfo])

    const canViewSubmissions = useMemo(() => {
        if (isCompletedDesignChallenge) {
            return canViewAllSubmissions || isSubmissionsViewable
        }

        return true
    }, [isCompletedDesignChallenge, isSubmissionsViewable, canViewAllSubmissions])

    const filterFunc = useCallback((submissions: ProjectResult[]): ProjectResult[] => submissions
            .filter(submission => {
                if (!canViewSubmissions) {
                    return String(submission.userId) === String(loginUserInfo?.userId)
                }
    
                return true
            }), [canViewSubmissions, loginUserInfo?.userId])
    
    const winnerData = filterFunc(datas)

    const reviewTabUrl = useMemo(() => {
        const searchParams = new URLSearchParams(location.search)
        const challengePhases = challengeInfo?.phases ?? []
        let targetSlug: string | undefined

        if (challengePhases.length) {
            const tabs = buildPhaseTabs(
                challengePhases,
                challengeInfo?.status,
                phaseOrderingOptions,
            )
            const normalize = (value: string): string => value.trim()
                .toLowerCase()
            const reviewTab = tabs.find(tab => normalize(tab.value) === 'review')

            if (reviewTab) {
                targetSlug = _.kebabCase(reviewTab.value)
            } else {
                const iterativeTabs = tabs.filter(tab => normalize(tab.value)
                    .startsWith('iterative review'))
                if (iterativeTabs.length) {
                    targetSlug = _.kebabCase(iterativeTabs[iterativeTabs.length - 1].value)
                }
            }
        }

        const slug = targetSlug ?? 'review'
        searchParams.set('tab', slug)
        const queryString = searchParams.toString()

        return `${location.pathname}${queryString ? `?${queryString}` : ''}`
    }, [
        challengeInfo?.phases,
        challengeInfo?.status,
        location.pathname,
        location.search,
        phaseOrderingOptions,
    ])

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
            {
                label: 'Submission Date',
                renderer: (data: ProjectResult) => (
                    <span>{data.submittedDateString || data.createdAtString || '-'}</span>
                ),
                type: 'element',
            },
            {
                columnId: 'ai-reviews-table',
                label: '',
                renderer: (result: ProjectResult, allRows: ProjectResult[]) => (
                    props.aiReviewers && (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers}
                            submission={{ id: result.submissionId, virusScan: true }}
                            defaultOpen={allRows ? !allRows.indexOf(result) : false}
                        />
                    )
                ),
                type: 'element',
            },
        ],
        [
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
            column.label && {
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
                colSpan: column.label ? 1 : 2,
                mobileType: 'last-value',
            },
        ].filter(Boolean) as MobileTableColumn<ProjectResult>[]),
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
                <TableMobile columns={columnsMobile} data={winnerData} />
            ) : (
                <Table
                    columns={columns}
                    data={winnerData}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableWinners
