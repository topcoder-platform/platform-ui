import { FC, useState } from 'react'

import { ContentLayout } from '~/libs/ui'
import { Skill } from '~/libs/shared'

import { SearchInput } from '../../components/search-input'
import { PopularSkills } from '../../components/popular-skills'

import styles from './TalentSearch.module.scss'

export const TalentSearch: FC = () => {
    const [skillsFilter, setSkillsFilter] = useState<Skill[]>([])

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
                <div className={styles.subHeaderText}>
                    Search thousands of skills to match with our global experts.
                </div>
            </div>
            <div className={styles.searchOptions}>
                <span className={styles.searchPrompt}>Search by skills</span>
                <SearchInput skills={skillsFilter} onChange={setSkillsFilter} />
            </div>
            <PopularSkills selectedSkills={skillsFilter} onChange={setSkillsFilter} />
        </ContentLayout>
    )
}

export default TalentSearch
