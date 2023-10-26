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
        id: '63bb7cfc-b0d4-4584-820a-18c503b4b0fe',
        levels: [],
        name: 'Java',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '0d86f8cb-e509-4ca8-b9f8-e65d909cc6eb',
        levels: [],
        name: 'MySQL',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '32899253-5989-4c33-9948-cad29c9e0ab0',
        levels: [],
        name: 'Node.js',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '9c42c728-47ff-4b20-916c-560739bad1ee',
        levels: [],
        name: 'Cascading Style Sheets (CSS)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '16ee1403-8e73-497d-a766-623eefd3c806',
        levels: [],
        name: 'JavaScript',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '99e5fc45-5fc0-4794-a578-f42dfabcbf74',
        levels: [],
        name: 'Machine Learning',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'a0da6acf-2cf8-48f0-ba4a-30d18bc75052',
        levels: [],
        name: 'Unit Testing',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '7e8641e5-e5c1-4ab6-a8f4-1fd6a8686dbe',
        levels: [],
        name: 'Angular',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'f0597e53-9a6d-40d6-8639-4d5a9ead190f',
        levels: [],
        name: '.NET Framework',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'fcbac194-35ab-4a31-aa7c-a2867fff9c4b',
        levels: [],
        name: 'Python',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'adf9d7b9-d639-4a73-8772-673b3d4f41b0',
        levels: [],
        name: 'Android',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '130323ce-7d88-4141-9e2b-904994f026a1',
        levels: [],
        name: 'Figma (Design Software)',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '9eaf6049-402a-481c-ac82-87a0826128c7',
        levels: [],
        name: 'Microsoft Azure',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'ced0b36c-6057-48e1-a263-2588fb91296b',
        levels: [],
        name: 'Adobe Illustrator',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: 'be85b096-b841-45b4-a5cb-1d3ee7ce1126',
        levels: [],
        name: 'Docker',
    },
    {
        category: {
            id: '481b5ebc-2fe6-45ed-a90c-736936d458d7',
            name: 'Programming and Development',
        },
        id: '4458454c-9a97-4332-a545-6546e240dab6',
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
