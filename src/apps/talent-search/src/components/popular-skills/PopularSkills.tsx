import { FC, useCallback } from 'react'

import { SkillPill } from '~/libs/shared'
import { UserSkill } from '~/libs/core'

import { SKILL_SEARCH_LIMIT } from '../../config'

import styles from './PopularSkills.module.scss'

// TODO: Make this configurable, or read from a service.  We need to discuss
// how we want to handle this.
// TODO: update this with the real list of popular skills
const popularSkills: UserSkill[] = [
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'f81d2a78-ff52-4c77-8cdb-8863601b87c7',
        levels: [],
        name: 'Java (Programming Language)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '1aabc882-c28d-4b56-8546-5e961b53bf5d',
        levels: [],
        name: 'MySQL',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'b3181231-af8f-4a44-aff2-97fe00c57d76',
        levels: [],
        name: 'Node.js',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '4328c534-ba51-4589-a3e7-7b5ba76d2b55',
        levels: [],
        name: 'Cascading Style Sheets (CSS)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'e3b2b1f1-6bbf-4989-b53d-d8531a10ea5d',
        levels: [],
        name: 'JavaScript (Programming Language)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '41ffc4d5-2e43-45e1-af36-ae7a23b47c21',
        levels: [],
        name: 'Machine Learning',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '047203fc-8c85-4be0-be0b-0e2fe11c3a16',
        levels: [],
        name: 'Unit Testing',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '8c6703bd-63dd-4f6d-9cf0-5b411e531a9f',
        levels: [],
        name: 'Angular (Web Framework)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '34ec4bf0-0b44-4d04-9f11-e3daa2c045ce',
        levels: [],
        name: '.NET Framework',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'a9bb69aa-edc2-4d5f-8141-de33a139f119',
        levels: [],
        name: 'Python (Programming Language)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '67c623db-09e4-499d-800b-24868b1eb85b',
        levels: [],
        name: 'Android (Operating System)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '36292f61-c359-42a4-89b9-95245ee494ea',
        levels: [],
        name: 'Figma (Design Software)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'cf39f07c-0e7a-48a2-acec-21834900c437',
        levels: [],
        name: 'Microsoft Azure',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'b33f8342-8015-4244-afea-5fd089bf52a6',
        levels: [],
        name: 'Adobe Illustrator',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'f21aecd2-5c67-4783-97a4-a77c67cf4f67',
        levels: [],
        name: 'Docker (Software)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '43baf79e-3632-4b04-889a-7202cbf62a6c',
        levels: [],
        name: 'React.js',
    },
]

interface PopularSkillsProps {
    onChange: (skills: UserSkill[]) => void
    selectedSkills: UserSkill[]
}

const PopularSkills: FC<PopularSkillsProps> = props => {

    const toggleSkill = useCallback((skill: UserSkill) => {
        let newFilter: Array<UserSkill> = []
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

    function isSelected(skill: UserSkill): boolean {
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
