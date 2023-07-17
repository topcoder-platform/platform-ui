/* eslint-disable react/jsx-no-bind */
import {
    CSSProperties,
    FC,
    useState,
} from 'react'
import { components, ControlProps, GroupBase,
    MultiValue, Options, SingleValue, StylesConfig } from 'react-select'
import AsyncSelect from 'react-select/async'
import PropTypes from 'prop-types'

import { SearchIcon } from '@heroicons/react/outline'
import { ContentLayout } from '~/libs/ui'
import { Skill } from '@talentSearch/lib/models/'
import MatcherService from '@talentSearch/lib/services/MatcherService'

import SkillPill from './components/SkillPill'
import styles from './TalentSearch.module.scss'

function search(skills:Options<Skill>): void {
    alert(JSON.stringify(skills))
}

// eslint-disable-next-line react/destructuring-assignment, @typescript-eslint/typedef
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

Control.propTypes = {
    children: PropTypes.node.isRequired,
    getValue: PropTypes.func.isRequired,
}

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<Array<Skill>>([])

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

    function onChange(options:MultiValue<Skill> | SingleValue<Skill>): void {
        if (Array.isArray(options)) {
            setSkillsFilter(options)
        } else {
            setSkillsFilter([])
        }
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

    const controlStyle: CSSProperties = {
        borderColor: 'black',
        paddingBottom: '10px',
        paddingTop: '10px',
    }

    const placeholderStyle: CSSProperties = {
        color: '#2A2A2A',
        fontFamily: 'Roboto',
        fontSize: '16',
        fontWeight: 400,
        height: '36px',
        paddingTop: '4px',
    }

    const multiValueStyle: CSSProperties = {
        backgroundColor: 'white',
        border: '1px solid #d4d4d4',
        borderRadius: '24px',
        color: '#333',
        fontFamily: 'Roboto',
        fontSize: '14',
        fontWeight: '400',
        height: '32px',
        marginRight: '10px',
        paddingLeft: '8px',
        paddingRight: '8px',
    }

    const multiValueRemoveStyle: CSSProperties = {
        backgroundColor: '#d9d9d9',
        border: '1px solid #d4d4d4',
        borderRadius: '11px',
        color: '#333',
        fontSize: '12',
        height: '12px',
        marginBottom: 'auto',
        marginLeft: '5px',
        marginRight: '5px',
        marginTop: 'auto',
        padding: '0px',
        width: '12px',
    }

    const hiddenStyle: CSSProperties = {
        display: 'none',
    }

    const selectStyle: StylesConfig<Skill> = {
        clearIndicator: provided => ({
            ...provided,
            ...hiddenStyle,
        }),
        control: provided => ({
            ...provided,
            ...controlStyle,
        }),
        dropdownIndicator: provided => ({
            ...provided,
            ...hiddenStyle,
        }),
        indicatorSeparator: provided => ({
            ...provided,
            ...hiddenStyle,
        }),
        multiValue: provided => ({
            ...provided,
            ...multiValueStyle,
        }),
        multiValueRemove: provided => ({
            ...provided,
            ...multiValueRemoveStyle,
        }),
        placeholder: provided => ({
            ...provided,
            ...placeholderStyle,
        }),
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
                    ) => onChange(newValue)}
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
