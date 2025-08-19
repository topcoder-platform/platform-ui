/**
 * Challenge Phase Info.
 */
import { FC, useCallback, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import classNames from 'classnames'

import { SubmissionInfo } from '../../models'
import { useRole, useRoleProps } from '../../hooks'

import styles from './SubmissionBarInfo.module.scss'

interface Props {
    className?: string
    submission: SubmissionInfo
}

export const SubmissionBarInfo: FC<Props> = (props: Props) => {
    const { myChallengeRoles }: useRoleProps = useRole()
    const uiItems = useMemo(() => {
        const data = props.submission
        return [
            {
                icon: 'icon-file',
                title: 'Submission ID',
                type: 'link',
                value: data.id,
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
                icon: 'icon-handle',
                style: {
                    color: data.userInfo?.handleColor,
                },
                title: 'Handle',
                type: 'link',
                value: data.userInfo?.memberHandle,
            },
        ]
    }, [props.submission, myChallengeRoles])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

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
                            <NavLink
                                to='#'
                                onClick={prevent}
                                style={item.style}
                            >
                                {item.value}
                            </NavLink>
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
