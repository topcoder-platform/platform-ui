import {
    FC,
    useEffect,
    useState,
} from 'react'

import codes from "country-calling-code";

import { ContentLayout } from '~/libs/ui'
import SkillSearchResults from './components/skill-search-results/SkillSearchResults'
import Skill from '@talentSearch/lib/models/Skill'
import AsyncSelect from 'react-select/async';

import MatcherService from '@talentSearch/lib/services/MatcherService'

import styles from './TalentSearch.module.scss'

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<ReadonlyArray<Skill>>([]);

    return (
            <ContentLayout
                contentClass={styles.contentLayout}
                outerClass={styles['contentLayout-outer']}
                innerClass={styles['contentLayout-inner']}
            >
            <div className={styles['header']}>
              <h2>Talent search</h2>
            </div>
            <div className={styles['options']}>
                <h4>Select Skills:</h4>
                <AsyncSelect
                    isMulti
                    cacheOptions
                    loadOptions={MatcherService.autoCompleteSkills}
                    name="skills"
                    className="basic-multi-select"
                    classNamePrefix="select"
                    getOptionLabel={(skill: Skill) => skill.name}
                    getOptionValue={(skill: Skill) => skill.emsiId}
                    onChange={(option: readonly Skill[]) => {
                        setSkillsFilter(option);
                    }}
                />
            </div>
            
            <h2>Search Results</h2>
            <hr></hr>
            <SkillSearchResults 
                skillsFilter={skillsFilter}
            />
            
            </ContentLayout>
    )
}

export default TalentSearch
