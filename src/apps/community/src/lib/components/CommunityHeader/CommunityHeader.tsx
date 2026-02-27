import { FC, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import {
    authUrlLogin,
    authUrlSignup,
    profileContext,
    ProfileContextData,
} from '~/libs/core'
import { ConfigContextValue, useConfigContext } from '~/libs/shared'
import { DefaultMemberIcon } from '~/libs/ui'

import { CommunityMeta } from '../../models'

import styles from './CommunityHeader.module.scss'

interface CommunityHeaderProps {
    baseUrl?: string
    meta: CommunityMeta
}

interface ResolvedCommunityLogo {
    alt: string
    href: string
    src: string
}

interface ResolvedMenuItem {
    href: string
    label: string
    openNewTab: boolean
}

interface AvatarProps {
    photoUrl?: string
    userHandle: string
    userRating?: number
}

/**
 * Converts an unknown value into a string when possible.
 *
 * @param value Value from metadata payload.
 * @returns Trimmed string or undefined.
 */
function asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim()
        ? value
        : undefined
}

/**
 * Builds a normalized logo model from community metadata.
 *
 * @param logo Raw logo record.
 * @param index Zero-based logo index.
 * @returns Normalized logo model.
 */
function resolveLogo(logo: Record<string, unknown>, index: number): ResolvedCommunityLogo | undefined {
    const src = asString(logo.img)
        ?? asString(logo.image)
        ?? asString(logo.imageUrl)
        ?? asString(logo.imageURL)
        ?? asString(logo.src)
    if (!src) {
        return undefined
    }

    return {
        alt: asString(logo.alt)
            ?? asString(logo.title)
            ?? asString(logo.name)
            ?? `community-logo-${index + 1}`,
        href: asString(logo.href)
            ?? asString(logo.link)
            ?? asString(logo.url)
            ?? '#',
        src,
    }
}

/**
 * Builds a normalized menu item model from community metadata.
 *
 * @param menuItem Raw menu record.
 * @returns Normalized menu item.
 */
function resolveMenuItem(menuItem: Record<string, unknown>): ResolvedMenuItem | undefined {
    const label = asString(menuItem.title)
        ?? asString(menuItem.label)
        ?? asString(menuItem.name)
        ?? asString(menuItem.text)
    const href = asString(menuItem.href)
        ?? asString(menuItem.link)
        ?? asString(menuItem.url)
        ?? asString(menuItem.path)

    if (!label || !href) {
        return undefined
    }

    return {
        href,
        label,
        openNewTab: menuItem.openNewTab === true,
    }
}

/**
 * Removes trailing slashes from non-root pathnames before route comparisons.
 *
 * @param pathname Pathname to normalize.
 * @returns Normalized pathname.
 */
function normalizePathname(pathname: string): string {
    if (!pathname) {
        return '/'
    }

    if (pathname !== '/' && pathname.endsWith('/')) {
        return pathname.slice(0, -1)
    }

    return pathname
}

/**
 * Removes the community base URL prefix for relative navigation item matching.
 *
 * @param pathname Current browser pathname.
 * @param baseUrl Community route base URL.
 * @returns Pathname without the base URL prefix.
 */
function stripBaseUrlPrefix(pathname: string, baseUrl?: string): string {
    if (!baseUrl) {
        return pathname
    }

    if (pathname === baseUrl) {
        return '/'
    }

    if (pathname.startsWith(`${baseUrl}/`)) {
        return pathname.slice(baseUrl.length) || '/'
    }

    return pathname
}

/**
 * Renders the profile avatar image or default member icon.
 *
 * @param props Avatar data.
 * @returns Profile avatar element.
 */
const Avatar: FC<AvatarProps> = (props: AvatarProps) => {
    if (props.photoUrl) {
        return (
            <img
                alt={`${props.userHandle} avatar`}
                className={styles.avatarImage}
                src={props.photoUrl}
            />
        )
    }

    const ratingLabel = typeof props.userRating === 'number'
        ? `Rating ${props.userRating}`
        : 'Unrated member'

    return (
        <span
            aria-label={ratingLabel}
            className={styles.avatarFallback}
            title={ratingLabel}
        >
            <DefaultMemberIcon />
        </span>
    )
}

/**
 * Community branded header that renders logos, metadata navigation and user actions.
 *
 * @param props Community metadata and optional base URL for relative links.
 * @returns Community header with branding, nav and user menu.
 */
const CommunityHeader: FC<CommunityHeaderProps> = (props: CommunityHeaderProps) => {
    const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)
    const { profile }: ProfileContextData = useContext(profileContext)
    const { logoutUrl }: ConfigContextValue = useConfigContext()
    const location = useLocation()

    const logos = useMemo(
        () => props.meta.logos
            .map((logo, index) => resolveLogo(logo as Record<string, unknown>, index))
            .filter((logo): logo is ResolvedCommunityLogo => Boolean(logo)),
        [props.meta.logos],
    )
    const menuItems = useMemo(
        () => props.meta.menuItems
            .map(item => resolveMenuItem(item as Record<string, unknown>))
            .filter((item): item is ResolvedMenuItem => Boolean(item)),
        [props.meta.menuItems],
    )

    const isWiproMember = profile?.email?.includes('@wipro.com') === true
    const communityBaseUrl = EnvironmentConfig.COMMUNITY_APP_URL ?? EnvironmentConfig.TOPCODER_URL
    const profileLink = isWiproMember
        ? 'https://topgear-app.wipro.com/user-details'
        : `${EnvironmentConfig.TOPCODER_URL}/members/${profile?.handle ?? ''}`
    const paymentsLink = isWiproMember
        ? 'https://topgear-app.wipro.com/my_payments'
        : `${communityBaseUrl}/PactsMemberServlet?module=PaymentHistory&full_list=false`
    const routePathname = normalizePathname(stripBaseUrlPrefix(location.pathname, props.baseUrl))
    const toggleMobileMenu = useCallback(() => {
        setIsMobileOpen(previous => !previous)
    }, [])
    const toggleUserMenu = useCallback(() => {
        setIsUserMenuOpen(previous => !previous)
    }, [])
    const closeUserMenu = useCallback(() => {
        setIsUserMenuOpen(false)
    }, [])
    const navigateToLogin = useCallback(() => {
        window.location.assign(authUrlLogin(window.location.href))
    }, [])
    const navigateToSignup = useCallback(() => {
        window.location.assign(authUrlSignup())
    }, [])

    return (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <button
                    aria-expanded={isMobileOpen}
                    aria-label='Toggle navigation menu'
                    className={styles.mobileToggle}
                    onClick={toggleMobileMenu}
                    type='button'
                >
                    <span />
                    <span />
                    <span />
                </button>

                {logos.length > 0 && (
                    <div className={styles.logoBar}>
                        {logos.map(logo => (
                            <a
                                className={styles.logoLink}
                                href={logo.href}
                                key={`${logo.href}-${logo.src}`}
                                rel='noreferrer'
                                target='_blank'
                            >
                                <img
                                    alt={logo.alt}
                                    className={styles.logoImage}
                                    src={logo.src}
                                />
                            </a>
                        ))}
                    </div>
                )}

                <div className={styles.userSection}>
                    {profile ? (
                        <>
                            <button
                                aria-expanded={isUserMenuOpen}
                                className={styles.userHandle}
                                onClick={toggleUserMenu}
                                type='button'
                            >
                                <span>{profile.handle}</span>
                                <Avatar
                                    photoUrl={profile.photoURL}
                                    userHandle={profile.handle}
                                    userRating={profile.maxRating?.rating}
                                />
                            </button>

                            {isUserMenuOpen && (
                                <ul className={styles.userDropdown}>
                                    <li>
                                        <a
                                            className={styles.userDropdownItem}
                                            href={profileLink}
                                            onClick={closeUserMenu}
                                        >
                                            My Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={styles.userDropdownItem}
                                            href={paymentsLink}
                                            onClick={closeUserMenu}
                                            rel='noreferrer'
                                            target='_blank'
                                        >
                                            Payments
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={styles.userDropdownItem}
                                            href={EnvironmentConfig.URLS.ACCOUNT_SETTINGS}
                                            onClick={closeUserMenu}
                                        >
                                            Settings
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className={styles.userDropdownItem}
                                            href={logoutUrl}
                                            onClick={closeUserMenu}
                                        >
                                            Log Out
                                        </a>
                                    </li>
                                </ul>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                className={styles.authButton}
                                onClick={navigateToLogin}
                                type='button'
                            >
                                Log In
                            </button>
                            <button
                                className={styles.authButtonPrimary}
                                onClick={navigateToSignup}
                                type='button'
                            >
                                Join Topcoder
                            </button>
                        </>
                    )}
                </div>
            </div>

            {menuItems.length > 0 && (
                <nav className={isMobileOpen ? styles.navOpen : styles.nav}>
                    {menuItems.map(item => {
                        const isExternalLink = item.href.startsWith('http')
                        const href = isExternalLink
                            ? item.href
                            : `${props.baseUrl ?? ''}${item.href}`
                        const isActive = isExternalLink
                            ? normalizePathname(new URL(item.href).pathname) === normalizePathname(location.pathname)
                            : normalizePathname(item.href) === routePathname

                        return (
                            <a
                                className={isActive ? styles.navItemActive : styles.navItem}
                                href={href}
                                key={`${item.href}-${item.label}`}
                                rel={item.openNewTab ? 'noreferrer' : undefined}
                                target={item.openNewTab ? '_blank' : undefined}
                            >
                                {item.label}
                            </a>
                        )
                    })}
                </nav>
            )}
        </header>
    )
}

export default CommunityHeader

export type {
    CommunityHeaderProps,
    ResolvedCommunityLogo,
    ResolvedMenuItem,
}
