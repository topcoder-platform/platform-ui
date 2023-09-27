import { FC, useCallback } from 'react'

import { Skill, SkillPill } from '~/libs/shared'

import { SKILL_SEARCH_LIMIT } from '../../config'

import styles from './PopularSkills.module.scss'

// TODO: Make this configurable, or read from a service.  We need to discuss
// how we want to handle this.
const popularSkills: Skill[] = [
    { emsiId: 'KS120076FGP5WGWYMP0F', name: 'Java (Programming Language)' },
    { emsiId: 'KS126QY605N7YVHFYCTW', name: 'MySQL' },
    { emsiId: 'KS127296VDYS7ZFWVC46', name: 'Node.js' },
    { emsiId: 'KS121F45VPV8C9W3QFYH', name: 'Cascading Style Sheets (CSS)' },
    { emsiId: 'KS1200771D9CR9LB4MWW', name: 'JavaScript (Programming Language)' },
    { emsiId: 'KS1261Z68KSKR1X31KS3', name: 'Machine Learning' },
    { emsiId: 'KS120SX72T8B5VLXS1VN', name: 'Unit Testing' },
    { emsiId: 'KS120H6772VQ0MQ5RLVD', name: 'Angular (Web Framework)' },
    { emsiId: 'KS1200B62W5ZF38RJ7TD', name: '.NET Framework' },
    { emsiId: 'KS125LS6N7WP4S6SFTCK', name: 'Python (Programming Language)' },
    { emsiId: 'KS120GZ5YXC6YVM1NGPR', name: 'Android (Operating System)' },
    { emsiId: 'ES5269FD2583B0B9875C', name: 'Figma (Design Software)' },
    { emsiId: 'KS120V86MZWV9Z9LKQY3', name: 'Microsoft Azure' },
    { emsiId: 'KS1206V6K46N1SDVJGBD', name: 'Adobe Illustrator' },
    { emsiId: 'KSY4WFI1S164RQUBSPCC', name: 'Docker (Software)' },
    { emsiId: 'KSDJCA4E89LB98JAZ7LZ', name: 'React.js' },
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
            <div className={styles.wrapTitle}>Popular Skills</div>

            <div className={styles.pills}>
                {popularSkills.map(skill => (
                    <SkillPill
                        key={skill.emsiId}
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
