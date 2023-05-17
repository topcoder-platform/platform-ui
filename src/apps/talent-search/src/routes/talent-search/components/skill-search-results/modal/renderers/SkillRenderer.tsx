import SkillScore from '@talentSearch/lib/models/SkillScore'

import styles from './SkillRenderer.module.scss'

const SkillRenderer: (skillScore:SkillScore) => JSX.Element
= (skillScore:SkillScore): JSX.Element => {
    return (
        <div className={styles.skill}>
            <span>{skillScore.skill}</span>
        </div>
    )
}

export default SkillRenderer
