/**
 * Campus program homepage listing the participating universities.
 */
import { FC, useContext } from 'react'

import { profileContext, ProfileContextData } from '~/libs/core'
import { RestrictedPage } from '~/libs/shared'
import { ContentLayout, PageTitle } from '~/libs/ui'

import { rootRoute } from '../../campus.routes'
import { useCanAccessCampusHome } from '../../lib/hooks'
import { CampusUniversity, CAMPUS_UNIVERSITIES } from '../../lib/config'
import { UniversityCard } from '../../lib/components'

import styles from './CampusHomePage.module.scss'

export const CampusHomePage: FC = () => {
    const { profile }: ProfileContextData = useContext(profileContext)
    const canAccess: boolean = useCanAccessCampusHome(profile)

    if (!canAccess) {
        return <RestrictedPage />
    }

    return (
        <ContentLayout>
            <PageTitle>Campus Program</PageTitle>

            <div className={styles.header}>
                <h1 className={styles.title}>Campus Program</h1>
                <p className={styles.subtitle}>
                    Select a university to track the participation and performance of its members.
                </p>
            </div>

            <div className={styles.cards}>
                {CAMPUS_UNIVERSITIES.map((university: CampusUniversity) => (
                    <UniversityCard
                        key={university.groupName}
                        to={`${rootRoute}/${encodeURIComponent(university.groupName)}`}
                        university={university}
                    />
                ))}
            </div>
        </ContentLayout>
    )
}

export default CampusHomePage
