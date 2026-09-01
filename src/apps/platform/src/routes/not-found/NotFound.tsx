import { FC } from 'react'

import {
    ContentLayout,
    IconOutline,
    LinkButton,
    PageTitle,
} from '~/libs/ui'

import styles from './NotFound.module.scss'

/**
 * Fallback page for a path Platform UI is served for but has no route for.
 *
 * Without it react-router matches nothing, the router renders an empty
 * container inside the app shell, and the user is shown a blank page.
 */
const NotFoundPage: FC<{}> = () => (
    <ContentLayout outerClass={styles.container}>
        <PageTitle>Page Not Found | Topcoder</PageTitle>

        <div className={styles.content} role='alert'>
            <IconOutline.ExclamationCircleIcon className='icon-xxxl' />
            <h2 className={styles.title}>We were unable to find that page</h2>
            <p className='body-main'>
                The page you requested does not exist or is not available yet.
            </p>
            <LinkButton primary size='lg' to='/'>
                Go to the home page
            </LinkButton>
        </div>
    </ContentLayout>
)

export default NotFoundPage
