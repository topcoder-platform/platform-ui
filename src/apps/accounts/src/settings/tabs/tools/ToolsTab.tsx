import { FC } from 'react'

import { UserProfile, UserTraits } from '~/libs/core'

import { Devices } from './devices'
import { Software } from './software'
import { ServiceProvider } from './service-provider'
import { Subscriptions } from './subscriptions'
import styles from './ToolsTab.module.scss'

interface ToolsTabProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const ToolsTab: FC<ToolsTabProps> = (props: ToolsTabProps) => (
    <div className={styles.container}>
        <h3>DEVICES AND SOFTWARES</h3>

        <Devices
            devicesTrait={props.memberTraits?.find((trait: UserTraits) => trait.traitId === 'device')}
            profile={props.profile}
        />

        <Software
            softwareTrait={props.memberTraits?.find((trait: UserTraits) => trait.traitId === 'software')}
            profile={props.profile}
        />

        <ServiceProvider
            serviceProviderTrait={props.memberTraits?.find((trait: UserTraits) => trait.traitId === 'service_provider')}
            profile={props.profile}
        />

        <Subscriptions
            subscriptionsTrait={props.memberTraits?.find((trait: UserTraits) => trait.traitId === 'subscription')}
            profile={props.profile}
        />
    </div>
)

export default ToolsTab
