/* eslint-disable no-void */
/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'
import {
    profileContext,
    ProfileContextData,
    tokenGetAsync,
} from '~/libs/core'
import {
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'

import {
    useTimelineWall,
    type UseTimelineWallResult,
} from '../../lib'
import { type RejectTimelineEventBody } from '../../lib/services'
import {
    PendingApprovals,
    TimelineEvents,
} from './components'
import topBanner from './assets/top-banner.png'
import topBannerMobile from './assets/top-banner-mobile.png'

import styles from './TimelineWallPage.module.scss'

interface TimelineFilterValue {
    month: number
    year: number
}

interface TimelineConfigExtension {
    TIMELINE?: {
        FORUM_LINK?: string
    }
}

const FORUM_LINK = (EnvironmentConfig as unknown as TimelineConfigExtension)
    .TIMELINE?.FORUM_LINK ?? `${EnvironmentConfig.TOPCODER_URL}/community`

/**
 * Public timeline wall page with optional authenticated admin moderation tools.
 *
 * @returns Timeline wall content.
 */
const TimelineWallPage: FC = () => {
    const currentTime = new Date()
    const thisYear = currentTime.getFullYear()

    const [tab, setTab] = useState<number>(0)
    const [authToken, setAuthToken] = useState<string | undefined>(undefined)
    const [showRightFilterMobile, setShowRightFilterMobile] = useState<boolean>(false)
    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768)
    const [selectedFilterValue, setSelectedFilterValue] = useState<TimelineFilterValue>({
        month: -1,
        year: 0,
    })

    const { isLoggedIn }: ProfileContextData = useContext(profileContext)

    const {
        approveEvent,
        deleteEvent,
        events,
        fetchAvatar,
        isAdmin,
        loadCurrentUser,
        loadEvents,
        loading,
        loadingApprovals,
        pendingApprovals,
        removeEvent,
        submitEvent,
        uploading,
        uploadResult,
        userAvatars,
    }: UseTimelineWallResult = useTimelineWall()

    useEffect(() => {
        document.title = 'Timeline Wall | Topcoder'
    }, [])

    useEffect(() => {
        const handleResize = (): void => {
            setIsMobile(window.innerWidth <= 768)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        let active = true

        async function resolveAuthToken(): Promise<void> {
            if (!isLoggedIn) {
                if (active) {
                    setAuthToken(undefined)
                }

                return
            }

            const tokenData = await tokenGetAsync()

            if (!active) {
                return
            }

            setAuthToken(tokenData.token)

            if (tokenData.token) {
                await loadCurrentUser(tokenData.token)
            }
        }

        void resolveAuthToken()

        return () => {
            active = false
        }
    }, [isLoggedIn, loadCurrentUser])

    useEffect(() => {
        if (!events.length) {
            return
        }

        const uniqueHandles = Array.from(new Set(events.map(item => item.createdBy)))
        uniqueHandles.forEach(handle => {
            if (!userAvatars[handle]) {
                void fetchAvatar(handle)
            }
        })
    }, [events, fetchAvatar, userAvatars])

    useEffect(() => {
        if (!pendingApprovals.length) {
            return
        }

        const uniqueHandles = Array.from(new Set(pendingApprovals.map(item => item.createdBy)))
        uniqueHandles.forEach(handle => {
            if (!userAvatars[handle]) {
                void fetchAvatar(handle)
            }
        })
    }, [fetchAvatar, pendingApprovals, userAvatars])

    useEffect(() => {
        const currentYear = selectedFilterValue.year
        const currentMonth = Math.max(selectedFilterValue.month, 0)
        const maxYear = 2032
        let target: HTMLElement | undefined
        let date = moment(`${currentYear}-${currentMonth + 1}`)
            .format('YYYY-MM')

        while (!target) {
            target = document.getElementById(`${isMobile ? 'mobile-' : 'desktop-'}${moment(date)
                .year()}-${(moment(date)
                .month())
                .toString()
                .padStart(2, '0')}`)
                || undefined

            if (target || !moment(date)
                .isValid() || moment(date)
                .year() > maxYear) {
                break
            }

            date = moment(date)
                .add(1, 'months')
                .format('YYYY-MM')
        }

        if (target) {
            const yOffset = -10
            const coordinate = target.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({
                behavior: 'smooth',
                top: coordinate,
            })
        } else {
            window.scrollTo({
                behavior: 'smooth',
                top: 0,
            })
        }
    }, [isMobile, selectedFilterValue])

    const sortedEvents = useMemo(
        () => [...events].sort(
            (left, right) => moment(right.eventDate)
                .valueOf() - moment(left.eventDate)
                .valueOf(),
        ),
        [events],
    )

    const shouldShowDiscuss = useMemo(() => {
        if (tab !== 0) {
            return false
        }

        if (isAdmin) {
            return !isMobile
        }

        return true
    }, [isAdmin, isMobile, tab])

    return (
        <div className={styles.container}>
            <div
                className={classNames(
                    styles.header,
                    isAdmin && styles.headerAdmin,
                    shouldShowDiscuss && styles.headerWithDiscuss,
                )}
            >
                <img alt='top-banner' className={classNames(styles.headerBg, styles.hideMobile)} src={topBanner} />
                <img
                    alt='top-banner-mobile'
                    className={classNames(styles.headerBg, styles.hideDesktop)}
                    src={topBannerMobile}
                />

                {isAdmin ? (
                    <div className={styles.headerTabs}>
                        <button
                            className={classNames(styles.tabItem, tab === 0 && styles.selected)}
                            onClick={() => setTab(0)}
                            type='button'
                        >
                            Timeline View
                            <span className={styles.selectIndicator} />
                        </button>
                        <button
                            className={classNames(styles.tabItem, tab === 1 && styles.selected)}
                            onClick={() => setTab(1)}
                            type='button'
                        >
                            Pending Approvals
                            <span className={styles.selectIndicator} />
                            {!!pendingApprovals.length && (
                                <span className={styles.tag}>{pendingApprovals.length}</span>
                            )}
                        </button>
                    </div>
                ) : (
                    <h1 className={styles.headerTitle}>Topcoder Timeline Wall</h1>
                )}

                {shouldShowDiscuss && (
                    <a
                        className={styles.discussButton}
                        href={FORUM_LINK}
                        rel='noopener noreferrer'
                        target='_blank'
                    >
                        <span>DISCUSS</span>
                        <IconOutline.ArrowRightIcon width={16} />
                    </a>
                )}

                <button
                    className={styles.filterDropdown}
                    onClick={() => setShowRightFilterMobile(true)}
                    type='button'
                >
                    <span>{selectedFilterValue.year || thisYear}</span>
                    <IconOutline.ChevronDownIcon width={16} />
                </button>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <TimelineEvents
                        className={classNames(styles.tabContent, tab === 1 && styles.hidden)}
                        events={sortedEvents}
                        isAdmin={isAdmin}
                        isAuthenticated={Boolean(authToken)}
                        onDeleteEvent={async (id: string) => {
                            if (!authToken) {
                                return
                            }

                            await deleteEvent(authToken, id)
                        }}
                        onDoneAddEvent={() => {
                            void loadEvents()
                        }}
                        onSubmitEvent={async (formData: FormData) => {
                            if (!authToken) {
                                return
                            }

                            await submitEvent(authToken, formData)
                        }}
                        selectedFilterValue={selectedFilterValue}
                        setSelectedFilterValue={setSelectedFilterValue}
                        setShowRightFilterMobile={setShowRightFilterMobile}
                        showRightFilterMobile={showRightFilterMobile}
                        uploadResult={uploadResult}
                        uploading={uploading}
                        userAvatars={userAvatars}
                    />

                    {loadingApprovals ? (
                        <div className={classNames(styles.tabContent, tab === 0 && styles.hidden)}>
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <PendingApprovals
                            className={classNames(styles.tabContent, tab === 0 && styles.hidden)}
                            events={pendingApprovals}
                            onApproveEvent={async (id: string) => {
                                if (!authToken) {
                                    return
                                }

                                await approveEvent(authToken, id)
                            }}
                            onDeleteEvent={async (id: string) => {
                                if (!authToken) {
                                    return
                                }

                                await deleteEvent(authToken, id)
                            }}
                            onRejectEvent={async (
                                id: string,
                                body: RejectTimelineEventBody,
                            ) => {
                                if (!authToken) {
                                    return
                                }

                                await removeEvent(authToken, id, body)
                            }}
                            userAvatars={userAvatars}
                        />
                    )}
                </>
            )}
        </div>
    )
}

export default TimelineWallPage
