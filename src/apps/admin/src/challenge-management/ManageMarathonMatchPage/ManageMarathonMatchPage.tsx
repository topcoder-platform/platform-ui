import { FC } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton } from '~/libs/ui'

import { PageWrapper } from '../../lib'

import styles from './ManageMarathonMatchPage.module.scss'

interface Props {
    className?: string
}

export const ManageMarathonMatchPage: FC<Props> = (props: Props) => {
    const { challengeId = '' }: { challengeId?: string } = useParams<{
        challengeId: string
    }>()

    return (
        <PageWrapper
            pageTitle='Marathon Match Management'
            className={classNames(styles.container, props.className)}
            headerActions={(
                <LinkButton primary light to='./../..' size='lg'>
                    Back
                </LinkButton>
            )}
        >
            <div>Marathon Match management content will be implemented here.</div>
            <div>
                Challenge ID:
                {' '}
                {challengeId}
            </div>
        </PageWrapper>
    )
}

export default ManageMarathonMatchPage
