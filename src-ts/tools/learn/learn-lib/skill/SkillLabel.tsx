import { FC } from 'react'

import styles from './SkillLabel.module.scss'

interface SkillLabelProps {
    skill: string
    theme: 'white' | 'gray' | undefined
}

const SkillLabel: FC<SkillLabelProps> = (props: SkillLabelProps) => (
    <div className={(props.theme === 'white' || props.theme === undefined) ? styles.wrap : styles.wrapGray}>
        <span className='body-small'>{props.skill}</span>
    </div>
)

export default SkillLabel
