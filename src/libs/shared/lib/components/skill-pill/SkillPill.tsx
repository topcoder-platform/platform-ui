import { FC, ReactNode, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'
import { UserSkill } from '~/libs/core'

import { isSkillVerified } from '../../services'

import styles from './SkillPill.module.scss'

export interface SkillPillProps {
    children?: ReactNode
    onClick?: (skill: UserSkill) => void
    selected?: boolean
    skill: Pick<UserSkill, 'name'|'levels'>
    theme?: 'dark' | 'verified' | 'presentation' | 'etc' | 'catList'
}

const SkillPill: FC<SkillPillProps> = props => {
    const isVerified = useMemo(() => (
        isSkillVerified({ levels: props.skill.levels ?? [] })
    ), [props.skill])

    const className = classNames(
        styles.pill,
        props.onClick && styles.interactive,
        props.selected && styles.selected,
        styles[`theme-${isVerified ? 'verified' : ''}`],
        styles[`theme-${props.theme ?? ''}`],
    )

    const handleClick = useCallback(() => props.onClick?.call(undefined, props.skill as UserSkill), [
        props.onClick, props.skill,
    ])

    return (
        <div
            className={className}
            onClick={handleClick}
        >
            <span className={classNames('body-main', styles.text)}>
                {props.skill.name}
                {props.children}
            </span>
            {isVerified && <IconOutline.CheckCircleIcon />}
        </div>
    )
}

export default SkillPill
