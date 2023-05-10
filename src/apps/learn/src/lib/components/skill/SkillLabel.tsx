import { FC } from 'react'

import { TCAEMSISkillType } from '../../data-providers'

import styles from './SkillLabel.module.scss'

interface SkillLabelProps {
    skill: string | TCAEMSISkillType
    theme: 'white' | 'gray' | undefined
}

const SkillLabel: FC<SkillLabelProps> = (props: SkillLabelProps) => (
    <div className={(props.theme === 'white' || props.theme === undefined) ? styles.wrap : styles.wrapGray}>
        <span className='body-small'>{typeof props.skill === 'string' ? props.skill : props.skill.name }</span>
    </div>
)

export default SkillLabel
