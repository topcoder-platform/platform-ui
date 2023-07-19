import { FC } from 'react'

import { ContentLayout } from '~/libs/ui'

import { TalentCard } from '../../components/talent-card'

import styles from './SearchResultsPage.module.scss'

interface SearchResultsPageProps {
}

const SearchResultsPage: FC<SearchResultsPageProps> = props => {
    const a = 0
    console.log(a)

    return (
        <ContentLayout
            contentClass={styles.contentLayout}
            outerClass={styles['contentLayout-outer']}
            innerClass={styles['contentLayout-inner']}
        >
            <div className={styles.resultsWrap}>
                <TalentCard match={0.38} />
                <TalentCard match={0.45} />
                <TalentCard match={0.55} />
                <TalentCard match={0.66} />
                <TalentCard match={0.71} />
                <TalentCard match={0.76} />
                <TalentCard match={0.83} />
                <TalentCard match={0.89} />
                <TalentCard match={0.97} />
                <TalentCard match={1} />
            </div>
        </ContentLayout>
    )
}

export default SearchResultsPage
