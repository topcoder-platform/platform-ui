import { FC, useMemo, useState } from 'react'

import { ContentLayout, IconOutline, InputMultiselectOption } from '~/libs/ui'
import { EmsiSkill, EmsiSkillSources, InputSkillSelector } from '~/libs/shared'
import { Skill } from '@talentSearch/lib/models/'

import SkillPill from './components/SkillPill'
import styles from './TalentSearch.module.scss'

// TODO: Make this configurable, or read from a service.  We need to discuss
// how we want to handle this.
const popularSkills:Skill[][] = [
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

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<Array<Skill>>([])
    const emsiSkills: EmsiSkill[] = useMemo(() => skillsFilter.map(s => ({
        name: s.name,
        skillId: s.emsiId,
        skillSources: [EmsiSkillSources.selfPicked],
    })), [skillsFilter])

    function toggleSkill(skill:Skill): void {
        let newFilter: Array<Skill> = []
        let deleted: boolean = false
        if (skillsFilter) {
            // Either delete the value from the list, if we're toggling one that's already in the list
            // Or add the new item to the list
            skillsFilter.forEach(filterSkill => {
                if (filterSkill.emsiId === skill.emsiId) {
                    deleted = true
                } else {
                    newFilter.push(filterSkill)
                }
            })
            if (deleted === false) {
                newFilter = skillsFilter.concat(skill)
            }

            setSkillsFilter(newFilter)
        }
    }

    function onChange(ev: any): void {
        const options = (ev.target.value as unknown) as InputMultiselectOption[]
        setSkillsFilter(options.map(v => ({
            emsiId: v.value,
            name: v.label as string,
        })))
    }

    function filteringSkill(skill:Skill): boolean {
        let result: boolean = false
        skillsFilter.forEach(filterSkill => {
            if (filterSkill.emsiId === skill.emsiId) {
                result = true
            }
        })

        return result
    }

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
        >
            <div className={styles.searchHeader}>
                <span className={styles.searchHeaderText}>Looking for a technology expert?</span>
            </div>
            <div className={styles.subHeader}>
                <span className={styles.subHeaderText}>
                    Search thousands of skills to match with our global experts.
                </span>
            </div>
            <div className={styles.searchOptions}>
                <span className={styles.searchPrompt}>Search by skills</span>
                <InputSkillSelector
                    placeholder='Enter skills you are searching for...'
                    useWrapper={false}
                    theme='clear'
                    dropdownIcon={<IconOutline.SearchIcon className={styles.searchIcon} />}
                    value={emsiSkills}
                    onChange={onChange}
                />
            </div>
            <div className={styles.popularSkillsContainer}>
                <span className={styles.popularSkillsTitle}>Popular Skills</span>

                {popularSkills.map((row, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className={styles.pillRow} key={i}>
                        {row.map(skill => (
                            <SkillPill
                                key={skill.emsiId}
                                skill={skill}
                                selected={filteringSkill(skill)}
                                onClick={toggleSkill}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </ContentLayout>
    )
}

export default TalentSearch
