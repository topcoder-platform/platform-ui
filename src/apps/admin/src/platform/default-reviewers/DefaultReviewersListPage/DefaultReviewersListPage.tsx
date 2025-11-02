import { FC, useState } from 'react'
import classNames from 'classnames'

import { colWidthType, LinkButton, PageDivider } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import {
    DefaultReviewersFilters,
    DefaultReviewersTable,
    PageWrapper,
    TableLoading,
    TableNoRecord,
} from '../../../lib'
import {
    useAutoScrollTopWhenInit,
    useManageDefaultReviewers,
    useManageDefaultReviewersProps,
} from '../../../lib/hooks'

import styles from './DefaultReviewersListPage.module.scss'

interface Props {
    className?: string
}

export const DefaultReviewersListPage: FC<Props> = (props: Props) => {
    useAutoScrollTopWhenInit()
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const {
        isLoading,
        datas,
        totalPages,
        page,
        setPage,
        setFilterCriteria,
        reloadData,
    }: useManageDefaultReviewersProps = useManageDefaultReviewers()

    return (
        <PageWrapper
            pageTitle='Default Reviewers'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <LinkButton
                    primary
                    size='lg'
                    to='add'
                    icon={PlusIcon}
                    iconToLeft
                    label='add default reviewer'
                />
            )}
        >
            <DefaultReviewersFilters
                isLoading={isLoading}
                onSubmitForm={setFilterCriteria}
            />
            <PageDivider />
            {isLoading ? (
                <TableLoading />
            ) : (
                <>
                    {datas.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <div className={styles.blockTableContainer}>
                            <DefaultReviewersTable
                                datas={datas}
                                totalPages={totalPages}
                                page={page}
                                setPage={setPage}
                                reloadData={reloadData}
                                colWidth={colWidth}
                                setColWidth={setColWidth}
                            />
                        </div>
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default DefaultReviewersListPage
