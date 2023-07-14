/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useState,
} from 'react'

import AsyncSelect from 'react-select/async'
import { ContentLayout } from '~/libs/ui'
import MatcherService from '@talentSearch/lib/services/MatcherService'
import { Skill } from '@talentSearch/lib/models/'
import SkillSearchResults from './components/skill-search-results/SkillSearchResults'

import styles from './TalentSearch.module.scss'

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<ReadonlyArray<Skill>>([])

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
        >
            <div className={styles.header}>
                <h2>Talent search</h2>
            </div>
            <div className={styles.options}>
                <h4>Select Skills:</h4>
                <AsyncSelect
                    isMulti
                    cacheOptions
                    autoFocus
                    defaultOptions
                    placeholder='Start typing to autocomplete available EMSI skills'
                    loadOptions={MatcherService.autoCompleteSkills}
                    name='skills'
                    className='basic-multi-select'
                    classNamePrefix='select'
                    getOptionLabel={(skill: Skill) => skill.name}
                    getOptionValue={(skill: Skill) => skill.emsiId}
                    onChange={(option: readonly Skill[]) => {
                        setSkillsFilter(option)
                    }}
                />
            </div>

            <h2>Search Results</h2>
            <hr />
            <SkillSearchResults
                skillsFilter={skillsFilter}
            />

        </ContentLayout>
    )
}

export default TalentSearch
