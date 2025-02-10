import { FC, useContext, useMemo, useRef, useState } from 'react'
import _ from 'lodash'
import cn from 'classnames'
import moment from 'moment'
import { EnvironmentConfig } from '~/config'
import { Button, LinkButton, Table, type TableColumn } from '~/libs/ui'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as RegistrantUserIcon } from '../../assets/i/registrant-user-icon.svg'
import { ReactComponent as SubmissionIcon } from '../../assets/i/submission-icon.svg'
import { ReactComponent as UserGroupIcon } from '../../assets/i/user-group-icon.svg'
import { Challenge, ChallengeFilterCriteria } from '../../models'
import { ChallengeManagementContext } from '../../contexts'
import { DropdownMenu } from '../common/DropdownMenu'
import { Pagination } from '../common/Pagination'
import { Paging } from '../../models/challenge-management/Pagination'
import { MobileListView } from './MobileListView'
import styles from './ChallengeList.module.scss'
import { useWindowSize } from '~/libs/shared'

export interface ChallengeListProps {
  challenges: Challenge[]
  paging: Paging
  currentFilters: ChallengeFilterCriteria
  onPageChange: (page: number) => void
}

const ChallengeCurrentPhase: FC<{ challenge: Challenge }> = ({ challenge }) => {
    let statusPhase = null
    if (challenge.phases) {
        statusPhase = challenge.phases
      .filter((p) => p.name !== 'Registration' && p.isOpen)
      .sort((a, b) => moment(a.scheduledEndDate).diff(b.scheduledEndDate))[0]
    }

    if (!statusPhase && challenge.type === 'First2Finish' && challenge.phases.length) {
        statusPhase = _.clone(challenge.phases[0])
        statusPhase.name = 'Submission'
    }

    let phaseMessage = 'Stalled'
    if (statusPhase) phaseMessage = statusPhase.name
    else if (challenge.status === 'Draft') phaseMessage = 'In Draft'

    return <>{phaseMessage}</>
}

const ChallengeUserStats: FC<{ challenge: Challenge }> = ({ challenge }) => (
    <div className={styles.challengeUserStats}>
        <span title={`${challenge.numOfRegistrants} registrant${challenge.numOfRegistrants > 1 ? 's' : ''}`}>
            <RegistrantUserIcon className='icon icon-fill' />
            <span>{challenge.numOfRegistrants}</span>
        </span>
        <span title={`${challenge.numOfSubmissions} submission${challenge.numOfSubmissions > 1 ? 's' : ''}`}>
            <SubmissionIcon className='icon icon-fill' />
            <span>{challenge.numOfSubmissions}</span>
        </span>
        <span title={`${challenge.groups.length} group${challenge.groups.length > 1 ? 's' : ''}`}>
            <UserGroupIcon className='icon icon-fill' />
            <span>{challenge.groups.length}</span>
        </span>
    </div>
)

const TrackIcon: FC<{ challenge: Challenge }> = ({ challenge }) => {
    const { challengeTypes } = useContext(ChallengeManagementContext)
    const type = useMemo(() => challengeTypes.find(i => i.id === challenge.typeId), [challengeTypes, challenge.typeId])
    const iconStyles = (classname: string) => {
        switch (classname) {
            case 'Development':
                return {
                    color: '#FFFFFF',
                    background: '#328732',
                }
            case 'Design':
                return {
                    color: '#FFFFFF',
                    background: '#0076A5',
                }
            case 'Quality Assurance':
                return {
                    color: '#FFFFFF',
                    background: '#8231A9',
                }
            case 'Data Science':
                return {
                    color: '#FFFFFF',
                    background: '#BA4C00',
                }
            default:
                return {
                    color: '#2a2a2a',
                    background: '#16679A7F',
                }
        }
    }

    return (
        <div className={cn(styles.trackIcon)} style={iconStyles(challenge.track)}>
            {type?.abbreviation}
        </div>
    )
}

const Actions: FC<{ challenge: Challenge; currentFilters: ChallengeFilterCriteria }> = ({
    challenge,
  currentFilters,
}) => {
    const navigate = useNavigate()
    const goToManageUser = () => {
        navigate(`${challenge.id}/manage-user`, { state: { previousChallengeListFilter: currentFilters } })
    }

    return (
        <div className={styles.rowActions}>
            <LinkButton onClick={goToManageUser} className={styles.manageUsersLink}>
                Manage Users
            </LinkButton>

            <DropdownMenu
                trigger={({ open, setOpen }) => (
                    <Button primary onClick={() => setOpen(!open)}>
                        Go To
                        {' '}
                        <ChevronDownIcon className='icon icon-fill' />
                    </Button>
                )}
                width={160}
                placement='bottom-end'
            >
                <ul>
                    <li>
                        {(challenge.hasOwnProperty('projectId') && challenge.projectId != undefined) === true && (
                            <a
                                href={`${EnvironmentConfig.ADMIN.CONNECT_URL}/projects/${challenge.projectId}`}
                                target='_blank'
                                rel='noreferrer'
                            >
                                Connect Project
                            </a>
                        )}
                        {(challenge.hasOwnProperty('projectId') && challenge.projectId != undefined) === false && (
                            <a href='#' className={styles.disabled}>
                                Connect Project
                            </a>
                        )}
                    </li>
                    <li>
                        {(challenge.hasOwnProperty('legacyId') && challenge.legacyId != undefined) === true && (
                            <a
                                href={`${EnvironmentConfig.ADMIN.DIRECT_URL}/contest/detail?projectId=${challenge.legacyId}`}
                                target='_blank'
                                rel='noreferrer'
                            >
                                Direct Project
                            </a>
                        )}
                        {(challenge.hasOwnProperty('legacyId') && challenge.legacyId != undefined) === false && (
                            <a href='#' className={styles.disabled}>
                                Direct Project
                            </a>
                        )}
                    </li>
                    <li>
                        {(challenge.hasOwnProperty('projectId') && challenge.projectId != undefined) === true && (
                            <a
                                href={`${EnvironmentConfig.ADMIN.WORK_MANAGER_URL}/projects/${challenge.projectId}/challenges/${challenge.id}/view`}
                                target='_blank'
                                rel='noreferrer'
                            >
                                Work Manager
                            </a>
                        )}
                        {(challenge.hasOwnProperty('projectId') && challenge.projectId != undefined) === false && (
                            <a href='#' className={styles.disabled}>
                                Work Manager
                            </a>
                        )}
                    </li>
                    <li>
                        {(challenge.hasOwnProperty('legacyId') && challenge.legacyId != undefined) === true && (
                            <a
                                href={`${EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL}/actions/ViewProjectDetails?pid=${challenge.legacyId}`}
                                target='_blank'
                                rel='noreferrer'
                            >
                                Online Review
                            </a>
                        )}
                        {(challenge.hasOwnProperty('legacyId') && challenge.legacyId != undefined) === false && (
                            <a href='#' className={styles.disabled}>
                                Online Review
                            </a>
                        )}
                    </li>
                </ul>
            </DropdownMenu>
        </div>
    )
}

const ChallengeList: FC<ChallengeListProps> = ({ challenges, paging, currentFilters, onPageChange }) => {
    const columns = useMemo<TableColumn<Challenge>[]>(
        () => [
            { label: '', type: 'element', renderer: (challenge: Challenge) => <TrackIcon challenge={challenge} /> },
            {
                label: 'Title',
                propertyName: 'name',
                type: 'element',
                renderer: (challenge: Challenge) => (
                    <a href='#' className={styles.challengeTitle}>
                        {challenge.name}
                    </a>
                ),
            },
            { label: 'Legacy ID', propertyName: 'legacyId', type: 'text' },
            {
                label: 'Type & Track',
                type: 'element',
                renderer: (challenge: Challenge) => (
                    <div>
                        {challenge.type}
                        <br />
                        {challenge.track}
                        {' '}
                        {challenge.legacy.subTrack ? ` / ${challenge.legacy.subTrack}` : ''}
                    </div>
                ),
            },
            {
                label: 'Current Phase',
                type: 'element',
                renderer: (challenge: Challenge) => <ChallengeCurrentPhase challenge={challenge} />,
            },
            { label: 'Status', propertyName: 'status', type: 'text' },
            {
                label: 'Stats',
                type: 'element',
                renderer: (challenge: Challenge) => <ChallengeUserStats challenge={challenge} />,
            },
            {
                label: '',
                type: 'action',
                renderer: (challenge: Challenge) => <Actions challenge={challenge} currentFilters={currentFilters} />,
            },
        ],
        [],
    )

    const { width: screenWidth } = useWindowSize()
    return (
        <div className={styles.challengeList}>
            {screenWidth > 1279 && <Table columns={columns} data={challenges} disableSorting />}
            {screenWidth <= 1279 && <MobileListView properties={columns} data={challenges} />}
            <Pagination page={paging.page} totalPages={paging.totalPages} onPageChange={onPageChange} />
        </div>
    )
}

export default ChallengeList
