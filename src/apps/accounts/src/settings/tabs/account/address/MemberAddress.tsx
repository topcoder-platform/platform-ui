import { Dispatch, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import {
    Collapsible,
} from '~/libs/ui'
import {
    UserProfile,
} from '~/libs/core'

import styles from './MemberAddress.module.scss'

interface MemberAddressProps {
    profile: UserProfile
}

const MemberAddress: FC<MemberAddressProps> = (props: MemberAddressProps) => {
    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        country: props.profile.homeCountryCode || props.profile.competitionCountryCode,
        ...props.profile.addresses ? props.profile.addresses[0] : {},
    })

    console.log('formValues', formValues)

    return (
        <Collapsible
            header={<h3>Address</h3>}
            containerClass={styles.container}
            contentClass={styles.content}
        >
            <p>
                By keeping this information up to date we may surprise you with a cool T-shirt.
                Sharing your contact details will never result in robocalls about health insurance plans or junk mail.
            </p>

            <div className={styles.formWrap}>
                
            </div>
        </Collapsible>
    )
}

export default MemberAddress
