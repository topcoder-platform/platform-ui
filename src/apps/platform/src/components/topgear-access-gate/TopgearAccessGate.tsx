import { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig } from '~/config'
import { authUrlLogin, ProfileContextData, useProfileContext } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import { hasTopgearAccess } from './topgear-access.service'
import styles from './TopgearAccessGate.module.scss'

interface Props {
    children: ReactNode
}

interface AccessResult {
    key: string
    state: 'allowed' | 'denied' | 'error'
}

/**
 * Withholds route children until login and Wipro - All membership are verified.
 * Rechecks on member/path changes; cancels old requests and never reuses a result
 * for another member. Anonymous visitors return to their full URL after login.
 *
 * @param props route tree to render only after access is granted.
 * @returns a loading, restricted, retry, or authorized route view.
 * @throws Does not throw; API failures leave the route tree unmounted.
 */
const WiproMemberGate: FC<Props> = props => {
    const { initialized, isLoggedIn, profile }: ProfileContextData = useProfileContext()
    const location = useLocation()
    const memberId = initialized && isLoggedIn && profile?.userId ? String(profile.userId) : ''
    const [attempt, setAttempt] = useState(0)
    const [result, setResult] = useState<AccessResult>()
    const accessKey = `${memberId}:${location.pathname}:${attempt}`
    const loginUrl = authUrlLogin(window.location.href)

    useEffect(() => {
        if (initialized && !memberId) {
            window.location.replace(loginUrl)
        }
    }, [initialized, memberId, loginUrl])

    useEffect(() => {
        if (!memberId) return undefined
        const controller = new AbortController()
        hasTopgearAccess(memberId, controller.signal)
            .then(allowed => {
                if (!controller.signal.aborted) {
                    setResult({ key: accessKey, state: allowed ? 'allowed' : 'denied' })
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) setResult({ key: accessKey, state: 'error' })
            })
        return () => controller.abort()
    }, [memberId, accessKey])

    /** Starts a fresh membership check without displaying previously authorized content. */
    const retry = useCallback((): void => setAttempt(value => value + 1), [])

    if (!initialized || !memberId || result?.key !== accessKey) {
        return (
            <LoadingSpinner
                message={initialized && !memberId ? 'Redirecting to login…' : 'Checking Topgear access…'}
            />
        )
    }

    if (result.state === 'allowed') return <>{props.children}</>

    return (
        <main className={styles.restricted}>
            <h1>{result.state === 'error' ? 'Unable to verify Topgear access' : 'Topgear access restricted'}</h1>
            <p>
                {result.state === 'error'
                    ? 'We could not verify your Wipro membership. Please try again.'
                    : 'Topgear is available only to members of the Wipro - All group.'}
            </p>
            {result.state === 'error' && <button onClick={retry} type='button'>Try again</button>}
            <a href='https://topgear-app.wipro.com'>Go to Topgear Home</a>
        </main>
    )
}

/**
 * Applies the Wipro membership gate to every route on the Topgear host only.
 * @param props nested Platform Router; other host integrations render normally.
 * @returns guarded Topgear content or unchanged children. Does not throw.
 */
export const TopgearAccessGate: FC<Props> = props => (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.topgear
        ? <WiproMemberGate>{props.children}</WiproMemberGate>
        : <>{props.children}</>
)
