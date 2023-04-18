import { FC } from 'react'

import { LinkButton } from '~/libs/ui'

import { ApiCornerIcon, ApiIcon, CommunityAppCornerIcon, CommunityAppIcon } from '../../../../../assets/i'
import { DevCenterCard } from '../../dev-center-card'

import styles from './GetStartedCardsContainer.module.scss'

const GetStartedCardsContainer: FC = () => (
    <div className={styles.container}>
        <DevCenterCard
            cornerIcon={<CommunityAppCornerIcon />}
            icon={<CommunityAppIcon />}
            title='Community App'
            titleClass={styles.communityTitle}
            description='Learn about Topcoder Community App and run started code.'
            button={(
                <LinkButton
                    primary
                    size='lg'
                    label='get started'
                    className={styles.button}
                    to='/dev-center/getting-started'
                />
            )}
        />
        <DevCenterCard
            cornerIcon={<ApiCornerIcon />}
            icon={<ApiIcon />}
            title='TopCoder api'
            titleClass={styles.apiTitle}
            description='Explore API libraries and integrate with API endpoints.'
            button={<h4 className={styles.comingSoon}>Coming soon</h4>}
        />
    </div>
)

export default GetStartedCardsContainer
