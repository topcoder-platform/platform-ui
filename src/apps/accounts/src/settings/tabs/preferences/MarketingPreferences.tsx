import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react'

import { Button } from '~/libs/ui'

import {
    getMarketingPreferences,
    MarketingPreferences as Preferences,
    saveMarketingPreferences,
} from '../../../lib/services/marketing-preferences.service'

import styles from './PreferencesTab.module.scss'

/**
 * Shows and saves the signed-in member's marketing email choices in Accounts preferences.
 * @returns A category form with explicit opt-in, loading/error states and delivery status.
 * @throws No render exceptions for API failures; rejected reads/writes show a retryable message.
 */
const MarketingPreferences: FC = () => {
    const [preferences, setPreferences] = useState<Preferences>()
    const [selected, setSelected] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)
    const [reload, setReload] = useState(0)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        setError('')
        getMarketingPreferences()
            .then(response => {
                if (!mounted) return
                setPreferences(response)
                setSelected(response.subscriptions.filter(item => item.active && item.subscribed)
                    .map(item => item.subscriptionTypeId))
            })
            .catch(() => {
                if (mounted) setError('Email preferences could not be loaded. Please try again.')
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => { mounted = false }
    }, [reload])

    /** Retry a failed preference read; takes no input, returns void and does not throw. */
    const handleReload = useCallback((): void => { setReload(value => value + 1) }, [])

    /**
     * Change one local category choice before save.
     * @param event Checkbox change containing its category ID and checked state.
     * @returns Nothing; updates the pending selection and clears an old saved confirmation.
     * @throws No exceptions.
     */
    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        const { checked, value }: { checked: boolean, value: string } = event.currentTarget
        setSelected(previous => (checked ? [...previous, value] : previous.filter(id => id !== value)))
        setSaved(false)
    }, [])

    /**
     * Persist the full pending selection, including an intentional empty selection.
     * @returns Completion after the API confirms the server's saved choices.
     * @throws No API exceptions outward; failures preserve the pending selection for retry.
     */
    const handleSave = useCallback(async (): Promise<void> => {
        setSaving(true)
        setError('')
        setSaved(false)
        try {
            const response = await saveMarketingPreferences(selected)
            setPreferences(response)
            setSelected(response.subscriptions.filter(item => item.active && item.subscribed)
                .map(item => item.subscriptionTypeId))
            setSaved(true)
        } catch {
            setError('Your email preferences were not saved. Please try again.')
        } finally {
            setSaving(false)
        }
    }, [selected])

    const categories = preferences?.subscriptions.filter(item => item.active) ?? []
    const current = categories.filter(item => item.subscribed)
        .map(item => item.subscriptionTypeId)
    const changed = current.length !== selected.length || selected.some(id => !current.includes(id))

    return (
        <section className={styles.marketing} aria-labelledby='marketing-preferences-title'>
            <h4 id='marketing-preferences-title'>Email preferences</h4>
            <p>Choose the Topcoder newsletters and updates you would like to receive.</p>
            {loading && <p role='status'>Loading your email preferences…</p>}
            {error && <p className={styles.preferenceError} role='alert'>{error}</p>}
            {!loading && !preferences && (
                <Button label='Try again' secondary size='lg' onClick={handleReload} />
            )}
            {!loading && preferences && (
                <>
                    {preferences.suppressed && (
                        <p className={styles.deliveryNotice} role='status'>
                            Delivery to your email address is paused. You can save your preferences,
                            but emails will remain paused.
                        </p>
                    )}
                    <fieldset className={styles.emailCategories} disabled={saving}>
                        <legend className={styles.preferenceLegend}>Email categories</legend>
                        {categories.map(category => (
                            <label className={styles.emailCategory} key={category.subscriptionTypeId}>
                                <input
                                    checked={selected.includes(category.subscriptionTypeId)}
                                    onChange={handleChange}
                                    type='checkbox'
                                    value={category.subscriptionTypeId}
                                />
                                <span>
                                    <strong>{category.name}</strong>
                                    <span>{category.description}</span>
                                </span>
                            </label>
                        ))}
                    </fieldset>
                    {!categories.length && <p>No email categories are available right now.</p>}
                    <p className={styles.preferenceHint}>
                        Leave all categories unchecked to unsubscribe from marketing emails.
                        Account and security messages will still reach you.
                    </p>
                    <Button
                        disabled={saving || !changed}
                        label={saving ? 'Saving…' : 'Save email preferences'}
                        primary
                        size='lg'
                        onClick={handleSave}
                    />
                    {saved && <p className={styles.preferenceSaved} role='status'>Your email preferences are saved.</p>}
                </>
            )}
        </section>
    )
}

export default MarketingPreferences
