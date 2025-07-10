/**
 * Terms List Page.
 */
import { FC, useState } from 'react'
import classNames from 'classnames'

import { colWidthType, LinkButton, PageDivider } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import {
    PageWrapper,
    TableLoading,
    TableNoRecord,
    TermsFilters,
    TermsTable,
} from '../../../lib'
import { useAutoScrollTopWhenInit, useManageTerms, useManageTermsProps } from '../../../lib/hooks'

import styles from './TermsListPage.module.scss'

interface Props {
    className?: string
}

export const TermsListPage: FC<Props> = (props: Props) => {
    useAutoScrollTopWhenInit()
    const [colWidth, setColWidth] = useState<colWidthType>({})
    /**
     * Manage term list
     */
    const {
        isLoading,
        datas,
        totalPages,
        page,
        setPage,
        setFilterCriteria,
    }: useManageTermsProps = useManageTerms()

    return (
        <PageWrapper
            pageTitle='Terms of Use'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <LinkButton
                    primary
                    size='lg'
                    to='add'
                    icon={PlusIcon}
                    iconToLeft
                    label='add terms'
                />
            )}
        >
            <TermsFilters
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
                            <TermsTable
                                datas={datas}
                                totalPages={totalPages}
                                page={page}
                                setPage={setPage}
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

export default TermsListPage
