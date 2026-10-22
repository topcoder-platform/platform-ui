import {
    ChangeEvent,
    FC,
    FormEvent,
    KeyboardEvent,
    MouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { BaseModal } from '~/libs/ui'

import { machineAccessEnabled, machineAccessTokenUrl } from './config'
import {
    MachineAudit,
    MachineClient,
    MachineOperation,
    MachinePage,
    machineRequest,
    MachineScope,
    MachineSecret,
} from './machine-access.api'
import styles from './MachineAccessPage.module.scss'

interface ClientDraft {
    clientId: string
    name: string
    owner: string
    description: string
    allowedScopes: string[]
    defaultScopes: string[]
    enabled: boolean
    revision: number
}

type Section = 'clients' | 'scopes' | 'audit'
type Credential = { clientId: string; secret: string }
type ScopeDraft = { description: string; name: string; owner: string; revision: number }

/** Return a blank scope form for creation; no I/O or errors. */
function blankScope(): ScopeDraft {
    return { description: '', name: '', owner: '', revision: 0 }
}

/**
 * Write text to the system clipboard without rendering it.
 * @param value Text to copy, such as a client secret.
 * @returns Whether the browser accepted the write; false when the Clipboard API is missing or denied.
 * Used by the credential copy actions; never throws.
 */
async function writeClipboard(value: string): Promise<boolean> {
    try {
        if (!navigator.clipboard?.writeText) return false
        await navigator.clipboard.writeText(value)
        return true
    } catch {
        return false
    }
}

/**
 * Order ready catalog scopes for the client editor and apply the name search.
 * @param catalog Loaded scope catalog; only `ready` scopes can be granted.
 * @param saved Scope names the saved client currently allows (empty for a new client).
 * @param search Case-insensitive text that scope names must contain; blank matches all.
 * @returns Matching scopes split into the saved client's allowed scopes and the remaining
 * scopes, each sorted by name. Grouping uses the saved grants, so rows do not move while
 * the draft is edited. Pure; never throws.
 */
export function groupScopes(
    catalog: MachineScope[],
    saved: string[],
    search: string,
): { allowed: MachineScope[]; other: MachineScope[] } {
    const text = search.trim()
        .toLowerCase()
    const matching = catalog
        .filter(scope => scope.state === 'ready' && scope.name.toLowerCase()
            .includes(text))
        .sort((first, second) => first.name.localeCompare(second.name))
    return {
        allowed: matching.filter(scope => saved.includes(scope.name)),
        other: matching.filter(scope => !saved.includes(scope.name)),
    }
}

/** Return a blank client form; no credentials, I/O, or errors. */
function blankClient(): ClientDraft {
    return {
        allowedScopes: [],
        clientId: 'm2m-',
        defaultScopes: [],
        description: '',
        enabled: true,
        name: '',
        owner: '',
        revision: 0,
    }
}

/** Render a safe timestamp or an explicit absence label; malformed values are displayed without throwing. */
function time(value?: string): string {
    return value ? new Date(value)
        .toLocaleString() : 'Not recorded'
}

/**
 * DEV administrator client/scope/audit console, shown as the M2M system-admin tab. Uses the
 * current member session; backend errors are shown inline. New credentials stay in component
 * memory, and existing client secrets are fetched on demand and copied to the clipboard
 * without being rendered unless clipboard access is blocked.
 */
const MachineAccessPage: FC = () => {
    const [section, setSection] = useState<Section>('clients')
    const [clients, setClients] = useState<MachineClient[]>([])
    const [scopes, setScopes] = useState<MachineScope[]>([])
    const [audit, setAudit] = useState<MachineAudit[]>([])
    const [next, setNext] = useState<string | undefined>(undefined)
    const [filter, setFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [draft, setDraft] = useState<ClientDraft | undefined>(undefined)
    const [reason, setReason] = useState('')
    const [scopeDraft, setScopeDraft] = useState<ScopeDraft>(blankScope)
    const [scopeModalOpen, setScopeModalOpen] = useState(false)
    const [scopeSearch, setScopeSearch] = useState('')
    const [credential, setCredential] = useState<Credential | undefined>(undefined)
    const [credentialStatus, setCredentialStatus] = useState('')
    const [copyingSecret, setCopyingSecret] = useState(false)
    const [secretStatus, setSecretStatus] = useState('')
    const [revealed, setRevealed] = useState<Credential | undefined>(undefined)
    const [confirmation, setConfirmation] = useState<'disable' | 'replace-credential' | undefined>(
        undefined,
    )
    const operation = useRef({ key: '', signature: '' })

    /** Load the selected list and complete scope catalog; cursor appends another page, errors remain sanitized. */
    const load = useCallback(
        async (cursor?: string): Promise<void> => {
            if (!machineAccessEnabled) return
            setLoading(true)
            setError('')
            try {
                const path = `${section}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`
                if (section === 'clients') {
                    const page = await machineRequest<MachinePage<MachineClient>>(path)
                    setClients(previous => (cursor ? [...previous, ...page.items] : page.items))
                    setNext(page.next ?? undefined)
                } else if (section === 'audit') {
                    const page = await machineRequest<MachinePage<MachineAudit>>(path)
                    setAudit(previous => (cursor ? [...previous, ...page.items] : page.items))
                    setNext(page.next ?? undefined)
                } else setNext(undefined)
                const catalog: MachineScope[] = []
                let scopeCursor: string | undefined
                do {
                    // Sequential pages are necessary to follow the server cursor.
                    // eslint-disable-next-line no-await-in-loop
                    const page: MachinePage<MachineScope> = await machineRequest(
                        `scopes${scopeCursor ? `?cursor=${encodeURIComponent(scopeCursor)}` : ''}`,
                    )
                    catalog.push(...page.items)
                    scopeCursor = page.next ?? undefined
                } while (scopeCursor)

                setScopes(catalog)
            } catch (failure) {
                setError(failure instanceof Error ? failure.message : 'Unable to load Machine Access.')
            } finally {
                setLoading(false)
            }
        },
        [section],
    )

    useEffect(() => {
        load()
    }, [load])

    /** Forget any copied/revealed existing secret and its status; called whenever the editor changes. */
    function resetSecretCopy(): void {
        setSecretStatus('')
        setRevealed(undefined)
    }

    /** Submit one mutation with a stable retry key; reveal credentials only from its first successful response. */
    async function mutate(path: string, method: 'POST' | 'PUT', data: unknown): Promise<void> {
        setBusy(true)
        setError('')
        setNotice('')
        const signature = JSON.stringify({ data, method, path })
        if (operation.current.signature !== signature) operation.current = { key: crypto.randomUUID(), signature }
        try {
            const result = await machineRequest<MachineOperation>(
                path,
                method,
                data,
                operation.current.key,
            )
            if (result.operation.state !== 'completed') {
                setNotice(
                    `Operation is ${result.operation.state}. Issuance stays blocked until the policy is applied.`,
                )
            } else {
                setNotice(
                    result.replay
                        ? 'Operation already completed. Use credential replacement if you need a new secret.'
                        : 'Change applied and verified in DEV.',
                )
                if (result.secret && result.clientId) {
                    setCredential({ clientId: result.clientId, secret: result.secret })
                    setCredentialStatus('')
                }

                setDraft(undefined)
                setConfirmation(undefined)
                setReason('')
                setScopeDraft(blankScope())
                setScopeModalOpen(false)
                resetSecretCopy()
                operation.current = { key: '', signature: '' }
            }

            await load()
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'The operation could not complete.')
        } finally {
            setBusy(false)
        }
    }

    /** Save metadata/grants with a revision; prevents submission and displays errors inline. */
    function saveClient(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        if (!draft) return
        mutate(
            draft.revision ? `clients/${encodeURIComponent(draft.clientId)}` : 'clients',
            draft.revision ? 'PUT' : 'POST',
            { ...draft, reason },
        )
    }

    /** Toggle one allowed/default scope, preserving defaults as a subset of allowed permissions; no I/O. */
    function toggleScope(name: string, field: 'allowedScopes' | 'defaultScopes'): void {
        setDraft(previous => {
            if (!previous) return previous
            const selected = previous[field].includes(name)
            const updated = {
                ...previous,
                [field]: selected
                    ? previous[field].filter(item => item !== name)
                    : [...previous[field], name],
            }
            if (field === 'allowedScopes' && selected) {
                updated.defaultScopes = updated.defaultScopes.filter(item => item !== name)
            }

            return updated
        })
    }

    /** Select a record for editing; clears confirmation, reason, scope search and any copied secret state. */
    function edit(client: MachineClient): void {
        setDraft({ ...client })
        setReason('')
        setConfirmation(undefined)
        setError('')
        setScopeSearch('')
        resetSecretCopy()
    }

    /** Switch the view from a tab button value and clear the editor; returns nothing. */
    function selectSection(event: MouseEvent<HTMLButtonElement>): void {
        setSection(event.currentTarget.value as Section)
        setDraft(undefined)
        setFilter('')
        setConfirmation(undefined)
        resetSecretCopy()
    }

    /** Refresh current records; async errors are handled by load. */
    function refresh(): void {
        load()
    }

    /** Append the next server page when present; async errors are handled by load. */
    function loadMore(): void {
        if (next) load(next)
    }

    /** Remove the one-time credential from component memory. */
    function dismissCredential(): void {
        setCredential(undefined)
        setCredentialStatus('')
    }

    /** Copy the displayed one-time secret to the clipboard and report the result in its panel. */
    async function copyCredential(): Promise<void> {
        if (!credential) return
        setCredentialStatus(await writeClipboard(credential.secret)
            ? 'Client secret copied to clipboard.'
            : 'Clipboard access was blocked. Select and copy the secret instead.')
    }

    /**
     * Fetch the selected client's current secret and copy it to the clipboard without rendering it.
     * The backend audits each request. If the browser blocks clipboard access, the secret is shown in
     * a hidden-from-analytics field until the user hides it or leaves the editor. Errors stay inline.
     */
    async function copySecret(): Promise<void> {
        if (!draft) return
        resetSecretCopy()
        setCopyingSecret(true)
        try {
            const result = await machineRequest<MachineSecret>(
                `clients/${encodeURIComponent(draft.clientId)}/secret`,
                'POST',
            )
            if (await writeClipboard(result.secret)) {
                setSecretStatus('Client secret copied to clipboard.')
            } else {
                setRevealed({ clientId: result.clientId, secret: result.secret })
                setSecretStatus('Clipboard access was blocked. Copy the secret below.')
            }
        } catch (failure) {
            setSecretStatus(failure instanceof Error ? failure.message : 'The secret could not be copied.')
        } finally {
            setCopyingSecret(false)
        }
    }

    /** Remove a revealed existing secret from the editor and component memory. */
    function hideSecret(): void {
        resetSecretCopy()
    }

    /** Set the local client filter from an input change; returns nothing. */
    function changeFilter(event: ChangeEvent<HTMLInputElement>): void {
        setFilter(event.currentTarget.value)
    }

    /** Set the required audit reason from an input/textarea; returns nothing. */
    function changeReason(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        setReason(event.currentTarget.value)
    }

    /** Set the client editor's scope-name search from its input; returns nothing. */
    function changeScopeSearch(event: ChangeEvent<HTMLInputElement>): void {
        setScopeSearch(event.currentTarget.value)
    }

    /** Keep Enter in the scope search from submitting the client form; other keys are untouched. */
    function preventSearchSubmit(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key === 'Enter') event.preventDefault()
    }

    /** Start a blank client editor without issuing credentials. */
    function createClient(): void {
        setDraft(blankClient())
        setReason('')
        setConfirmation(undefined)
        setScopeSearch('')
        resetSecretCopy()
    }

    /** Select a loaded client by button value; ignores an absent client. */
    function selectClient(event: MouseEvent<HTMLButtonElement>): void {
        const client = clients.find(item => item.clientId === event.currentTarget.value)
        if (client) edit(client)
    }

    /** Update a client field from its named input; returns nothing and performs no network request. */
    function changeClient(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const element = event.currentTarget
        if (draft) {
            setDraft({
                ...draft,
                [element.name]:
                    element instanceof HTMLInputElement && element.type === 'checkbox'
                        ? element.checked
                        : element.value,
            })
        }
    }

    /** Update a scope field from its named input; returns nothing and performs no network request. */
    function changeScope(event: ChangeEvent<HTMLInputElement>): void {
        setScopeDraft({ ...scopeDraft, [event.currentTarget.name]: event.currentTarget.value })
    }

    /** Toggle allowed scope from checkbox value while maintaining default membership. */
    function changeAllowedScope(event: ChangeEvent<HTMLInputElement>): void {
        toggleScope(event.currentTarget.value, 'allowedScopes')
    }

    /** Toggle default scope from checkbox value; allowed membership is enforced by the control/backend. */
    function changeDefaultScope(event: ChangeEvent<HTMLInputElement>): void {
        toggleScope(event.currentTarget.value, 'defaultScopes')
    }

    /** Display replacement consequences before submission. */
    function confirmReplacement(): void {
        setConfirmation('replace-credential')
    }

    /** Display disablement consequences before submission. */
    function confirmDisable(): void {
        setConfirmation('disable')
    }

    /** Close confirmation without changing the client. */
    function cancelConfirmation(): void {
        setConfirmation(undefined)
    }

    /** Close the editor without applying its draft, forgetting any revealed secret. */
    function closeClient(): void {
        setDraft(undefined)
        setConfirmation(undefined)
        setScopeSearch('')
        resetSecretCopy()
    }

    /** Apply an explicitly confirmed saved-client action using its expected revision. */
    function applyConfirmation(): void {
        if (draft && confirmation) {
            mutate(`clients/${encodeURIComponent(draft.clientId)}/${confirmation}`, 'POST', {
                reason,
                revision: draft.revision,
            })
        }
    }

    /** Open the scope dialog with a blank creation form and a fresh audit reason. */
    function openScopeModal(): void {
        setScopeDraft(blankScope())
        setReason('')
        setError('')
        setScopeModalOpen(true)
    }

    /** Close the scope dialog unless a submission is in flight; the draft is discarded. */
    function closeScopeModal(): void {
        if (busy) return
        setScopeModalOpen(false)
        setScopeDraft(blankScope())
        setReason('')
    }

    /** Open the scope dialog for a failed scope using its current revision. */
    function repairScope(event: MouseEvent<HTMLButtonElement>): void {
        const scope = scopes.find(item => item.name === event.currentTarget.value)
        if (scope) {
            setScopeDraft(scope)
            setReason('')
            setError('')
            setScopeModalOpen(true)
        }
    }

    /** Submit scope creation/repair with an audit reason; errors stay inline. */
    function saveScope(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        mutate('scopes', 'POST', { ...scopeDraft, reason })
    }

    /**
     * Render allowed/default checkbox rows for one scope group of the client editor.
     * @param list Scopes to render, already filtered and sorted by groupScopes.
     * @param current Client draft whose allowed/default selections drive the checkboxes.
     * @returns One grid row per scope; defaults stay disabled until the scope is allowed.
     */
    function renderScopeRows(list: MachineScope[], current: ClientDraft): JSX.Element[] {
        return list.map(scope => (
            <div className={styles.scope} key={scope.name}>
                <span>
                    {scope.name}
                    <small>{scope.description}</small>
                </span>
                <input
                    aria-label={`Allow ${scope.name}`}
                    type='checkbox'
                    checked={current.allowedScopes.includes(scope.name)}
                    value={scope.name}
                    onChange={changeAllowedScope}
                />
                <input
                    aria-label={`Default ${scope.name}`}
                    type='checkbox'
                    disabled={!current.allowedScopes.includes(scope.name)}
                    checked={current.defaultScopes.includes(scope.name)}
                    value={scope.name}
                    onChange={changeDefaultScope}
                />
            </div>
        ))
    }

    if (!machineAccessEnabled) return <p>Machine Access is available only in DEV.</p>

    const selected = clients.find(client => client.clientId === draft?.clientId)
    const filteredClients = clients.filter(client => `${client.clientId} ${client.name} ${client.owner} ${client.state}`
        .toLowerCase()
        .includes(filter.toLowerCase()))
    const scopeGroups = groupScopes(scopes, draft?.revision ? selected?.allowedScopes ?? [] : [], scopeSearch)
    const canCopySecret = !!selected
        && selected.state === 'ready'
        && selected.enabled
        && !(selected.retireAt && Date.parse(selected.retireAt) <= Date.now())
    const scopeHeader = (
        <div className={styles.scope}>
            <strong>Scope</strong>
            <span>Allowed</span>
            <span>Default</span>
        </div>
    )
    return (
        <main className={styles.page}>
            <span className={styles.badge}>DEVELOPMENT · KEYCLOAK</span>
            <h1>Machine Access</h1>
            <p>Manage service clients and the permissions they can request in DEV.</p>
            <div className={styles.notice}>
                Tokens last up to 15 minutes. Disabling a client blocks new tokens; issued tokens remain
                valid until expiry.
            </div>
            <div className={styles.toolbar}>
                <div className={styles.tabs} role='tablist' aria-label='Machine Access views'>
                    {(['clients', 'scopes', 'audit'] as Section[]).map(item => (
                        <button
                            type='button'
                            role='tab'
                            aria-selected={section === item}
                            key={item}
                            disabled={busy}
                            value={item}
                            onClick={selectSection}
                        >
                            {item === 'clients'
                                ? 'Clients'
                                : item === 'scopes'
                                    ? 'Scope catalog'
                                    : 'Audit history'}
                        </button>
                    ))}
                </div>
                {section === 'scopes' ? (
                    <button
                        type='button'
                        className={styles.primaryAction}
                        disabled={loading || busy}
                        onClick={openScopeModal}
                    >
                        Add scope
                    </button>
                ) : (
                    <button type='button' disabled={loading || busy} onClick={refresh}>
                        Refresh
                    </button>
                )}
            </div>
            {error && !scopeModalOpen && (
                <div className={styles.error} role='alert'>
                    {error}
                </div>
            )}
            {notice && (
                <div className={styles.notice} role='status'>
                    {notice}
                </div>
            )}
            {credential && (
                <section
                    className={styles.secret}
                    aria-label='One-time credential'
                    data-dd-privacy='hidden'
                >
                    <h2>Save this credential now</h2>
                    <p>
                        The secret will disappear when you dismiss this panel or leave the page. Store it
                        in your workload’s secret store.
                    </p>
                    <label htmlFor='machine-credential-id'>
                        Client ID
                        <input id='machine-credential-id' readOnly value={credential.clientId} />
                    </label>
                    <label htmlFor='machine-credential-secret'>
                        Client secret
                        <textarea
                            id='machine-credential-secret'
                            readOnly
                            autoComplete='off'
                            value={credential.secret}
                        />
                    </label>
                    <p>
                        Token endpoint:
                        <code>{machineAccessTokenUrl}</code>
                    </p>
                    <div className={styles.actions}>
                        <button type='button' onClick={copyCredential}>
                            Copy client secret
                        </button>
                        <button type='button' onClick={dismissCredential}>
                            I have stored the credential
                        </button>
                    </div>
                    <small role='status'>{credentialStatus}</small>
                </section>
            )}
            {loading && <p role='status'>Loading Machine Access…</p>}
            {section === 'clients' && (
                <>
                    <div className={styles.toolbar}>
                        <label htmlFor='machine-search'>
                            Filter loaded clients
                            <input
                                id='machine-search'
                                value={filter}
                                onChange={changeFilter}
                                placeholder='Name, ID, owner, or state'
                            />
                        </label>
                        <button type='button' disabled={busy} onClick={createClient}>
                            Create client
                        </button>
                    </div>
                    <section className={styles.panel} aria-label='Service clients'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Owner</th>
                                    <th>Status</th>
                                    <th>Last token issued</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map(client => (
                                    <tr key={client.clientId}>
                                        <td>
                                            <strong>{client.name}</strong>
                                            <small>{client.clientId}</small>
                                        </td>
                                        <td>{client.owner}</td>
                                        <td>
                                            {client.state === 'ready'
                                                ? client.enabled
                                                    ? 'Enabled'
                                                    : 'Disabled'
                                                : client.state}
                                            <small>
                                                Revision
                                                {client.appliedRevision}
                                                /
                                                {client.revision}
                                            </small>
                                        </td>
                                        <td>{time(client.lastIssuedAt)}</td>
                                        <td>
                                            <button
                                                type='button'
                                                disabled={busy}
                                                value={client.clientId}
                                                onClick={selectClient}
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!loading && !filteredClients.length && (
                            <p>No matching clients. Create a dedicated client for each workload.</p>
                        )}
                    </section>
                </>
            )}
            {section === 'clients' && draft && (
                <form className={styles.panel} onSubmit={saveClient}>
                    <h2>{draft.revision ? 'Manage client' : 'Create client'}</h2>
                    {selected && (
                        <p>
                            Credential created:
                            {time(selected.credentialCreatedAt)}
                            {selected.retireAt && ` · Retires: ${time(selected.retireAt)}`}
                        </p>
                    )}
                    {selected?.replacedBy && (
                        <p>
                            Replacement client:
                            <code>{selected.replacedBy}</code>
                        </p>
                    )}
                    {selected?.state === 'pending' && (
                        <div className={styles.notice}>
                            An operation is pending. Refresh to check completion; an interrupted
                            operation needs operator reconciliation.
                        </div>
                    )}
                    <fieldset disabled={busy || selected?.state === 'pending'}>
                        <div className={styles.grid}>
                            <div>
                                <label htmlFor='machine-client-id'>
                                    Client ID
                                    <input
                                        id='machine-client-id'
                                        required
                                        pattern='m2m-[a-z0-9][a-z0-9-]{2,89}'
                                        readOnly={!!draft.revision}
                                        value={draft.clientId}
                                        name='clientId'
                                        onChange={changeClient}
                                    />
                                    <small>
                                        Use m2m- followed by lowercase letters, numbers, and hyphens.
                                    </small>
                                </label>
                                {!!draft.revision && (
                                    <div className={styles.copySecret}>
                                        <button
                                            type='button'
                                            disabled={copyingSecret || !canCopySecret}
                                            onClick={copySecret}
                                        >
                                            {copyingSecret ? 'Copying…' : 'Copy client secret'}
                                        </button>
                                        <small role='status'>
                                            {secretStatus
                                                || (canCopySecret
                                                    ? 'Copies are recorded in the audit history.'
                                                    : 'Only ready, enabled clients have a usable secret.')}
                                        </small>
                                    </div>
                                )}
                                {revealed && (
                                    <div className={styles.secret} data-dd-privacy='hidden'>
                                        <label htmlFor='machine-revealed-secret'>
                                            Client secret
                                            <input
                                                id='machine-revealed-secret'
                                                readOnly
                                                autoComplete='off'
                                                value={revealed.secret}
                                            />
                                        </label>
                                        <button type='button' onClick={hideSecret}>
                                            Hide secret
                                        </button>
                                    </div>
                                )}
                                <label htmlFor='machine-name'>
                                    Name
                                    <input
                                        id='machine-name'
                                        required
                                        maxLength={200}
                                        value={draft.name}
                                        name='name'
                                        onChange={changeClient}
                                    />
                                </label>
                                <label htmlFor='machine-owner'>
                                    Owner
                                    <input
                                        id='machine-owner'
                                        required
                                        maxLength={200}
                                        value={draft.owner}
                                        name='owner'
                                        onChange={changeClient}
                                    />
                                </label>
                                <label htmlFor='machine-description'>
                                    Description
                                    <textarea
                                        id='machine-description'
                                        maxLength={1000}
                                        value={draft.description}
                                        name='description'
                                        onChange={changeClient}
                                    />
                                </label>
                                <label>
                                    <input
                                        type='checkbox'
                                        checked={draft.enabled}
                                        name='enabled'
                                        onChange={changeClient}
                                    />
                                    Enabled
                                </label>
                            </div>
                            <div>
                                <h2>Permissions</h2>
                                <p>
                                    Allowed scopes may be requested explicitly. Default scopes apply when
                                    a caller omits scope.
                                </p>
                                <label htmlFor='machine-scope-search'>
                                    Search scopes
                                    <input
                                        id='machine-scope-search'
                                        type='search'
                                        value={scopeSearch}
                                        onChange={changeScopeSearch}
                                        onKeyDown={preventSearchSubmit}
                                        placeholder='Filter by scope name'
                                    />
                                </label>
                                {!!draft.revision && (
                                    <section aria-label='Allowed for this client'>
                                        <h3>{`Allowed for this client (${scopeGroups.allowed.length})`}</h3>
                                        {scopeHeader}
                                        {renderScopeRows(scopeGroups.allowed, draft)}
                                        {!scopeGroups.allowed.length && (
                                            <small>
                                                {scopeSearch.trim()
                                                    ? 'No allowed scopes match the search.'
                                                    : 'This client has no allowed scopes.'}
                                            </small>
                                        )}
                                    </section>
                                )}
                                <section aria-label={draft.revision ? 'Other scopes' : 'Available scopes'}>
                                    <h3>
                                        {`${draft.revision ? 'Other scopes' : 'Available scopes'} (${
                                            scopeGroups.other.length})`}
                                    </h3>
                                    {scopeHeader}
                                    {renderScopeRows(scopeGroups.other, draft)}
                                    {!scopeGroups.other.length && (
                                        <small>
                                            {scopeSearch.trim()
                                                ? 'No other scopes match the search.'
                                                : draft.revision
                                                    ? 'Every ready scope is already allowed.'
                                                    : 'No ready scopes are available.'}
                                        </small>
                                    )}
                                </section>
                                <small>Select at least one allowed and default scope.</small>
                            </div>
                        </div>
                        <label htmlFor='machine-reason'>
                            Reason for change
                            <textarea
                                id='machine-reason'
                                required
                                maxLength={500}
                                value={reason}
                                onChange={changeReason}
                            />
                        </label>
                        <div className={styles.actions}>
                            <button
                                type='submit'
                                disabled={!draft.defaultScopes.length || !reason.trim()}
                            >
                                Apply changes
                            </button>
                            {!!draft.revision && (
                                <button
                                    type='button'
                                    disabled={
                                        !selected?.enabled
                                        || selected?.state !== 'ready'
                                        || !!selected?.replacedBy
                                    }
                                    onClick={confirmReplacement}
                                >
                                    Replace credential
                                </button>
                            )}
                            {!!draft.revision && (
                                <button
                                    type='button'
                                    disabled={!selected?.enabled}
                                    onClick={confirmDisable}
                                >
                                    Disable client
                                </button>
                            )}
                            <button type='button' onClick={closeClient}>
                                Close
                            </button>
                        </div>
                        {confirmation && (
                            <div className={styles.notice}>
                                <p>
                                    {confirmation === 'disable'
                                        ? 'Block new tokens? Issued tokens remain valid for up to 15 minutes.'
                                        : 'Create a new client with the saved grants? '
                                            + 'Update the workload’s ID and secret within 24 hours. '
                                            + 'The old credential then stops issuing tokens.'}
                                </p>
                                <button
                                    type='button'
                                    disabled={!reason.trim()}
                                    onClick={applyConfirmation}
                                >
                                    Confirm
                                    {confirmation === 'disable' ? 'disablement' : 'replacement'}
                                </button>
                                {' '}
                                <button type='button' onClick={cancelConfirmation}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </fieldset>
                </form>
            )}
            {section === 'scopes' && (
                <section className={styles.panel}>
                    <h2>Scope catalog</h2>
                    <p>
                        Adding a scope does not grant it to any client. The receiving API must
                        implement the permission.
                    </p>
                    <table>
                        <thead>
                            <tr>
                                <th>Scope</th>
                                <th>Description</th>
                                <th>Owner</th>
                                <th>State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scopes.map(scope => (
                                <tr key={scope.name}>
                                    <td>{scope.name}</td>
                                    <td>{scope.description}</td>
                                    <td>{scope.owner}</td>
                                    <td>
                                        {scope.state}
                                        {scope.state === 'failed' && (
                                            <button
                                                type='button'
                                                value={scope.name}
                                                onClick={repairScope}
                                            >
                                                Repair
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
            <BaseModal
                open={scopeModalOpen}
                onClose={closeScopeModal}
                title={scopeDraft.revision ? 'Repair failed scope' : 'Add scope'}
                size='md'
            >
                <form className={styles.dialog} onSubmit={saveScope}>
                    {error && (
                        <div className={styles.error} role='alert'>
                            {error}
                        </div>
                    )}
                    <p>
                        Adding a scope does not grant it to any client. The receiving API must
                        implement the permission.
                    </p>
                    <fieldset disabled={busy}>
                        <label htmlFor='scope-name'>
                            Permission name
                            <input
                                id='scope-name'
                                required
                                readOnly={!!scopeDraft.revision}
                                pattern='[A-Za-z][A-Za-z0-9_.\-]{0,79}(:[A-Za-z][A-Za-z0-9_.\-]{0,79})?'
                                value={scopeDraft.name}
                                name='name'
                                onChange={changeScope}
                                placeholder='read:groups'
                            />
                        </label>
                        <label htmlFor='scope-description'>
                            Description
                            <input
                                id='scope-description'
                                required
                                maxLength={1000}
                                value={scopeDraft.description}
                                name='description'
                                onChange={changeScope}
                            />
                        </label>
                        <label htmlFor='scope-owner'>
                            Owning team
                            <input
                                id='scope-owner'
                                required
                                maxLength={200}
                                value={scopeDraft.owner}
                                name='owner'
                                onChange={changeScope}
                            />
                        </label>
                        <label htmlFor='scope-reason'>
                            Reason
                            <input
                                id='scope-reason'
                                required
                                maxLength={500}
                                value={reason}
                                onChange={changeReason}
                            />
                        </label>
                        <div className={styles.actions}>
                            <button type='submit' className={styles.primaryAction}>
                                {busy ? 'Applying…' : 'Apply scope'}
                            </button>
                            <button type='button' onClick={closeScopeModal}>
                                Cancel
                            </button>
                        </div>
                    </fieldset>
                </form>
            </BaseModal>
            {section === 'audit' && (
                <section className={styles.panel}>
                    <h2>Audit history</h2>
                    <p>
                        Intent and outcome are recorded separately. Credentials and token values are
                        excluded.
                    </p>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Actor</th>
                                <th>Action / target</th>
                                <th>Reason</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {audit.map(entry => (
                                <tr key={`${entry.id}-${entry.state}-${entry.createdAt}`}>
                                    <td>{time(entry.createdAt)}</td>
                                    <td>{entry.actor}</td>
                                    <td>
                                        {entry.action}
                                        <small>{entry.target}</small>
                                    </td>
                                    <td>{entry.reason}</td>
                                    <td>{entry.state}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!audit.length && !loading && <p>No management operations recorded yet.</p>}
                </section>
            )}
            {next && (
                <button type='button' disabled={loading || busy} onClick={loadMore}>
                    Load more
                </button>
            )}
        </main>
    )
}

export default MachineAccessPage
