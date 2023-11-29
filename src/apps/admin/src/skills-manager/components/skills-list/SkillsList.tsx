import { FC } from 'react'
import classNames from 'classnames'

import { InputCheckbox } from '~/libs/ui'

import { StandardizedSkill } from '../../services'

import styles from './SkillsList.module.scss'

interface SkillsListProps {
    className?: string
    skills: StandardizedSkill[]
    editMode?: boolean
    onSelect: (skill: StandardizedSkill) => void
    isSelected: (skill: StandardizedSkill) => boolean
    onEditSkill?: (skill: StandardizedSkill) => void
}

const SkillsList: FC<SkillsListProps> = props => {
    function handleToggle(skill: StandardizedSkill): void {
        if (!props.editMode) {
            props.onEditSkill?.(skill)
            return
        }

        props.onSelect(skill)
    }

    return (
        <div className={classNames(props.className, styles.wrap, props.editMode && styles.isEditMode)}>
            <ul className={styles.listWrap}>
                {props.skills.map(skill => (
                    <li className={styles.skillItem} key={skill.id} onClick={function toggl() { handleToggle(skill) }}>
                        {props.editMode && (
                            <div className={styles.checkbox}>
                                <InputCheckbox
                                    name='toggle-skill'
                                    accent='blue'
                                    checked={props.isSelected(skill)}
                                    onChange={function toggl() { handleToggle(skill) }}
                                />
                            </div>
                        )}
                        <div className='body-main'>
                            {skill.name}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default SkillsList
