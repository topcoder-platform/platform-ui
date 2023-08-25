import { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import { profileContext, ProfileContextData } from '~/libs/core'
import { Button, ContentLayout, LinkButton, LoadingCircles } from '~/libs/ui'
import { EmsiSkillSources, HowSkillsWorkModal, SkillPill } from '~/libs/shared'

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
    const [showSkillsModal, setShowSkillsModal] = useState(false)
    const { profile }: ProfileContextData = useContext(profileContext)

    const [skills, setSkills] = useUrlQuerySearchParms('q')
    const {
        loading,
        matches,
        fetchNext,
        hasNext,
        total,
        partialMatches,
        perfectMatches,
        veryGoodMatches,
    }: InfiniteTalentMatchesResposne = useInfiniteTalentMatches(skills)

    const toggleSkillsModal = useCallback(() => setShowSkillsModal(s => !s), [])

    const skillsModalTriggerBtn = (
        <div className={styles.skillsPill}>
            <SkillPill
                skill={{ name: 'Proven skills', skillSources: [EmsiSkillSources.challengeWin] }}
                onClick={toggleSkillsModal}
            />
        </div>
    )

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
                    ) : !skills.length ? (
                        <span>
                            Search thousands of skills to match with our global experts.
                        </span>
                    ) : !total ? (
                        <span>
                            <div className={styles.noResultsNormal}>
                                Topcoder is supported by amazing talent from all over the world.
                            </div>
                            <div className={styles.noResultsBold}>
                                Please contact us, so we can connect you to experts with these skills.
                            </div>
                            <div>
                                <LinkButton
                                    primary
                                    size='lg'
                                    label='TALK TO AN EXPERT'
                                    to='https://go.topcoder.com/lets-talk/'
                                />
                            </div>
                        </span>
                    ) : (
                        <>
                            {skillsModalTriggerBtn}
                            <span>
                                We found&nbsp;
                                <span className='body-medium-medium highlighting'>
                                    {perfectMatches > 1 ? (
                                        <>
                                            {perfectMatches}
                                            &nbsp;perfect matches
                                        </>
                                    ) : perfectMatches === 1 ? (
                                        <>
                                            {perfectMatches}
                                            &nbsp;perfect match
                                        </>
                                    ) : veryGoodMatches > 1 ? (
                                        <>
                                            {veryGoodMatches}
                                            &nbsp;very good matches
                                        </>
                                    ) : veryGoodMatches === 1 ? (
                                        <>
                                            {veryGoodMatches}
                                            &nbsp;very good match
                                        </>
                                    ) : partialMatches > 1 ? (
                                        <>
                                            {partialMatches}
                                            &nbsp;partial matches
                                        </>
                                    ) : (
                                        <>
                                            {partialMatches}
                                            &nbsp;partial match
                                        </>
                                    )}
                                </span>
                                &nbsp;for your search
                            </span>
                            {skillsModalTriggerBtn}
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
                {showSkillsModal && (
                    <HowSkillsWorkModal onClose={toggleSkillsModal} isTalentSearch />
                )}
            </ContentLayout>
        </>
    )
}

export default SearchResultsPage
