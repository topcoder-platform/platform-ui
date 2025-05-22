import { FC, PropsWithChildren } from 'react'

import { UserProfile } from '~/libs/core'

import { useCanViewPayout } from '../hooks/use-can-view-payout'

export interface PayoutGuardProps {
    profile?: UserProfile
}

export const PayoutGuard: FC<PayoutGuardProps & PropsWithChildren> = props => {
    const canViewPayout = useCanViewPayout(props.profile)

    return (
        <>{canViewPayout && props.children}</>
    )
}
