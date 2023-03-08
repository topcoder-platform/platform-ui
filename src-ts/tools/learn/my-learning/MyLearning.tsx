import { FC } from 'react'

import { GenericPageMoved } from '../../../lib'
import { PageTitle } from '../learn-lib'
import { LEARN_PATHS } from '../learn.routes'

/**
 * Page deprecated
 * TODO: REMOVE ALL code related to my learning page
 */

const MyLearning: FC<{}> = () => (
    <>
        <PageTitle>Page Moved</PageTitle>
        <GenericPageMoved pageTitle='Topcoder Academy' newPageUrl={LEARN_PATHS.root} />
    </>
)

export default MyLearning
