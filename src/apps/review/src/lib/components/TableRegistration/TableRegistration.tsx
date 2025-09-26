/**
 * Table Registration.
 */
import { FC, MouseEvent, useContext, useMemo } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { UserRole } from '~/libs/core'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn } from '~/libs/ui'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { useTableFilterLocal, useTableFilterLocalProps } from '~/apps/admin/src/lib/hooks'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'

import {
    BackendResource,
    ChallengeDetailContextModel,
    ReviewAppContextModel,
} from '../../models'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { getHandleUrl } from '../../utils'
import { TableWrapper } from '../TableWrapper'

import styles from './TableRegistration.module.scss'

interface Props {
    className?: string
    datas: BackendResource[]
}

export const TableRegistration: FC<Props> = (props: Props) => {
    const {
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<BackendResource> = useTableFilterLocal(
        props.datas ?? [],
        undefined,
        {},
        true, // no pagination
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const { myRoles }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const hasCopilotRole = useMemo(
        () => (myRoles ?? [])
            .some(role => role
                ?.toLowerCase()
                .includes('copilot')),
        [myRoles],
    )

    const isAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const shouldDisplayEmail = hasCopilotRole || isAdmin

    const columns = useMemo<TableColumn<BackendResource>[]>(
        () => {
            const baseColumns: TableColumn<BackendResource>[] = [
                {
                    label: 'Handle',
                    propertyName: 'memberHandle',
                    renderer: (data: BackendResource) => (
                        <a
                            href={getHandleUrl(data)}
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                color: data.handleColor,
                            }}
                            onClick={function onClick() {
                                window.open(
                                    getHandleUrl(data),
                                    '_blank',
                                )
                            }}
                        >
                            {data.memberHandle}
                        </a>
                    ),
                    type: 'element',
                },
                {
                    label: 'Rating',
                    propertyName: 'rating',
                    renderer: (data: BackendResource) => (
                        <span style={{ color: data.handleColor }}>
                            {data.rating ?? 'Not Rated'}
                        </span>
                    ),
                    type: 'element',
                },
                {
                    label: 'Registration Date',
                    propertyName: 'created',
                    renderer: (data: BackendResource) => (
                        <span className='last-element'>{data.createdString}</span>
                    ),
                    type: 'element',
                },
            ]

            if (shouldDisplayEmail) {
                baseColumns.splice(1, 0, {
                    label: 'Email',
                    propertyName: 'memberEmail',
                    renderer: (data: BackendResource) => {
                        const emailValue = data.memberEmail?.trim()

                        if (!emailValue) {
                            return <span>Unavailable</span>
                        }

                        const email: string = emailValue

                        async function handleCopyEmail(event: MouseEvent<HTMLButtonElement>): Promise<void> {
                            event.stopPropagation()

                            await copyTextToClipboard(email)
                            toast.success('Email copied to clipboard', {
                                toastId: `challenge-registration-email-copy-${email}`,
                            })
                        }

                        return (
                            <span className={styles.emailCell}>
                                <a
                                    href={`mailto:${email}`}
                                    className={styles.emailLink}
                                >
                                    {email}
                                </a>
                                <button
                                    type='button'
                                    className={styles.copyButton}
                                    aria-label='Copy email address'
                                    title='Copy email address'
                                    onClick={handleCopyEmail}
                                >
                                    <IconOutline.DocumentDuplicateIcon />
                                </button>
                            </span>
                        )
                    },
                    type: 'element',
                })
            }

            return baseColumns
        },
        [shouldDisplayEmail],
    )

    const columnsMobile = useMemo<MobileTableColumn<BackendResource>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<BackendResource>[],
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
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    forceSort={sort}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableRegistration
