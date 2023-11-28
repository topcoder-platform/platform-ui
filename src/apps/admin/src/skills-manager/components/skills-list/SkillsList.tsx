import { FC } from 'react'
import CheckBox from 'rc-checkbox'
import classNames from 'classnames'

import { StandardizedSkill } from '../../services'

import styles from './SkillsList.module.scss'

interface SkillsListProps {
    skills: StandardizedSkill[]
    editMode?: boolean
    onSelect: (skill: StandardizedSkill) => void
    isSelected: (skill: StandardizedSkill) => boolean
}

const SkillsList: FC<SkillsListProps> = props => {
    function handleToggle(skill: StandardizedSkill): void {
        if (!props.editMode) {
            return
        }

        props.onSelect(skill)
    }

    return (
        <div className={classNames(styles.wrap, props.editMode && styles.isEditMode)}>
            <ul className={styles.listWrap}>
                {props.skills.map(skill => (
                    <li className={styles.skillItem} key={skill.id}>
                        {props.editMode && (
                            <div className={styles.checkbox}>
                                <CheckBox
                                    checked={props.isSelected(skill)}
                                    onChange={function toggl() { handleToggle(skill) }}
                                />
                            </div>
                        )}
                        <div className='body-main' onClick={function toggl() { handleToggle(skill) }}>
                            {skill.name}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default SkillsList
