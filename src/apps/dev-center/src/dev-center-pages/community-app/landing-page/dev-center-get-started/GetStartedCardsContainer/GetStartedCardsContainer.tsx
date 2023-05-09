import { FC } from 'react'

import { LinkButton } from '~/libs/ui'

import { ApiCornerIcon, ApiIcon, CommunityAppCornerIcon, CommunityAppIcon } from '../../../../../assets/i'
import { DevCenterCard } from '../../dev-center-card'
import { rootRoute } from '../../../../../dev-center.routes'

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
                    to={`${rootRoute}/getting-started`}
                />
            )}
        />
        <DevCenterCard
            cornerIcon={<ApiCornerIcon />}
            icon={<ApiIcon />}
            title='Platform UI Storybook'
            titleClass={styles.apiTitle}
            description='Explore the Platform UI Storybook for UI development.'
            button={(
                <LinkButton
                    primary
                    size='lg'
                    label='get started'
                    className={styles.button}
                    to={`${rootRoute}/storybook`}
                />
            )}
        />
    </div>
)

export default GetStartedCardsContainer
