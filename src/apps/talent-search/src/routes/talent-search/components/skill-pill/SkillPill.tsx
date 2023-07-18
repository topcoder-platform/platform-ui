import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { Skill } from '~/libs/shared'

import styles from './SkillPill.module.scss'

export interface SkillPillProps {
    onClick: (skill: Skill) => void
    selected: boolean
    skill: Skill
}

const SkillPill: FC<SkillPillProps> = props => {
    const handleClick = useCallback(() => props.onClick.call(undefined, props.skill), [
        props.onClick, props.skill,
    ])

    return (
        <span
            className={classNames(styles.pill, props.selected && styles.selected)}
            onClick={handleClick}
        >
            <span className='body-main'>
                {props.skill.name}
            </span>
        </span>
    )
}

export default SkillPill
