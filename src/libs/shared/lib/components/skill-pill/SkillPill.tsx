import { FC, ReactNode, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { isSkillVerified, Skill } from '../../services'

import styles from './SkillPill.module.scss'

export interface SkillPillProps {
    children?: ReactNode
    onClick?: (skill: Skill) => void
    selected?: boolean
    skill: Pick<Skill, 'name'|'skillSources'>
    theme?: 'dark' | 'verified' | 'presentation' | 'etc' | 'catList'
}

const SkillPill: FC<SkillPillProps> = props => {
    const isVerified = useMemo(() => (
        isSkillVerified({ skillSources: props.skill.skillSources ?? [] })
    ), [props.skill])

    const className = classNames(
        styles.pill,
        props.onClick && styles.interactive,
        props.selected && styles.selected,
        styles[`theme-${isVerified ? 'verified' : ''}`],
        styles[`theme-${props.theme ?? ''}`],
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
            {isVerified && <IconOutline.CheckCircleIcon />}
        </div>
    )
}

export default SkillPill
