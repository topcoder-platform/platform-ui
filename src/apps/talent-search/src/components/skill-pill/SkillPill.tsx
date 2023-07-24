import { FC, ReactNode, useCallback } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'
import { Skill } from '~/libs/shared'

import styles from './SkillPill.module.scss'

export interface SkillPillProps {
    children?: ReactNode
    onClick?: (skill: Skill) => void
    selected?: boolean
    skill: {name: string}
    theme?: 'dark' | 'verified' | 'light' | 'etc'
    verified?: boolean
}

const SkillPill: FC<SkillPillProps> = props => {
    const className = classNames(
        styles.pill,
        props.selected && styles.selected,
        styles[`theme-${props.verified ? 'verified' : (props.theme ?? 'light')}`],
    )

    const handleClick = useCallback(() => props.onClick?.call(undefined, props.skill as Skill), [
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
            {props.verified && <IconOutline.CheckCircleIcon />}
        </div>
    )
}

export default SkillPill
