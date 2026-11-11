/* Date and tab controls capture their selected values. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import 'react-responsive-modal/styles.css'

import { authUrlLogin, authUrlSignup, profileContext } from '~/libs/core'

import { dateKey, DISCUSS_URL, TimelineEvent } from './timeline-wall.models'
import { errorMessage, getAvatar, getCurrentUser, getEvents, getPendingEvents } from './timeline-wall.service'
import EventCard from './EventCard'
import EventComposer from './EventComposer'
import './timeline-wall.scss'

const TimelineWall: FC = () => {
    const profile = useContext(profileContext)
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [pending, setPending] = useState<TimelineEvent[]>([])
    const [adminHandle, setAdminHandle] = useState<string>()
    const isAdmin = !!profile.isLoggedIn && !!adminHandle && adminHandle === profile.profile?.handle
    const session = useRef<string>()
    session.current = isAdmin ? adminHandle : undefined
    const [tab, setTab] = useState<'timeline' | 'pending'>('timeline')
    const [loading, setLoading] = useState(true)
    const [pendingLoading, setPendingLoading] = useState(false)
    const [error, setError] = useState('')
    const [pendingError, setPendingError] = useState('')
    const [avatars, setAvatars] = useState<Record<string, string>>({})
    const [selectedDate, setSelectedDate] = useState('')
    const [mobileDates, setMobileDates] = useState(false)
    const currentYear = new Date()
        .getFullYear()
    const years = Array.from({ length: currentYear - 2002 + 1 }, (_, index) => currentYear - index)

    const reloadEvents = useCallback(async (): Promise<void> => {
        setError('')
        try {
            setEvents(await getEvents())
        } catch (failure) {
            setError(errorMessage(failure))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { reloadEvents() }, [reloadEvents])

    useEffect(() => {
        let active = true
        setAdminHandle(undefined)
        setPending([])
        setTab('timeline')
        if (profile.isLoggedIn && profile.profile?.handle) {
            getCurrentUser()
                .then(user => {
                    if (active && user.isAdmin) setAdminHandle(profile.profile?.handle)
                })
                .catch(failure => { if (active) setError(errorMessage(failure)) })
        }

        return () => { active = false }
    }, [profile.isLoggedIn, profile.profile?.handle])

    const reloadPending = useCallback(async (): Promise<void> => {
        if (!isAdmin) return
        const handle = adminHandle
        setPendingError('')
        try {
            const items = await getPendingEvents()
            if (session.current === handle) setPending(items)
        } catch (failure) {
            if (session.current === handle) setPendingError(errorMessage(failure))
        } finally {
            if (session.current === handle) setPendingLoading(false)
        }
    }, [isAdmin, adminHandle])

    useEffect(() => {
        if (!isAdmin) return undefined
        let active = true
        setPendingLoading(true)
        // Ignore responses from a previous administrator after logout or an account switch.
        const poll = (): void => {
            getPendingEvents()
                .then(items => { if (active) { setPending(items); setPendingError('') } })
                .catch(failure => { if (active) setPendingError(errorMessage(failure)) })
                .finally(() => { if (active) setPendingLoading(false) })
        }

        poll()
        const interval = window.setInterval(poll, 5 * 60 * 1000)
        return () => { active = false; window.clearInterval(interval) }
    }, [isAdmin, adminHandle])

    useEffect(() => {
        let active = true
        const handles = [...new Set([...events, ...pending].map(event => event.createdBy))]
        handles.filter(handle => avatars[handle] === undefined)
            .forEach(handle => {
                getAvatar(handle)
                    .catch(() => '')
                    .then(url => {
                        if (active) setAvatars(previous => ({ ...previous, [handle]: url }))
                    })
            })
        return () => { active = false }
        // Event changes trigger loading; functional updates merge concurrent results.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, pending])

    const sortedEvents = useMemo(() => [...events].sort((a, b) => (
        new Date(b.eventDate)
            .getTime() - new Date(a.eventDate)
            .getTime()
    )), [events])
    const showingPending = isAdmin && tab === 'pending'
    const visibleEvents = showingPending ? pending : sortedEvents

    function changed(): void {
        reloadEvents()
        reloadPending()
    }

    function navigateDate(value: string): void {
        const next = selectedDate === value ? '' : value
        setSelectedDate(next)
        setMobileDates(false)
        const target = sortedEvents.find(event => dateKey(event.eventDate)
            .startsWith(next))
            || [...sortedEvents].reverse()
                .find(event => dateKey(event.eventDate) >= next)
        if (next && target) {
            document.getElementById(`event-${target.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
            window.scrollTo({ behavior: 'smooth', top: 0 })
        }
    }

    return (
        <main className='timeline-wall'>
            <header className='timeline-banner'>
                <h1>Topcoder Timeline Wall</h1>
                {!showingPending && <a className='timeline-discuss' href={DISCUSS_URL}>Discuss →</a>}
                {isAdmin && (
                    <div className='timeline-tabs' aria-label='Timeline sections'>
                        <button type='button' aria-pressed={!showingPending} onClick={() => setTab('timeline')}>
                            Timeline View
                        </button>
                        <button type='button' aria-pressed={showingPending} onClick={() => setTab('pending')}>
                            {`Pending Approvals (${pending.length})`}
                        </button>
                    </div>
                )}
            </header>
            <div className='timeline-layout'>
                <div className='timeline-main'>
                    {!showingPending && (profile.isLoggedIn
                        ? <EventComposer key={profile.profile?.handle} isAdmin={isAdmin} onCreated={changed} />
                        : (
                            <p className='timeline-login'>
                                Please
                                {' '}
                                <a href={authUrlLogin(window.location.href)}>login</a>
                                {' '}
                                or
                                {' '}
                                <a href={authUrlSignup(window.location.href)}>create an account</a>
                                {' '}
                                to add an event.
                            </p>
                        ))}
                    {(showingPending ? pendingError : error) && (
                        <div role='alert' className='timeline-error'>
                            <p>{showingPending ? pendingError : error}</p>
                            <button type='button' onClick={showingPending ? reloadPending : reloadEvents}>Retry</button>
                        </div>
                    )}
                    {(showingPending ? pendingLoading : loading) && <p role='status'>Loading events…</p>}
                    <div className={showingPending ? 'timeline-pending' : 'timeline-events'}>
                        {visibleEvents.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                avatar={avatars[event.createdBy]}
                                isAdmin={isAdmin}
                                pending={showingPending}
                                onChanged={changed}
                            />
                        ))}
                    </div>
                    {!visibleEvents.length && !(showingPending ? pendingLoading || pendingError : loading || error) && (
                        <p className='timeline-empty'>
                            {showingPending
                                ? 'No pending approvals.' : 'No events have been added. Be the first who adds one.'}
                        </p>
                    )}
                </div>
                {!showingPending && (
                    <>
                        <button type='button' className='timeline-mobile-dates' onClick={() => setMobileDates(true)}>
                            {selectedDate || currentYear}
                            {' '}
                            ▾
                        </button>
                        <nav aria-label='Timeline dates' className={`timeline-dates ${mobileDates ? 'is-open' : ''}`}>
                            <button
                                type='button'
                                className='timeline-close-dates'
                                onClick={() => setMobileDates(false)}
                            >
                                Close dates
                            </button>
                            {years.map(year => (
                                <div key={year}>
                                    <button
                                        type='button'
                                        aria-pressed={selectedDate === String(year)}
                                        onClick={() => navigateDate(String(year))}
                                    >
                                        {year}
                                    </button>
                                    {selectedDate.startsWith(String(year)) && (
                                        <div className='timeline-months'>
                                            {Array.from(
                                                { length: year === currentYear ? new Date()
                                                    .getMonth() + 1 : 12 },
                                                (_, index) => index,
                                            )
                                                .reverse()
                                                .map(month => {
                                                    const value = `${year}-${String(month + 1)
                                                        .padStart(2, '0')}`
                                                    return (
                                                        <button
                                                            type='button'
                                                            key={value}
                                                            aria-pressed={selectedDate === value}
                                                            onClick={() => navigateDate(value)}
                                                        >
                                                            {new Date(year, month)
                                                                .toLocaleString('en-US', { month: 'long' })}
                                                        </button>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </>
                )}
            </div>
        </main>
    )
}

export default TimelineWall
