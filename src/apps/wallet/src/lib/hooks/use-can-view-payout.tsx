import { useMemo } from 'react'

import { UserProfile } from '~/libs/core'

export const useCanViewPayout = (profile?: UserProfile): boolean => useMemo(() => (
    !!profile
        && !profile.email.toLowerCase()
            .includes('@wipro.com')
), [profile])
