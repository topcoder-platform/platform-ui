/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable indent */
/* eslint-disable sort-keys */
/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useState,
    CSSProperties,
} from 'react'

import { components, ControlProps, Options,
    GroupBase, MultiValue, SingleValue, StylesConfig, ActionMeta } from 'react-select'
import AsyncSelect from 'react-select/async'

import { ContentLayout } from '~/libs/ui'
import { Skill } from '@talentSearch/lib/models/'
import MatcherService from '@talentSearch/lib/services/MatcherService'
import { SearchIcon } from '@heroicons/react/outline'
import SkillPill from './components/SkillPill'
import styles from './TalentSearch.module.scss'

function search(skills:Options<Skill>): void {
    alert(JSON.stringify(skills))
}

const Control: React.FC<ControlProps<Skill, boolean, GroupBase<Skill>>> = ({ children, ...props }) => (
    <components.Control {...props}>
        {children}
        <span
            onClick={() => search(props.getValue())}
            className={styles.searchIconSpan}
        >
            <SearchIcon className={styles.searchIcon} />
        </span>
    </components.Control>
)

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<Array<Skill>>([])

    function toggleSkill(skill:Skill): void {
        let newFilter: Array<Skill> = []
        let deleted: boolean = false
        if (skillsFilter) {
            // Either delete the value from the list, if we're toggling one that's already in the list
            // Or add the new item to the list
            skillsFilter.forEach((filterSkill, index) => {
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

    function onChange(options:MultiValue<Skill> | SingleValue<Skill>, meta:ActionMeta<Skill>): void {
        if (Array.isArray(options)) {
            setSkillsFilter(options)
        } else {
            setSkillsFilter([])
        }
    }

    function filteringSkill(skill:Skill): boolean {
        let result: boolean = false
        skillsFilter.forEach((filterSkill, index) => {
            if (filterSkill.emsiId === skill.emsiId) {
                result = true
            }
        })

        return result
    }

    const popularSkills:Skill[][] = [
        [{ name: 'Typescript', emsiId: 'KS441LF7187KS0CV4B6Y' },
         { name: 'Front-End Engineering', emsiId: 'KS1244K6176NLVWV02B6' },
         { name: 'Bootstrap (Front-End Framework)', emsiId: 'KS1214R5XG4X4PY7LGY6' }],
        [{ name: 'Cascading Style Sheets (CSS)', emsiId: 'KS121F45VPV8C9W3QFYH' },
         { name: 'JavaScript (Programming Language)', emsiId: 'KS1200771D9CR9LB4MWW' }],
        [{ name: 'HyperText Markup Language (HTML)', emsiId: 'KS1200578T5QCYT0Z98G' },
         { name: 'IOS Development', emsiId: 'ES86A20379CD2AD061F3' },
         { name: 'Node.js', emsiId: 'KS127296VDYS7ZFWVC46' }],
        [{ name: '.NET Development', emsiId: 'ES50D03AC9CFC1A0BC93' },
         { name: 'C++ (Programming Language)', emsiId: 'KS1219W70LY1GXZDSKW5' },
         { name: 'PHP Development', emsiId: 'KS127SZ60YZR8B5CQKV1' }],
        [{ name: 'Adobe Illustrator', emsiId: 'KS1206V6K46N1SDVJGBD' },
         { name: 'Ruby (Programming Language)', emsiId: 'ESD07FEE22E7EC094EB8' },
         { name: 'Java (Programming Language)', emsiId: 'KS120076FGP5WGWYMP0F' }],
        [{ name: 'React Native', emsiId: 'KSPSGF5MXB6568UIQ4BK' },
         { name: 'User Experience (UX)', emsiId: 'KS441PL6JPXW200W0GRQ' }],
    ]

    const controlStyle: CSSProperties = {
        borderColor: 'black',
        paddingTop: '10px',
        paddingBottom: '10px',
    }

    const placeholderStyle: CSSProperties = {
        height: '36px',
        paddingTop: '4px',
        color: '#2A2A2A',
        fontSize: '16',
        fontFamily: 'Roboto',
        fontWeight: 400,
    }

    const multiValueStyle: CSSProperties = {
        backgroundColor: 'white',
        border: '1px solid #d4d4d4',
        color: '#333',
        borderRadius: '24px',
        height: '32px',
        fontFamily: 'Roboto',
        fontWeight: '400',
        fontSize: '14',
        paddingRight: '8px',
        paddingLeft: '8px',
        marginRight: '10px',
    }

    const multiValueRemoveStyle: CSSProperties = {
        width: '12px',
        height: '12px',
        backgroundColor: '#d9d9d9',
        color: '#333',
        marginTop: 'auto',
        marginBottom: 'auto',
        marginRight: '5px',
        marginLeft: '5px',
        borderRadius: '11px',
        border: '1px solid #d4d4d4',
        fontSize: '12',
        padding: '0px',
    }

    const hiddenStyle: CSSProperties = {
        display: 'none',
    }

    const selectStyle: StylesConfig<Skill> = {
        control: (provided, state) => {
          return {
            ...provided,
            ...controlStyle,
          }
        },
        multiValue: (provided, state) => {
            return {
              ...provided,
              ...multiValueStyle,
            }
        },
        multiValueRemove: (provided, state) => {
            return {
            ...provided,
            ...multiValueRemoveStyle,
            }
        },
        clearIndicator: (provided, state) => {
            return {
                ...provided,
                ...hiddenStyle,
            }
        },
        dropdownIndicator: (provided, state) => {
            return {
                ...provided,
                ...hiddenStyle,
            }
        },
        indicatorSeparator: (provided, state) => {
            return {
                ...provided,
                ...hiddenStyle,
            }
        },
        placeholder: (provided, state) => {
            return {
                ...provided,
                ...placeholderStyle,
            }
        },
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
                <AsyncSelect
                    isMulti
                    cacheOptions
                    autoFocus
                    defaultOptions
                    placeholder='Enter skills you are searching for...'
                    loadOptions={MatcherService.autoCompleteSkills}
                    name='skills'
                    styles={selectStyle}
                    className={styles.searchSelect}
                    getOptionLabel={(skill: Skill) => skill.name}
                    getOptionValue={(skill: Skill) => skill.emsiId}
                    components={{ Control }}
                    openMenuOnClick={false}
                    value={skillsFilter}
                    onChange={(
                            newValue: MultiValue<Skill> | SingleValue<Skill>,
                            actionMeta: ActionMeta<Skill>,
                        ) => onChange(newValue, actionMeta)}
                />
            </div>
            <div className={styles.popularSkillsContainer}>
                <span className={styles.popularSkillsTitle}>Popular Skills</span>

                {popularSkills.map(
                    row => (
                        <div className={styles.pillRow}>
                            {row.map(skill => (
                                <SkillPill
                                    skill={skill}
                                    selected={filteringSkill(skill)}
                                    onClick={toggleSkill}
                                />
                              ))}
                        </div>
                        ),
                )}
            </div>
        </ContentLayout>
    )
}

export default TalentSearch
