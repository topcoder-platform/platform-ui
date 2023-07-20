import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ContentLayout } from '~/libs/ui'
import { Skill } from '~/libs/shared'

import { SearchInput } from '../../components/search-input'
import { PopularSkills } from '../../components/popular-skills'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'
import { encodeUrlQuerySearch } from '../../lib/utils/search-query'

import styles from './SearchPage.module.scss'

export const SearchPage: FC = () => {
    const navigate = useNavigate()
    const [skillsFilter, setSkillsFilter] = useState<Skill[]>([])

    function navigateToResults(): void {
        const searchParams = encodeUrlQuerySearch(skillsFilter)
        navigate(`${TALENT_SEARCH_PATHS.results}?${searchParams}`)
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
                <div className={styles.subHeaderText}>
                    Search thousands of skills to match with our global experts.
                </div>
            </div>
            <div className={styles.searchOptions}>
                <span className={styles.searchPrompt}>Search by skills</span>
                <SearchInput
                    autoFocus
                    skills={skillsFilter}
                    onChange={setSkillsFilter}
                    onSearch={navigateToResults}
                />
            </div>
            <PopularSkills selectedSkills={skillsFilter} onChange={setSkillsFilter} />
        </ContentLayout>
    )
}

export default SearchPage
