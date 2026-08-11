/* eslint-disable @typescript-eslint/typedef, react/jsx-no-bind */
/** Open and closed Support ticket landing pages. */
import {
    ChangeEvent,
    FC,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom'
import useSWR from 'swr'

import { useProfileContext } from '~/libs/core'
import { Button } from '~/libs/ui'

import { buildSupportPath } from '../../config/routes.config'
import {
    MemberHandleAutocomplete,
    OpenSupportRequestModal,
    SupportEmpty,
    SupportError,
    SupportLoading,
    SupportTabs,
    TicketsTable,
} from '../../lib/components'
import {
    SupportTicketDetail,
    SupportTicketQuery,
    SupportTicketStatus,
    SupportTicketSummary,
} from '../../lib/models'
import {
    assignSupportTicketToMe,
    buildTicketListUrl,
    getSupportTickets,
} from '../../lib/services'
import {
    getSupportErrorMessage,
    isSupportTeamMember,
} from '../../lib/utils'

import styles from './TicketsPage.module.scss'

const PER_PAGE = 20

interface TicketsPageProps {
    status: SupportTicketStatus
}

interface FilterDraft {
    memberHandle: string
    challengeId: string
    description: string
}

/**
 * Parses a positive page number from URL state.
 *
 * @param raw URL query value.
 * @returns a positive page number, defaulting to one.
 * @throws Does not throw.
 */
export function parseTicketPage(raw: string | undefined): number {
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

/**
 * Renders a role-aware, filterable, paginated ticket landing page.
 *
 * @param props requested ticket status.
 * @returns ticket landing page.
 * @throws Does not throw; request failures are rendered with retry actions.
 */
const TicketsPage: FC<TicketsPageProps> = props => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { profile } = useProfileContext()
    const supportTeam = isSupportTeamMember(profile?.roles)
    const closed = props.status === 'CLOSED'
    const page = parseTicketPage(searchParams.get('page') || undefined)
    const appliedChallengeId = searchParams.get('challengeId') || ''
    const appliedDescription = searchParams.get('description') || ''
    const appliedMemberHandle = searchParams.get('memberHandle') || ''
    const appliedFilters = useMemo<FilterDraft>(() => ({
        challengeId: appliedChallengeId,
        description: appliedDescription,
        memberHandle: appliedMemberHandle,
    }), [appliedChallengeId, appliedDescription, appliedMemberHandle])
    const [draft, setDraft] = useState<FilterDraft>(appliedFilters)
    const [modalOpen, setModalOpen] = useState(false)
    const [assigningTicketId, setAssigningTicketId] = useState<string | undefined>()
    const [actionError, setActionError] = useState<string | undefined>()

    useEffect(() => setDraft(appliedFilters), [appliedFilters])

    const query = useMemo<SupportTicketQuery>(() => ({
        page,
        perPage: PER_PAGE,
        status: props.status,
        ...(supportTeam && closed ? appliedFilters : {}),
    }), [
        appliedFilters,
        closed,
        page,
        props.status,
        supportTeam,
    ])
    const requestKey = buildTicketListUrl(query)
    const { data, error, isValidating, mutate } = useSWR(
        requestKey,
        () => getSupportTickets(query),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )

    /**
     * Persists pagination while retaining applied URL filters.
     *
     * @param nextPage positive destination page.
     * @returns void.
     * @throws Does not throw.
     */
    const setPage = (nextPage: number): void => {
        const next = new URLSearchParams(searchParams)
        next.set('page', String(nextPage))
        setSearchParams(next)
    }

    /**
     * Creates a controlled text-filter change handler.
     *
     * @param field filter field to update.
     * @returns an input change handler for that field.
     * @throws Does not throw.
     */
    const handleFilterChange = (field: keyof FilterDraft) => (
        event: ChangeEvent<HTMLInputElement>,
    ): void => setDraft(current => ({ ...current, [field]: event.target.value }))
    /**
     * Applies staff closed-ticket filters to the URL and resets pagination.
     *
     * @param event filter-form submission event.
     * @returns void.
     * @throws Does not throw.
     */
    const handleSearch = (event: FormEvent): void => {
        event.preventDefault()
        const next = new URLSearchParams()
        Object.entries(draft)
            .forEach(([key, value]) => {
                if (value.trim()) next.set(key, value.trim())
            })
        next.set('page', '1')
        setSearchParams(next)
    }

    /**
     * Clears every staff filter and returns to the first page.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const handleClear = (): void => {
        setDraft({ challengeId: '', description: '', memberHandle: '' })
        setSearchParams({ page: '1' })
    }

    /**
     * Navigates to the selected authorized ticket.
     *
     * @param ticket ticket selected from the table or mobile card.
     * @returns void.
     * @throws Does not throw.
     */
    const handleOpen = (ticket: SupportTicketSummary): void => {
        navigate(buildSupportPath('tickets', ticket.id))
    }

    /**
     * Closes the create modal and opens the newly created ticket.
     *
     * @param ticket detail returned by the create endpoint.
     * @returns void.
     * @throws Does not throw.
     */
    const handleCreated = (ticket: SupportTicketDetail): void => {
        setModalOpen(false)
        navigate(buildSupportPath('tickets', ticket.id))
    }

    /**
     * Assigns the current staff user and refreshes the current page.
     *
     * @param ticket open ticket selected by the staff user.
     * @returns a promise resolved after assignment and refresh settle.
     * @throws Does not throw; request failures are stored for display.
     */
    const handleAssign = async (ticket: SupportTicketSummary): Promise<void> => {
        setAssigningTicketId(ticket.id)
        setActionError(undefined)
        try {
            await assignSupportTicketToMe(ticket.id)
            await mutate()
        } catch (assignError) {
            setActionError(getSupportErrorMessage(assignError, 'The ticket could not be assigned.'))
        } finally {
            setAssigningTicketId(undefined)
        }
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1>Support</h1>
                    <p>
                        {supportTeam
                            ? 'Review and resolve support requests from all Topcoder members.'
                            : 'Open a request and track responses from the Topcoder Platform Team.'}
                    </p>
                </div>
                {!supportTeam && (
                    <Button
                        label='Open support request'
                        onClick={() => setModalOpen(true)}
                        primary
                        size='lg'
                    />
                )}
            </header>

            <SupportTabs active={closed ? 'closed' : 'open'} />

            {supportTeam && closed && (
                <form className={styles.filters} onSubmit={handleSearch}>
                    <label>
                        Member handle
                        <MemberHandleAutocomplete
                            onChange={memberHandle => setDraft(current => ({ ...current, memberHandle }))}
                            value={draft.memberHandle}
                        />
                    </label>
                    <label htmlFor='support-challenge-filter'>
                        Challenge ID
                        <input
                            id='support-challenge-filter'
                            onChange={handleFilterChange('challengeId')}
                            type='text'
                            value={draft.challengeId}
                        />
                    </label>
                    <label htmlFor='support-description-filter'>
                        Description
                        <input
                            id='support-description-filter'
                            onChange={handleFilterChange('description')}
                            type='search'
                            value={draft.description}
                        />
                    </label>
                    <div className={styles.filterActions}>
                        <Button label='Search' primary size='md' type='submit' />
                        <Button label='Clear' onClick={handleClear} secondary size='md' />
                    </div>
                </form>
            )}

            {actionError && <p className={styles.actionError} role='alert'>{actionError}</p>}
            {!data && isValidating && <SupportLoading />}
            {!data && error && (
                <SupportError
                    message={getSupportErrorMessage(error, 'Tickets could not be loaded.')}
                    onRetry={() => mutate()}
                />
            )}
            {data && data.data.length === 0 && (
                <SupportEmpty
                    message={closed ? 'No closed support tickets found.' : 'No open support tickets found.'}
                />
            )}
            {data && data.data.length > 0 && (
                <>
                    <TicketsTable
                        assigningTicketId={assigningTicketId}
                        currentUserId={profile?.userId === undefined ? undefined : String(profile.userId)}
                        isSupportTeam={supportTeam}
                        onAssign={handleAssign}
                        onOpen={handleOpen}
                        tickets={data.data}
                    />
                    <nav aria-label='Ticket result pages' className={styles.pagination}>
                        <Button
                            disabled={data.meta.page <= 1 || isValidating}
                            label='Previous'
                            onClick={() => setPage(data.meta.page - 1)}
                            secondary
                            size='sm'
                        />
                        <span>
                            Page
                            {' '}
                            {data.meta.page}
                            {' '}
                            of
                            {' '}
                            {Math.max(1, data.meta.totalPages)}
                        </span>
                        <Button
                            disabled={data.meta.page >= data.meta.totalPages || isValidating}
                            label='Next'
                            onClick={() => setPage(data.meta.page + 1)}
                            secondary
                            size='sm'
                        />
                    </nav>
                </>
            )}

            {!supportTeam && (
                <OpenSupportRequestModal
                    onClose={() => setModalOpen(false)}
                    onCreated={handleCreated}
                    open={modalOpen}
                />
            )}
        </section>
    )
}

/**
 * Renders the default open-ticket landing route.
 *
 * @returns open-ticket page.
 * @throws Does not throw.
 */
export const OpenTicketsPage: FC = () => <TicketsPage status='OPEN' />

/**
 * Renders the closed-ticket landing route.
 *
 * @returns closed-ticket page.
 * @throws Does not throw.
 */
export const ClosedTicketsPage: FC = () => <TicketsPage status='CLOSED' />
