import {
    FC,
} from 'react'

import { PageWrapper } from '~/apps/review/src/lib'

import { EngagementLeadsTab } from '../../../lib/components'

export const EngagementLeadsListPage: FC = () => (
    <PageWrapper
        breadCrumb={[]}
        pageTitle='Leads'
    >
        <EngagementLeadsTab />
    </PageWrapper>
)

export default EngagementLeadsListPage
