import { FC, useCallback, useRef, useState } from 'react'
import classNames from 'classnames'
import { AutoSizer, WindowScroller, CellMeasurerCache } from 'react-virtualized'


import { Button, ContentLayout, LinkButton, LoadingCircles } from '~/libs/ui'
import { HowSkillsWorkModal } from '~/libs/shared'

import { SearchInput } from '../../components/search-input'
import { useUrlQuerySearchParms } from '../../lib/utils/search-query'
import {
    InfiniteTalentMatchesResposne,
    useInfiniteTalentMatches,
} from '../../lib/services'

import styles from './SearchResultsPage.module.scss'
import 'react-virtualized/styles.css';
import SearchResultLayout from './SearchResultLayout'

// type CreateCellPositionerParams = {
//     cellMeasurerCache: CellMeasurerCache
//     columnCount: number
//     columnWidth: number
//     spacer: number
//   }

// const createCellPositioner = ({
//     cellMeasurerCache,
//     columnCount,
//     columnWidth,
//     spacer,
//   }: CreateCellPositionerParams) => {
//     return defaultCreateCellPositioner({
//       cellMeasurerCache,
//       columnCount,
//       columnWidth,
//       spacer,
//     });
//   }

const SearchResultsPage: FC = () => {
    const [showSkillsModal, setShowSkillsModal] = useState(false)
    const cache = useRef<CellMeasurerCache>(
        new CellMeasurerCache({
            defaultHeight: 300,
            fixedWidth: true,
        })
    )

    const [skills, setSkills] = useUrlQuerySearchParms('q')
    const {
        loading,
        matches,
        fetchNext,
        hasNext,
        total,
    }: InfiniteTalentMatchesResposne = useInfiniteTalentMatches(skills)

    const toggleSkillsModal = useCallback(() => setShowSkillsModal(s => !s), [])

    const skillsModalTriggerBtn = (
        <div className={styles.skillsPill}>
            <Button
                link
                label='Proven skills'
                onClick={toggleSkillsModal}
                variant='linkblue'
            />
        </div>
    )

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
                                    {total}
                                    &nbsp;Experts
                                </span>
                                &nbsp;that match your search
                            </span>
                            {skillsModalTriggerBtn}
                        </>
                    )}
                </div>
                <div style={{ width: '100%' }}>
                    <WindowScroller>
                        {({ height, scrollTop }) => (
                            <AutoSizer disableHeight>
                                {({ width }) => (
                                    <SearchResultLayout
                                        width={width}
                                        height={height}
                                        scrollTop={scrollTop}
                                        matches={matches}
                                        skills={skills}
                                        cache={cache}
                                    />
                                )}
                            </AutoSizer>
                        )}
                    </WindowScroller>    
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
