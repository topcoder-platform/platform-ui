import { Dispatch, FC, SetStateAction, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import _ from 'lodash'
import cn from 'classnames'
import moment from 'moment'

import { ChevronDownIcon } from '@heroicons/react/solid'
import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, Table, type TableColumn } from '~/libs/ui'

import { ReactComponent as RegistrantUserIcon } from '../../assets/i/registrant-user-icon.svg'
import { ReactComponent as SubmissionIcon } from '../../assets/i/submission-icon.svg'
import { ReactComponent as UserGroupIcon } from '../../assets/i/user-group-icon.svg'
import { DropdownMenu } from '../common/DropdownMenu'
import { Pagination } from '../common/Pagination'
import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
} from '../../contexts'
import { useEventCallback } from '../../hooks'
import { Challenge, ChallengeFilterCriteria, ChallengeType } from '../../models'
import { Paging } from '../../models/challenge-management/Pagination'

import { MobileListView } from './MobileListView'
import styles from './ChallengeList.module.scss'

export interface ChallengeListProps {
    challenges: Challenge[]
    paging: Paging
    currentFilters: ChallengeFilterCriteria
    onPageChange: (page: number) => void
}

const ChallengeCurrentPhase: FC<{ challenge: Challenge }> = props => {
    let statusPhase
    if (props.challenge.phases) {
        statusPhase = props.challenge.phases
            .filter(p => p.name !== 'Registration' && p.isOpen)
            .sort((a, b) => moment(a.scheduledEndDate)
                .diff(b.scheduledEndDate))[0]
    }

    if (
        !statusPhase
        && props.challenge.type === 'First2Finish'
        && props.challenge.phases.length
    ) {
        statusPhase = _.clone(props.challenge.phases[0])
        statusPhase.name = 'Submission'
    }

    let phaseMessage = 'Stalled'
    if (statusPhase) phaseMessage = statusPhase.name
    else if (props.challenge.status === 'Draft') phaseMessage = 'In Draft'

    return <>{phaseMessage}</>
}

const ChallengeUserStats: FC<{ challenge: Challenge }> = props => (
    <div className={styles.challengeUserStats}>
        <span
            title={`${props.challenge.numOfRegistrants} registrant${props.challenge.numOfRegistrants > 1 ? 's' : ''}`}
        >
            <RegistrantUserIcon className='icon icon-fill' />
            <span>{props.challenge.numOfRegistrants}</span>
        </span>
        <span
            title={`${props.challenge.numOfSubmissions} submission${props.challenge.numOfSubmissions > 1 ? 's' : ''}`}
        >
            <SubmissionIcon className='icon icon-fill' />
            <span>{props.challenge.numOfSubmissions}</span>
        </span>
        <span
            title={`${props.challenge.groups.length} group${props.challenge.groups.length > 1 ? 's' : ''}`}
        >
            <UserGroupIcon className='icon icon-fill' />
            <span>{props.challenge.groups.length}</span>
        </span>
    </div>
)

const TrackIcon: FC<{ challenge: Challenge }> = props => {
    const { challengeTypes }: ChallengeManagementContextType = useContext(
        ChallengeManagementContext,
    )
    const type: ChallengeType | undefined = useMemo(
        () => challengeTypes.find(i => i.id === props.challenge.typeId),
        [challengeTypes, props.challenge.typeId],
    )
    const iconStyles = (
        classname: string,
    ): { background: string; color: string } => {
        switch (classname) {
            case 'Development':
                return {
                    background: '#328732',
                    color: '#FFFFFF',
                }
            case 'Design':
                return {
                    background: '#0076A5',
                    color: '#FFFFFF',
                }
            case 'Quality Assurance':
                return {
                    background: '#8231A9',
                    color: '#FFFFFF',
                }
            case 'Data Science':
                return {
                    background: '#BA4C00',
                    color: '#FFFFFF',
                }
            default:
                return {
                    background: '#16679A7F',
                    color: '#2a2a2a',
                }
        }
    }

    return (
        <div
            className={cn(styles.trackIcon)}
            style={iconStyles(props.challenge.track)}
        >
            {type?.abbreviation}
        </div>
    )
}

const Actions: FC<{
    challenge: Challenge
    currentFilters: ChallengeFilterCriteria
}> = props => {
    const [openDropdown, setOpenDropdown] = useState(false)
    const navigate = useNavigate()
    const goToManageUser = useEventCallback(() => {
        navigate(`${props.challenge.id}/manage-user`, {
            state: { previousChallengeListFilter: props.currentFilters },
        })
    })

    const manageDropdownMenuTrigger = useEventCallback(
        (triggerProps: {
            open: boolean
            setOpen: Dispatch<SetStateAction<boolean>>
        }) => {
            const createToggle = () => (): void => triggerProps.setOpen(!triggerProps.open)
            return (
                <Button primary onClick={createToggle()}>
                    Manage
                    {' '}
                    <ChevronDownIcon className='icon icon-fill' />
                </Button>
            )
        },
    )

    const goToDropdownMenuTrigger = useEventCallback(
        (triggerProps: {
            open: boolean
            setOpen: Dispatch<SetStateAction<boolean>>
        }) => {
            const createToggle = () => (): void => triggerProps.setOpen(!triggerProps.open)
            return (
                <Button primary onClick={createToggle()}>
                    Go To
                    {' '}
                    <ChevronDownIcon className='icon icon-fill' />
                </Button>
            )
        },
    )

    const hasProjectId
        = 'projectId' in props.challenge
        && props.challenge.projectId !== undefined
    const hasLegacyId
        = 'legacyId' in props.challenge && props.challenge.legacyId !== undefined

    return (
        <div className={styles.rowActions}>
            <DropdownMenu
                trigger={manageDropdownMenuTrigger}
                open={openDropdown}
                setOpen={setOpenDropdown}
                width={160}
                placement='bottom-end'
                classNames={{ menu: 'challenge-list-actions-dropdown-menu' }}
                shouldIgnoreWhenClickMenu
            >
                <ul>
                    <li
                        onClick={function onClick() {
                            goToManageUser()
                            setOpenDropdown(false)
                        }}
                    >
                        Users
                    </li>
                    <li
                        onClick={function onClick() {
                            navigate(`${props.challenge.id}/manage-resource`)
                            setOpenDropdown(false)
                        }}
                    >
                        Resources
                    </li>
                </ul>
            </DropdownMenu>

            <DropdownMenu
                trigger={goToDropdownMenuTrigger}
                width={160}
                placement='bottom-end'
                classNames={{ menu: 'challenge-list-actions-dropdown-menu' }}
            >
                <ul>
                    <li className={cn({ disabled: !hasProjectId })}>
                        {hasProjectId && (
                            <a
                                href={
                                    `${EnvironmentConfig.ADMIN.WORK_MANAGER_URL}/projects/${props.challenge.projectId}/challenges/${props.challenge.id}/view` /* eslint-disable-line max-len */
                                }
                                target='_blank'
                                rel='noreferrer'
                            >
                                Work Manager
                            </a>
                        )}
                        {!hasProjectId && <span>Work Manager</span>}
                    </li>
                    <li className={cn({ disabled: !hasLegacyId })}>
                        {hasLegacyId && (
                            <a
                                href={
                                    `${EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL}/actions/ViewProjectDetails?pid=${props.challenge.legacyId}` /* eslint-disable-line max-len */
                                }
                                target='_blank'
                                rel='noreferrer'
                            >
                                Online Review
                            </a>
                        )}
                        {!hasLegacyId && <span>Online Review</span>}
                    </li>
                </ul>
            </DropdownMenu>
        </div>
    )
}

const ChallengeList: FC<ChallengeListProps> = props => {
    const columns = useMemo<TableColumn<Challenge>[]>(
        () => [
            {
                label: '',
                renderer: (challenge: Challenge) => (
                    <TrackIcon challenge={challenge} />
                ),
                type: 'element',
            },
            {
                label: 'Title',
                propertyName: 'name',
                renderer: (challenge: Challenge) => (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a href='#' className={styles.challengeTitle}>
                        {challenge.name}
                    </a>
                ),
                type: 'element',
            },
            { label: 'Legacy ID', propertyName: 'legacyId', type: 'text' },
            {
                label: 'Type & Track',
                renderer: (challenge: Challenge) => (
                    <div>
                        {challenge.type}
                        <br />
                        {challenge.track}
                        {' '}
                        {challenge.legacy.subTrack
                            ? ` / ${challenge.legacy.subTrack}`
                            : ''}
                    </div>
                ),
                type: 'element',
            },
            {
                label: 'Current Phase',
                renderer: (challenge: Challenge) => (
                    <ChallengeCurrentPhase challenge={challenge} />
                ),
                type: 'element',
            },
            { label: 'Status', propertyName: 'status', type: 'text' },
            {
                label: 'Stats',
                renderer: (challenge: Challenge) => (
                    <ChallengeUserStats challenge={challenge} />
                ),
                type: 'element',
            },
            {
                label: '',
                renderer: (challenge: Challenge) => (
                    <Actions
                        challenge={challenge}
                        currentFilters={props.currentFilters}
                    />
                ),
                type: 'action',
            },
        ],
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: props.currentFilters
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    return (
        <div className={styles.challengeList}>
            {screenWidth > 1279 && (
                <Table
                    columns={columns}
                    data={props.challenges}
                    disableSorting
                />
            )}
            {screenWidth <= 1279 && (
                <MobileListView properties={columns} data={props.challenges} />
            )}
            <Pagination
                page={props.paging.page}
                totalPages={props.paging.totalPages}
                onPageChange={props.onPageChange}
            />
        </div>
    )
}

export default ChallengeList
