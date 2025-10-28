import { FC, MutableRefObject, useEffect, useRef } from 'react'

import { UserProfile } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { getTrolleyPortalLink } from '../../../lib/services/wallet'

import styles from './PayoutTab.module.scss'

interface PayoutTabProps {
    profile: UserProfile
}

const PayoutTab: FC<PayoutTabProps> = props => {
    const loading = useRef<number>()
    const frameRef: MutableRefObject<HTMLElement | any> = useRef()

    useEffect(() => {
        if (!props.profile.userId || props.profile.userId === loading.current) {
            return
        }

        loading.current = props.profile.userId
        getTrolleyPortalLink()
            .then((link: string) => {
                frameRef.current.src = link
            })
    }, [props.profile.userId])

    useEffect(() => {
        if (!frameRef.current) {
            return undefined
        }

        const handleEvent: (event: any) => void = (event: any) => {
            const { data: widgetEvent, origin }: { data: { event: string, data: number }, origin: string } = event

            if (origin.indexOf(EnvironmentConfig.TROLLEY_WIDGET_ORIGIN) === -1) {
                return
            }

            // resize iframe based on the reported content height
            if (widgetEvent.event === 'document.height') {
                Object.assign(frameRef.current.style, { height: `${widgetEvent.data}px` })
            }
        }

        window.addEventListener('message', handleEvent, false)
        return (): void => {
            window.removeEventListener('message', handleEvent, false)
        }
    }, [frameRef.current?.src])

    return (
        <div className={styles.wrap}>
            <iframe
                className={styles.iframe}
                ref={frameRef}
                title='Trolley'
            />
        </div>
    )
}

export default PayoutTab
