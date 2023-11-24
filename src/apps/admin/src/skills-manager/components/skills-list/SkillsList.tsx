import { FC } from 'react'

import { StandardizedSkill } from '../../services'

import styles from './SkillsList.module.scss'

interface SkillsListProps {
    skills: StandardizedSkill[]
}

const SkillsList: FC<SkillsListProps> = props => (
    <div className={styles.wrap}>
        <ul className={styles.listWrap}>
            {props.skills.map(skill => (
                <li className={styles.skillItem} key={skill.id}>
                    <div className='body-main'>
                        {skill.name}
                    </div>
                </li>
            ))}
        </ul>
    </div>
)

export default SkillsList
