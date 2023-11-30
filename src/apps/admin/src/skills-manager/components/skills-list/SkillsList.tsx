import { FC, MouseEvent } from 'react'
import classNames from 'classnames'

import { InputCheckbox } from '~/libs/ui'

import { StandardizedSkill } from '../../services'
import { isSkillArchived } from '../../lib'

import styles from './SkillsList.module.scss'

interface SkillsListProps {
    className?: string
    skills: StandardizedSkill[]
    editMode?: boolean
    onSelect: (skill: StandardizedSkill) => void
    isSelected: (skill: StandardizedSkill) => boolean
    onEditSkill?: (skill: StandardizedSkill) => void
    onBulkEditSkill?: (skill: StandardizedSkill) => void
}

const SkillsList: FC<SkillsListProps> = props => {
    const handleSkillItemClick = (skill: StandardizedSkill) => (ev: MouseEvent) => {
        // prevent when clicking the checkbox
        const targetEl = ev.target as HTMLInputElement
        if (targetEl.nodeName === 'INPUT' && targetEl.type?.toLowerCase() === 'checkbox') {
            return
        }

        // trigger bulk edit when holding ctrl key and bulk editor is not active
        if (ev.ctrlKey && !props.editMode && props.onBulkEditSkill) {
            props.onBulkEditSkill(skill)
            setTimeout(props.onSelect, 100, skill)
            return
        }

        // toggle skill selection when holding ctrl key (rather than triggering skill edit)
        if (ev.ctrlKey) {
            props.onSelect(skill)
            return
        }

        props.onEditSkill?.(skill)
    }

    const handleCheckboxToggle = (skill: StandardizedSkill) => () => {
        props.onSelect(skill)
    }

    return (
        <div className={classNames(props.className, styles.wrap, props.editMode && styles.isEditMode)}>
            <ul className={styles.listWrap}>
                {props.skills.map(skill => (
                    <li
                        className={classNames(styles.skillItem, isSkillArchived(skill) && styles.archived)}
                        key={skill.id}
                        onClick={handleSkillItemClick(skill)}
                    >
                        {props.editMode && (
                            <div className={styles.checkbox}>
                                <InputCheckbox
                                    name='toggle-skill'
                                    accent='blue'
                                    checked={props.isSelected(skill)}
                                    onChange={handleCheckboxToggle(skill)}
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
