import { FC } from 'react'

import styles from './SkillLabel.module.scss'

interface SkillLabelProps {
    skill: string
}

const SkillLabel: FC<SkillLabelProps> = (props: SkillLabelProps) => (
    <div className={styles.wrap}>
        <span className='body-small'>{props.skill}</span>
    </div>
)

export default SkillLabel
