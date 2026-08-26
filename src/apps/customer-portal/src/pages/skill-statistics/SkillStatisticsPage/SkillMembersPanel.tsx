/* eslint-disable react/jsx-no-bind */
import {
    ChangeEvent,
    FC,
    Fragment,
    MouseEvent,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'
import { getRatingColor } from '~/libs/core'
import { ProfilePicture } from '~/libs/shared'
import { IconOutline } from '~/libs/ui'

import { ExpertSkillCategory, ExpertSkillCategoryMember } from '../../../lib'
import {
    IconFirstPlace,
    IconSecondPlace,
    IconThirdPlace,
} from '../../statistics/StatisticsPage/assets'

import styles from './SkillMembersPanel.module.scss'

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

interface SkillMembersPanelProps {
    category: ExpertSkillCategory
    countryFilter: string
    members: ExpertSkillCategoryMember[]
    onCountryChange: (countryCode: string) => void
    onSearchChange: (value: string) => void
    search: string
}

const SkillMembersPanel: FC<SkillMembersPanelProps> = props => {
    const [expandedHandles, setExpandedHandles] = useState<Set<string>>(new Set())

    const countryOptions = useMemo(() => {
        const unique = new Map<string, string>()
        props.members.forEach(member => {
            if (member.countryCode && member.countryName) {
                unique.set(member.countryCode, member.countryName)
            }
        })

        return Array.from(unique.entries())
            .map(([code, name]) => ({ code, name }))
            .sort((left, right) => left.name.localeCompare(right.name))
    }, [props.members])

    const visibleMembers = useMemo(() => {
        const query = props.search.trim()
            .toLowerCase()

        return props.members
            .filter(member => {
                const matchesSearch = !query
                    || member.handle.toLowerCase()
                        .includes(query)
                    || member.name.toLowerCase()
                        .includes(query)
                const matchesCountry = !props.countryFilter
                    || member.countryCode === props.countryFilter

                return matchesSearch && matchesCountry
            })
            .sort((left, right) => right.wins - left.wins)
    }, [props.countryFilter, props.members, props.search])

    function toggleExpanded(handle: string): void {
        setExpandedHandles(current => {
            const next = new Set(current)
            if (next.has(handle)) {
                next.delete(handle)
            } else {
                next.add(handle)
            }

            return next
        })
    }

    return (
        <section
            className={styles.section}
            aria-label={`Members for ${props.category.name}`}
        >
            <div className={styles.header}>
                <h2>{`Members for ${props.category.name}`}</h2>
                <p className={styles.subtitle}>
                    Browse top 100 talent by skills and numbers of wins.
                </p>
            </div>
            <div className={styles.body}>
                <aside className={styles.filters}>
                    <label className={styles.search}>
                        <input
                            aria-label='Search members'
                            onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                                props.onSearchChange(event.target.value)
                            }}
                            placeholder='Search members...'
                            type='search'
                            value={props.search}
                        />
                        <IconOutline.SearchIcon aria-hidden='true' />
                    </label>
                    <label className={styles.filter} htmlFor='skill-members-country'>
                        <span>Filter By</span>
                        <select
                            id='skill-members-country'
                            onChange={function onChange(event: ChangeEvent<HTMLSelectElement>) {
                                props.onCountryChange(event.target.value)
                            }}
                            value={props.countryFilter}
                        >
                            <option value=''>All Countries</option>
                            {countryOptions.map(country => (
                                <option key={country.code} value={country.code}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </aside>
                <div className={styles.tableWrap}>
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Member</th>
                                <th className={styles.desktopOnly}>Rating</th>
                                <th className={styles.desktopOnly}>Country</th>
                                <th className={styles.desktopOnly}># of Wins</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleMembers.length === 0 && (
                                <tr>
                                    <td className={styles.empty} colSpan={5}>
                                        No members match the current filters.
                                    </td>
                                </tr>
                            )}
                            {visibleMembers.map((member, index) => {
                                const rankIcon = index === 0
                                    ? <IconFirstPlace aria-hidden='true' />
                                    : index === 1
                                        ? <IconSecondPlace aria-hidden='true' />
                                        : index === 2
                                            ? <IconThirdPlace aria-hidden='true' />
                                            : <>{index + 1}</>
                                const [firstName, ...lastNameParts] = member.name.split(/\s+/)
                                const lastName = lastNameParts.join(' ')
                                    .trim()
                                const countryCode = /^[A-Z]{2}$/.test(member.countryCode)
                                    ? member.countryCode.toLowerCase()
                                    : ''
                                const profileUrl = `${EnvironmentConfig.USER_PROFILE_URL}/${
                                    encodeURIComponent(member.handle)
                                }`
                                const isExpanded = expandedHandles.has(member.handle)

                                return (
                                    <Fragment key={member.handle}>
                                        <tr
                                            className={classNames(
                                                styles.memberRow,
                                                isExpanded && styles.expanded,
                                            )}
                                            onClick={function onClick(event: MouseEvent<HTMLTableRowElement>) {
                                                const target = event.target
                                                if (target instanceof Element && target.closest('a')) {
                                                    return
                                                }

                                                toggleExpanded(member.handle)
                                            }}
                                        >
                                            <td>
                                                <span className={styles[`rank${Math.min(index + 1, 4)}`]}>
                                                    {rankIcon}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.memberCell}>
                                                    <ProfilePicture
                                                        className={styles.avatar}
                                                        member={{
                                                            firstName: firstName || member.handle,
                                                            lastName,
                                                            photoURL: member.photoURL || '',
                                                        }}
                                                    />
                                                    <div className={styles.memberText}>
                                                        <a
                                                            className={styles.handle}
                                                            href={profileUrl}
                                                            onClick={function onClick(
                                                                event: MouseEvent<HTMLAnchorElement>,
                                                            ) {
                                                                event.stopPropagation()
                                                            }}
                                                            rel='noreferrer'
                                                            style={{ color: getRatingColor(member.rating) }}
                                                            target='_blank'
                                                        >
                                                            {member.handle}
                                                        </a>
                                                        <span className={styles.memberName}>{member.name}</span>
                                                    </div>
                                                    <button
                                                        aria-expanded={isExpanded}
                                                        aria-label={
                                                            isExpanded
                                                                ? `Hide details for ${member.handle}`
                                                                : `Show details for ${member.handle}`
                                                        }
                                                        className={styles.toggle}
                                                        onClick={function onClick(
                                                            event: MouseEvent<HTMLButtonElement>,
                                                        ) {
                                                            event.stopPropagation()
                                                            toggleExpanded(member.handle)
                                                        }}
                                                        type='button'
                                                    >
                                                        <IconOutline.ChevronDownIcon
                                                            className={classNames(
                                                                styles.chevron,
                                                                isExpanded && styles.chevronOpen,
                                                            )}
                                                            height={20}
                                                            width={20}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className={styles.desktopOnly}>
                                                <span style={{ color: getRatingColor(member.rating) }}>
                                                    {member.rating}
                                                </span>
                                            </td>
                                            <td className={styles.desktopOnly}>
                                                <div className={styles.countryCell} title={member.countryName}>
                                                    {countryCode && (
                                                        <span
                                                            aria-hidden='true'
                                                            className={classNames(
                                                                styles.flag,
                                                                `fi fi-${countryCode}`,
                                                            )}
                                                        />
                                                    )}
                                                    <span>{member.countryName}</span>
                                                </div>
                                            </td>
                                            <td className={styles.desktopOnly}>
                                                {NUMBER_FORMATTER.format(member.wins)}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className={styles.detailsRow}>
                                                <td className={styles.detailsCell} colSpan={2}>
                                                    <dl
                                                        aria-label={`Details for ${member.handle}`}
                                                        className={styles.details}
                                                    >
                                                        <div className={styles.detail}>
                                                            <dt>Rating</dt>
                                                            <dd
                                                                style={{
                                                                    color: getRatingColor(member.rating),
                                                                }}
                                                            >
                                                                {member.rating}
                                                            </dd>
                                                        </div>
                                                        <div className={styles.detail}>
                                                            <dt>Country</dt>
                                                            <dd className={styles.countryCell}>
                                                                {countryCode && (
                                                                    <span
                                                                        aria-hidden='true'
                                                                        className={classNames(
                                                                            styles.flag,
                                                                            `fi fi-${countryCode}`,
                                                                        )}
                                                                    />
                                                                )}
                                                                <span>{member.countryName}</span>
                                                            </dd>
                                                        </div>
                                                        <div className={styles.detail}>
                                                            <dt># of Wins</dt>
                                                            <dd>
                                                                {NUMBER_FORMATTER.format(member.wins)}
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

export default SkillMembersPanel
