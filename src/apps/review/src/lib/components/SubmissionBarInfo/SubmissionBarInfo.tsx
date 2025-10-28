/**
 * Challenge Phase Info.
 */
import { FC, useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { BackendSubmission, ChallengeDetailContextModel } from '../../models'
import { useRole, useRoleProps } from '../../hooks'
import { ChallengeDetailContext } from '../../contexts'
import { getHandleUrl } from '../../utils'

import styles from './SubmissionBarInfo.module.scss'

interface Props {
    className?: string
    submission?: BackendSubmission
}

export const SubmissionBarInfo: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const {
        resourceMemberIdMapping,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const {
        submissionId = '',
    }: {
        submissionId?: string
    } = useParams<{
        submissionId: string
    }>()
    const useInfo = useMemo(
        () => resourceMemberIdMapping[props.submission?.memberId ?? ''],
        [resourceMemberIdMapping, props.submission],
    )
    const { myChallengeRoles }: useRoleProps = useRole()
    const submissionIdValue = props.submission?.id ?? submissionId
    const uiItems = useMemo(() => [
        {
            icon: 'icon-file',
            title: 'Submission ID',
            type: 'link',
            value: submissionIdValue,
        },
        {
            icon: 'icon-handle',
            title: 'My Role',
            value: (
                <div className={styles.blockMyRoles}>
                    {myChallengeRoles.map(item => (
                        <span key={item}>{item}</span>
                    ))}
                </div>
            ),
        },
        {
            href: getHandleUrl(useInfo),
            icon: 'icon-handle',
            style: {
                color: useInfo?.handleColor,
            },
            title: 'Handle',
            type: 'link',
            value: useInfo?.memberHandle ?? '',
        },
    ], [myChallengeRoles, submissionIdValue, useInfo])

    return (
        <div className={classNames(styles.container, props.className)}>
            {uiItems.map(item => (
                <div className={styles.blockItem} key={item.title}>
                    <span className={styles.circleWrapper}>
                        <i className={item.icon} />
                    </span>
                    <div>
                        <span>{item.title}</span>
                        {item.type === 'link' ? (
                            <a
                                href={item.href}
                                style={item.style}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {item.value}
                            </a>
                        ) : (
                            <strong style={item.style}>{item.value}</strong>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default SubmissionBarInfo
