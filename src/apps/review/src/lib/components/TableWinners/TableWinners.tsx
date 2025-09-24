/**
 * Table Winners.
 */
import { FC, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, ProjectResult } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ORDINAL_SUFFIX, WITHOUT_APPEAL } from '../../../config/index.config'
import { getHandleUrl } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'

import styles from './TableWinners.module.scss'

interface Props {
    className?: string
    datas: ProjectResult[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TableWinners: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    // get challenge info from challenge detail context
    const {
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const firstSubmission: ProjectResult | undefined = useMemo(
        () => props.datas[0],
        [props.datas],
    )

    const columns = useMemo<TableColumn<ProjectResult>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: ProjectResult) => (
                    <div className={styles.blockPlacementContainer}>
                        {data.placement && data.placement < 4 ? (
                            <i
                                className={`icon-${ORDINAL_SUFFIX.get(
                                    data.placement,
                                )}`}
                            />
                        ) : undefined}
                        <span>
                            <button
                                onClick={function onClick() {
                                    props.downloadSubmission(data.submissionId)
                                }}
                                className={styles.textBlue}
                                disabled={props.isDownloading[data.submissionId]}
                                type='button'
                            >
                                {data.submissionId}
                            </button>
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
                ),
                type: 'element',
            },
            {
                label: 'Review Score',
                renderer: (data: ProjectResult) => (
                    <span>{data.finalScore}</span>
                ),
                type: 'element',
            },
            ...(firstSubmission?.reviews ?? [])
                .map((review, index) => {
                    const initialColumns = [
                        {
                            label: 'Review Date',
                            renderer: (data: ProjectResult) => (
                                <span>
                                    {data.reviews[index]?.createdAtString}
                                </span>
                            ),
                            type: 'element',
                        },
                        {
                            label: 'Score',
                            renderer: (data: ProjectResult) => (
                                <Link
                                    to={`./../scorecard-details/${data.submissionId}/review/${review.resourceId}`}
                                    className={styles.textBlue}
                                >
                                    {data.reviews[index]?.score}
                                </Link>
                            ),
                            type: 'element',
                        },
                    ]
                    if (
                        includes(WITHOUT_APPEAL, challengeInfo?.type)
                        || includes(WITHOUT_APPEAL, challengeInfo?.track)
                    ) {
                        return initialColumns as TableColumn<ProjectResult>[]
                    }

                    return (
                        [
                            ...initialColumns,
                            {
                                className: styles.tableCellNoWrap,
                                label: 'Appeals',
                                renderer: (data: ProjectResult) => (
                                    <>
                                        [
                                        <Link
                                            className={classNames(styles.appealsLink, 'last-element')}
                                            to={
                                                `./../scorecard-details/${data.submissionId}`
                                                + `/review/${review.resourceId}`
                                            }
                                        >
                                            <span className={styles.textBlue}>
                                                0
                                            </span>
                                            {' '}
                                            /
                                            {' '}
                                            <span className={styles.textBlue}>
                                                {
                                                    data.reviews[index]?.appeals?.length
                                                }
                                            </span>
                                        </Link>
                                        ]
                                    </>
                                ),
                                type: 'element',
                            },
                        ] as TableColumn<ProjectResult>[]
                    )
                })
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [
            firstSubmission,
            challengeInfo?.type,
            props.isDownloading,
            props.downloadSubmission,
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
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableWinners
