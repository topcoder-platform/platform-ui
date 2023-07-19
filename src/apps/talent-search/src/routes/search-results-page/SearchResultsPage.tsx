import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { ContentLayout, LoadingSpinner } from '~/libs/ui'
import { EmsiSkill } from '~/libs/shared'

import { TalentCard } from '../../components/talent-card'
import { SearchInput } from '../../components/search-input'
import { useUrlQuerySearchParms } from '../../lib/utils/search-query'
import { TalenMatchesResponse, useFetchTalenMatches } from '../../lib/services'

import styles from './SearchResultsPage.module.scss'

const SearchResultsPage: FC = () => {
    const [skills, setSkills] = useUrlQuerySearchParms('q')
    const { matches, loading }: TalenMatchesResponse = useFetchTalenMatches(skills, 1, 10)

    const isMatchingSkill = useCallback((skill: EmsiSkill) => (
        !!skills.find(s => skill.skillId === s.emsiId)
    ), [skills])

    return (
        <>
            <div className={styles.headerWrap}>
                <ContentLayout contentClass={styles.headerContentLayout}>
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
                <LoadingSpinner hide={!loading} />
                <div className={classNames('body-medium-normal', styles.summaryText)}>
                    We found&nbsp;
                    <span className='body-medium-medium'>
                        {matches.length}
                        &nbsp;Experts
                    </span>
                    &nbsp;that match your search
                </div>
                <div className={styles.resultsWrap}>
                    {matches.map(member => (
                        <TalentCard
                            member={member}
                            match={member.skillScore}
                            key={member.userId}
                            isMatchingSkill={isMatchingSkill}
                        />
                    ))}
                </div>
            </ContentLayout>
        </>
    )
}

export default SearchResultsPage
