import { FC, useCallback } from 'react'

import { Skill, SkillPill } from '~/libs/shared'

import { SKILL_SEARCH_LIMIT } from '../../config'

import styles from './PopularSkills.module.scss'

// TODO: Make this configurable, or read from a service.  We need to discuss
// how we want to handle this.
const popularSkills: Skill[] = [
    { id: 'f81d2a78-ff52-4c77-8cdb-8863601b87c7', name: 'Java (Programming Language)' },
    { id: '1aabc882-c28d-4b56-8546-5e961b53bf5d', name: 'MySQL' },
    { id: 'b3181231-af8f-4a44-aff2-97fe00c57d76', name: 'Node.js' },
    { id: '4328c534-ba51-4589-a3e7-7b5ba76d2b55', name: 'Cascading Style Sheets (CSS)' },
    { id: 'e3b2b1f1-6bbf-4989-b53d-d8531a10ea5d', name: 'JavaScript (Programming Language)' },
    { id: '41ffc4d5-2e43-45e1-af36-ae7a23b47c21', name: 'Machine Learning' },
    { id: '047203fc-8c85-4be0-be0b-0e2fe11c3a16', name: 'Unit Testing' },
    { id: '8c6703bd-63dd-4f6d-9cf0-5b411e531a9f', name: 'Angular (Web Framework)' },
    { id: '34ec4bf0-0b44-4d04-9f11-e3daa2c045ce', name: '.NET Framework' },
    { id: 'a9bb69aa-edc2-4d5f-8141-de33a139f119', name: 'Python (Programming Language)' },
    { id: '67c623db-09e4-499d-800b-24868b1eb85b', name: 'Android (Operating System)' },
    { id: '36292f61-c359-42a4-89b9-95245ee494ea', name: 'Figma (Design Software)' },
    { id: 'cf39f07c-0e7a-48a2-acec-21834900c437', name: 'Microsoft Azure' },
    { id: 'b33f8342-8015-4244-afea-5fd089bf52a6', name: 'Adobe Illustrator' },
    { id: 'f21aecd2-5c67-4783-97a4-a77c67cf4f67', name: 'Docker (Software)' },
    { id: '43baf79e-3632-4b04-889a-7202cbf62a6c', name: 'React.js' },
]

interface PopularSkillsProps {
    onChange: (skills: Skill[]) => void
    selectedSkills: Skill[]
}

const PopularSkills: FC<PopularSkillsProps> = props => {

    const toggleSkill = useCallback((skill: Skill) => {
        let newFilter: Array<Skill> = []
        let deleted: boolean = false

        // Either delete the value from the list, if we're toggling one that's already in the list
        // Or add the new item to the list
        props.selectedSkills.forEach(filterSkill => {
            if (filterSkill.id === skill.id) {
                deleted = true
            } else {
                newFilter.push(filterSkill)
            }
        })
        if (deleted === false && props.selectedSkills.length >= SKILL_SEARCH_LIMIT) {
            return
        }

        if (deleted === false) {
            newFilter = props.selectedSkills.concat(skill)
        }

        props.onChange.call(undefined, newFilter)
    }, [props.onChange, props.selectedSkills])

    function isSelected(skill: Skill): boolean {
        return !!props.selectedSkills.find(s => s.id === skill.id)
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.wrapTitle}>Popular Skills</div>

            <div className={styles.pills}>
                {popularSkills.map(skill => (
                    <SkillPill
                        key={skill.id}
                        skill={skill}
                        selected={isSelected(skill)}
                        onClick={toggleSkill}
                    />
                ))}
            </div>
        </div>
    )
}

export default PopularSkills
