import { FC, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { profileContext, ProfileContextData } from '~/libs/core'
import { ContentLayout, IconOutline } from '~/libs/ui'
import { Skill } from '~/libs/shared'

import { SearchInput } from '../../components/search-input'
import { PopularSkills } from '../../components/popular-skills'
import { TALENT_SEARCH_PATHS } from '../../talent-search.routes'
import { encodeUrlQuerySearch } from '../../lib/utils/search-query'
import { triggerSprigSurvey } from '../../lib/services'

import styles from './SearchPage.module.scss'

export const SearchPage: FC = () => {
    const sprigFlag = useRef(false)

    const [params] = useSearchParams()
    const isMissingProfileRoute = params.get('memberNotFound') !== null

    const searchInputRef = useRef<HTMLInputElement>()
    const navigate = useNavigate()
    const [skillsFilter, setSkillsFilter] = useState<Skill[]>([])

    const { profile }: ProfileContextData = useContext(profileContext)

    function navigateToResults(): void {
        const searchParams = encodeUrlQuerySearch(skillsFilter)
        navigate(`${TALENT_SEARCH_PATHS.results}?${searchParams}`)
    }

    function handleSelectSkillFilter(filter: Skill[]): void {
        setSkillsFilter(filter)
        searchInputRef.current?.focus()
    }

    useEffect(() => {
        if (!sprigFlag.current) {
            if (profile?.userId) {
                triggerSprigSurvey(profile)
            } else {
                triggerSprigSurvey()
            }

            sprigFlag.current = true
        }
    }, [profile, skillsFilter])

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
                    onChange={setSkillsFilter}
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
