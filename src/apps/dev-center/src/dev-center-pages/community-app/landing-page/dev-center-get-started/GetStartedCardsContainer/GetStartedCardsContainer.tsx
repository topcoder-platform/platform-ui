import { FC } from 'react'

import { BookOpenIcon } from '@heroicons/react/outline'
import { LinkButton } from '~/libs/ui'

import {
    ApiCornerIcon,
    ApiIcon,
    CommunityAppCornerIcon,
    CommunityAppIcon,
    WorkManagerIcon,
} from '../../../../../assets/i'
import { DevCenterCard } from '../../dev-center-card'
import { rootRoute } from '../../../../../dev-center.routes'

import styles from './GetStartedCardsContainer.module.scss'

const GetStartedCardsContainer: FC = () => (
    <div>
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
                title='Platform UI'
                titleClass={styles.apiTitle}
                description='Check out instructions on how to get started with the Platform UI.'
                button={(
                    <LinkButton
                        primary
                        size='lg'
                        label='get started'
                        className={styles.button}
                        to={`${rootRoute}/platform-ui`}
                    />
                )}
            />
        </div>
        <div className={styles.container}>
            <DevCenterCard
                cornerIcon={<ApiCornerIcon />}
                icon={<BookOpenIcon className='icon-mx' />}
                title='Platform UI Storybook'
                titleClass={styles.apiTitle}
                description='Explore the Platform UI Storybook for UI development.'
                button={(
                    <LinkButton
                        primary
                        size='lg'
                        label='explore'
                        className={styles.button}
                        to={`${rootRoute}/storybook`}
                    />
                )}
            />
            <DevCenterCard
                cornerIcon={<ApiCornerIcon />}
                icon={<WorkManagerIcon className='icon-mx' />}
                title='Work Manager'
                titleClass={styles.communityTitle}
                description='Get familiar with the Work Manager and execute the starter code.'
                button={(
                    <LinkButton
                        primary
                        size='lg'
                        label='get started'
                        className={styles.button}
                        to={`${rootRoute}/work-manager-guide`}
                    />
                )}
            />
        </div>
    </div>
)

export default GetStartedCardsContainer
