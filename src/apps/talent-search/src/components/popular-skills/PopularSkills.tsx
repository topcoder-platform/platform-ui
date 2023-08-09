import { FC, useCallback } from 'react'

import { Skill, SkillPill } from '~/libs/shared'

import { SKILL_SEARCH_LIMIT } from '../../config'

import styles from './PopularSkills.module.scss'

// TODO: Make this configurable, or read from a service.  We need to discuss
// how we want to handle this.
const popularSkills: Skill[][] = [
    [{ emsiId: 'KS441LF7187KS0CV4B6Y', name: 'Typescript' },
        { emsiId: 'KS1244K6176NLVWV02B6', name: 'Front-End Engineering' },
        { emsiId: 'KS1214R5XG4X4PY7LGY6', name: 'Bootstrap (Front-End Framework)' }],
    [{ emsiId: 'KS121F45VPV8C9W3QFYH', name: 'Cascading Style Sheets (CSS)' },
        { emsiId: 'KS1200771D9CR9LB4MWW', name: 'JavaScript (Programming Language)' }],
    [{ emsiId: 'KS1200578T5QCYT0Z98G', name: 'HyperText Markup Language (HTML)' },
        { emsiId: 'ES86A20379CD2AD061F3', name: 'IOS Development' },
        { emsiId: 'KS127296VDYS7ZFWVC46', name: 'Node.js' }],
    [{ emsiId: 'ES50D03AC9CFC1A0BC93', name: '.NET Development' },
        { emsiId: 'KS1219W70LY1GXZDSKW5', name: 'C++ (Programming Language)' },
        { emsiId: 'KS127SZ60YZR8B5CQKV1', name: 'PHP Development' }],
    [{ emsiId: 'KS1206V6K46N1SDVJGBD', name: 'Adobe Illustrator' },
        { emsiId: 'ESD07FEE22E7EC094EB8', name: 'Ruby (Programming Language)' },
        { emsiId: 'KS120076FGP5WGWYMP0F', name: 'Java (Programming Language)' }],
    [{ emsiId: 'KSPSGF5MXB6568UIQ4BK', name: 'React Native' },
        { emsiId: 'KS441PL6JPXW200W0GRQ', name: 'User Experience (UX)' }],
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
            if (filterSkill.emsiId === skill.emsiId) {
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
        return !!props.selectedSkills.find(s => s.emsiId === skill.emsiId)
    }

    return (
        <div className={styles.wrap}>
            <div className='body-medium-bold'>Popular Skills</div>

            {popularSkills.map((row, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div className={styles.pillRow} key={i}>
                    {row.map(skill => (
                        <SkillPill
                            key={skill.emsiId}
                            skill={skill}
                            selected={isSelected(skill)}
                            onClick={toggleSkill}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

export default PopularSkills
