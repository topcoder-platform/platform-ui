import { FC, PropsWithChildren, useMemo } from 'react'
import classNames from 'classnames'

import { StandardizedSkill, StandardizedSkillCategory } from '../../../services'
import { findSkillsMatches, groupSkillsByCategory } from '../../../lib'

import styles from './SimilarSkillsDropdown.module.scss'

interface SimilarSkillsDropdownProps extends PropsWithChildren {
    categories: StandardizedSkillCategory[]
    skillName?: string
    skills: StandardizedSkill[]
    isInputDirty?: boolean
}

const SimilarSkillsDropdown: FC<SimilarSkillsDropdownProps> = props => {
    const skillsList = useMemo(() => (
        (props.skillName ? findSkillsMatches(props.skills ?? [], props.skillName) : [])
    ), [props.skillName, props.skills])

    const groupedSkills = useMemo(() => groupSkillsByCategory(skillsList), [skillsList])

    const categories = useMemo(() => (
        props.categories.filter(c => !!groupedSkills[c.id])
    ), [props.categories, groupedSkills])

    return (
        <div className={classNames(styles.wrap, props.isInputDirty && styles.isDirty)}>
            {props.children}
            {props.skillName && skillsList.length > 0 && (
                <div className={styles.dropdown}>
                    <ul className={styles.categoryList}>
                        {categories.map(category => (
                            <li key={category.id}>
                                <div className='body-small-bold'>{category.name}</div>
                                <ul className={styles.skillList}>
                                    {groupedSkills[category.id].map(skill => (
                                        <li key={skill.id} className='body-small'>{skill.name}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default SimilarSkillsDropdown
