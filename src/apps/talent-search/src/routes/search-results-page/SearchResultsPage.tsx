import { FC, useContext, useEffect, useRef } from 'react'
import classNames from 'classnames'

import { profileContext, ProfileContextData } from '~/libs/core'
import { Button, ContentLayout, LoadingCircles } from '~/libs/ui'

import { TalentCard } from '../../components/talent-card'
import { SearchInput } from '../../components/search-input'
import { useUrlQuerySearchParms } from '../../lib/utils/search-query'
import {
    InfiniteTalentMatchesResposne,
    triggerSprigSurvey,
    useInfiniteTalentMatches,
} from '../../lib/services'

import styles from './SearchResultsPage.module.scss'

const SearchResultsPage: FC = () => {
    const sprigFlag = useRef(false)
    const { profile }: ProfileContextData = useContext(profileContext)

    const [skills, setSkills] = useUrlQuerySearchParms('q')
    const {
        loading,
        matches,
        fetchNext,
        hasNext,
        total,
    }: InfiniteTalentMatchesResposne = useInfiniteTalentMatches(skills)

    useEffect(() => {
        if (profile?.userId && matches?.length && !sprigFlag.current) {
            sprigFlag.current = true
            triggerSprigSurvey(profile)
        }
    }, [profile, matches])

    return (
        <>
            <div className={styles.headerWrap}>
                <ContentLayout
                    contentClass={styles.headerContentLayout}
                    innerClass={styles.headerContentLayoutInner}
                >
                    <SearchInput
                        className={styles.searchInput}
                        skills={skills}
                        onChange={setSkills}
                    />
                </ContentLayout>
            </div>
            <ContentLayout
                contentClass={styles.contentLayout}
                outerClass={styles['contentLayout-outer']}
                innerClass={styles['contentLayout-inner']}
            >
                <div className={classNames('body-medium-normal', styles.summaryText)}>
                    {loading ? (
                        <>
                            Finding experts that match your search...
                        </>
                    ) : (
                        <>
                            We found&nbsp;
                            <span className='body-medium-medium'>
                                {total}
                                &nbsp;Experts
                            </span>
                            &nbsp;that match your search
                        </>
                    )}
                </div>
                <div className={styles.resultsWrap}>
                    {matches.map(member => (
                        <TalentCard
                            queriedSkills={skills}
                            member={member}
                            match={member.skillScore}
                            key={member.userId}
                        />
                    ))}
                </div>
                {loading && <LoadingCircles />}

                {hasNext && (
                    <div className={styles.moreBtn}>
                        <Button secondary size='lg' onClick={fetchNext}>Load more</Button>
                    </div>
                )}
            </ContentLayout>
        </>
    )
}

export default SearchResultsPage
