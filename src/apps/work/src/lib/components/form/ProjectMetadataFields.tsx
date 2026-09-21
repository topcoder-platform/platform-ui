import {
    FC,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'
import classNames from 'classnames'

import { isSalesforceOpportunityId } from '../../constants/salesforce.constants'
import { SMU_VALUES } from '../../constants/showcase.constants'
import {
    fetchSalesforceOpportunity,
    SalesforceOpportunity,
    salesforceOpportunityErrorMessage,
} from '../../services/salesforce-opportunities.service'

import { FormSelectField } from './FormSelectField'
import { FormTextField } from './FormTextField'
import styles from './ProjectMetadataFields.module.scss'

const lookupDebounceMs = 400

interface ProjectMetadataFieldsProps {
    className?: string
    required?: boolean
    /** Enables the Salesforce Opportunity ID lookup that populates the fields below. */
    showSalesforceOpportunity?: boolean
}

type LookupState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; opportunity: SalesforceOpportunity }

/**
 * Renders the shared Customer, SMU and Deal Close Date fields in both project forms.
 * @param props Optional field styling, whether showcase metadata is required, and
 * whether the Salesforce Opportunity ID lookup is offered.
 * @returns Fields bound to the surrounding React Hook Form, including custom SMU input.
 * @throws Requires a parent FormProvider, like the other work form controls.
 */
export const ProjectMetadataFields: FC<ProjectMetadataFieldsProps> = props => {
    const formContext = useFormContext()
    const smu = formContext.watch('smu')
    const opportunityId = formContext.watch('salesforceOpportunityId')
    const [lookup, setLookup] = useState<LookupState>({ status: 'idle' })
    // Populating the fields is a response to typing, so reopening a linked
    // project never overwrites details that were edited by hand afterwards.
    const enteredByUser = useRef(false)

    const setValue = formContext.setValue

    const applyOpportunity = useCallback(
        (opportunity: SalesforceOpportunity): void => {
            const options = { shouldDirty: true, shouldValidate: true }

            if (opportunity.customer) {
                setValue('customer', opportunity.customer, options)
            }

            if (opportunity.smu) {
                setValue('smu', opportunity.smu, options)
                setValue(
                    'smuOther',
                    opportunity.smu === 'Others' ? opportunity.smuOther || '' : '',
                    options,
                )
            }

            if (opportunity.closeDate) {
                setValue('dealCloseDate', opportunity.closeDate, options)
            }
        },
        [setValue],
    )

    useEffect(() => {
        if (!props.showSalesforceOpportunity) {
            return undefined
        }

        const trimmedId = (opportunityId || '').trim()
        if (!trimmedId || !isSalesforceOpportunityId(trimmedId)) {
            setLookup({ status: 'idle' })
            return undefined
        }

        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            setLookup({ status: 'loading' })
            fetchSalesforceOpportunity(trimmedId, controller.signal)
                .then(opportunity => {
                    if (controller.signal.aborted) {
                        return
                    }

                    setLookup({ opportunity, status: 'ready' })

                    if (enteredByUser.current) {
                        applyOpportunity(opportunity)
                    }
                })
                .catch(error => {
                    if (controller.signal.aborted) {
                        return
                    }

                    setLookup({
                        message: salesforceOpportunityErrorMessage(error),
                        status: 'error',
                    })
                })
        }, lookupDebounceMs)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [applyOpportunity, opportunityId, props.showSalesforceOpportunity])

    /** @param value Raw field input. @returns Nothing; marks the id as user-entered. Does not throw. */
    function handleOpportunityIdChange(): void {
        enteredByUser.current = true
    }

    return (
        <>
            {props.showSalesforceOpportunity && (
                <>
                    <FormTextField
                        className={props.className}
                        hint='Populates Customer, SMU and Deal Close Date from the Salesforce opportunity.'
                        label='Salesforce Opportunity ID'
                        maxLength={18}
                        name='salesforceOpportunityId'
                        onChange={handleOpportunityIdChange}
                        placeholder='006XXXXXXXXXXXXXXX'
                    />
                    {lookup.status !== 'idle' && (
                        <div
                            aria-live='polite'
                            className={classNames(
                                props.className,
                                styles.opportunityStatus,
                                lookup.status === 'error' ? styles.opportunityError : undefined,
                            )}
                        >
                            {lookup.status === 'loading' && 'Looking up the Salesforce opportunity…'}
                            {lookup.status === 'error' && lookup.message}
                            {lookup.status === 'ready' && (
                                <>
                                    <a
                                        className={styles.opportunityLink}
                                        href={lookup.opportunity.url}
                                        rel='noopener noreferrer'
                                        target='_blank'
                                    >
                                        View in Salesforce
                                    </a>
                                    {lookup.opportunity.name && (
                                        <span className={styles.opportunityName}>
                                            {` — ${lookup.opportunity.name}`}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
            <FormTextField
                className={props.className}
                label='Customer'
                name='customer'
                maxLength={255}
                required={props.required}
            />
            <FormSelectField
                className={props.className}
                label='SMU'
                name='smu'
                options={SMU_VALUES.map(value => ({ label: value, value }))}
                isClearable={!props.required}
                required={props.required}
            />
            {smu === 'Others' && (
                <FormTextField
                    className={props.className}
                    label='Other SMU'
                    name='smuOther'
                    maxLength={255}
                    required
                />
            )}
            <FormTextField
                className={props.className}
                label='Deal Close Date'
                name='dealCloseDate'
                type='date'
                required={props.required}
            />
        </>
    )
}
