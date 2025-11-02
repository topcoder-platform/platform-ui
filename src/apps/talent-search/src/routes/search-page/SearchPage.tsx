import { FC, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import type { UserSkill } from '~/libs/core'
import { ContentLayout, IconOutline } from '~/libs/ui'

import { SearchInput } from '../../components/search-input'
import { PopularSkills } from '../../components/popular-skills'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'
import { encodeUrlQuerySearch } from '../../lib/utils/search-query'

import styles from './SearchPage.module.scss'

export const SearchPage: FC = () => {
    const [params] = useSearchParams()
    const isMissingProfileRoute = params.get('memberNotFound') !== null

    const searchInputRef = useRef<HTMLInputElement>()
    const navigate = useNavigate()
    const [skillsFilter, setSkillsFilter] = useState<UserSkill[]>([])

    function navigateToResults(): void {
        const searchParams = encodeUrlQuerySearch(skillsFilter)
        navigate(`${TALENT_SEARCH_PATHS.results}?${searchParams}`)
    }

    function handleSelectSkillFilter(filter: Pick<UserSkill, 'id'|'name'>[]): void {
        setSkillsFilter(filter as UserSkill[])
        searchInputRef.current?.focus()
    }

    function renderHeader(): JSX.Element {
        return isMissingProfileRoute ? (
            <>
                <div className={styles.headerErrorWrap}>
                    <div className={styles.headerError}>
                        <IconOutline.ExclamationCircleIcon className='icon-xxxxl' />
                        <span>We were unable to locate that profile</span>
                    </div>
                </div>
                <div className={styles.subHeader}>
                    <div className={styles.subHeaderText}>
                        You can also try finding members through our Talent Search:
                    </div>
                </div>
            </>
        ) : (
            <>
                <div className={styles.searchHeader}>
                    <span className={styles.searchHeaderText}>Looking for a technology expert?</span>
                </div>
                <div className={styles.subHeader}>
                    <div className={styles.subHeaderText}>
                        Search thousands of skills to match with our global experts.
                    </div>
                </div>
            </>
        )
    }

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
        >
            {renderHeader()}
            <div className={styles.searchOptions}>
                <span className={styles.searchPrompt}>Search by skills</span>
                <SearchInput
                    autoFocus
                    skills={skillsFilter}
                    onChange={handleSelectSkillFilter}
                    onSearch={navigateToResults}
                    inputRef={searchInputRef}
                />
            </div>
            <PopularSkills
                selectedSkills={skillsFilter}
                onChange={handleSelectSkillFilter}
            />
        </ContentLayout>
    )
}

export default SearchPage
