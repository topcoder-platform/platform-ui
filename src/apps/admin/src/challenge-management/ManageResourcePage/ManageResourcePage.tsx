/**
 * Manage Resource Page.
 */
import { FC } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import {
    useManageChallengeResources,
    useManageChallengeResourcesProps,
} from '../../lib/hooks'
import {
    ActionLoading,
    PageWrapper,
    ResourceTable,
    TableLoading,
    TableNoRecord,
} from '../../lib'

import styles from './ManageResourcePage.module.scss'

interface Props {
    className?: string
}

export const ManageResourcePage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()

    const {
        isLoading,
        resources,
        totalPages,
        page,
        setPage,
        sort,
        setSort,
        isRemovingBool,
        doRemoveResource,
    }: useManageChallengeResourcesProps = useManageChallengeResources(
        challengeId,
        {
            createdString: 'created',
        },
    )

    return (
        <PageWrapper
            pageTitle='Resource Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <>
                    <LinkButton
                        primary
                        size='lg'
                        to='add'
                        icon={PlusIcon}
                        iconToLeft
                        label='add resource'
                    />
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </>
            )}
        >
            {isLoading ? (
                <TableLoading />
            ) : (
                <>
                    {resources.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <div className={styles.blockTableContainer}>
                            <ResourceTable
                                datas={resources}
                                totalPages={totalPages}
                                page={page}
                                setPage={setPage}
                                setSort={setSort}
                                sort={sort}
                                isRemovingBool={isRemovingBool}
                                doRemoveItem={doRemoveResource}
                            />

                            {isRemovingBool && <ActionLoading />}
                        </div>
                    )}
                </>
            )}
        </PageWrapper>
    )
}

export default ManageResourcePage
