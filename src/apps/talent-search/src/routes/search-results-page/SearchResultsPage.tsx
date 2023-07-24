import { FC, useCallback } from 'react'
import classNames from 'classnames'

import { Button, ContentLayout, LoadingCircles } from '~/libs/ui'
import { EmsiSkill } from '~/libs/shared'

import { TalentCard } from '../../components/talent-card'
import { SearchInput } from '../../components/search-input'
import { useUrlQuerySearchParms } from '../../lib/utils/search-query'
import { InfiniteTalentMatchesResposne, useInfiniteTalentMatches } from '../../lib/services'

import styles from './SearchResultsPage.module.scss'

const SearchResultsPage: FC = () => {
    const [skills, setSkills] = useUrlQuerySearchParms('q')
    const {
        loading,
        matches,
        fetchNext,
        hasNext,
        total,
    }: InfiniteTalentMatchesResposne = useInfiniteTalentMatches(skills)

    const isMatchingSkill = useCallback((skill: EmsiSkill) => (
        !!skills.find(s => skill.skillId === s.emsiId)
    ), [skills])

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
                            member={member}
                            match={member.skillScore}
                            key={member.userId}
                            isMatchingSkill={isMatchingSkill}
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
