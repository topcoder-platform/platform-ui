import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, type ControllerRenderProps, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { tokenGetAsync } from '~/libs/core'
import { Button, ContentLayout, IconOutline, LoadingSpinner } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import type { CreateApplicationRequest, Engagement } from '../../lib/models'
import { EngagementStatus } from '../../lib/models'
import {
    checkExistingApplication,
    createApplication,
    getEngagementByNanoId,
    getUserDataForApplication,
    updateUserDataForApplication,
} from '../../lib/services'
import { rootRoute } from '../../engagements.routes'

import type { ApplicationFormData, PrePopulatedUserData } from './application-form.types'
import { applicationFormSchema } from './application-form.schema'
import {
    AVAILABLE_FULL_TIME_QUESTION,
    AVAILABLE_WITHIN_WEEK_QUESTION,
    buildAvailabilityText,
    buildReferralSourceText,
    REFERRAL_SOURCE_OPTIONS,
    REFERRED_BY_OPTION,
} from './application-form.constants'
import CvUploadField from './components/CvUploadField'
import YesNoField from './components/YesNoField'
import styles from './ApplicationFormPage.module.scss'

interface SubmitDisabledParams {
    applicationError?: string
    hasApplied: boolean
    hasSubmitted: boolean
    isFormDisabled: boolean
    isLoading: boolean
    isUploadingCv: boolean
    isValid: boolean
}

const getIsSubmitDisabled = (params: SubmitDisabledParams): boolean => (
    params.isFormDisabled
    || params.isLoading
    || params.isUploadingCv
    || params.hasApplied
    || Boolean(params.applicationError)
    || (params.hasSubmitted && !params.isValid)
)

const ApplicationFormPage: FC = () => {
    const params = useParams<{ nanoId: string }>()
    const nanoId = params.nanoId
    const navigate = useNavigate()

    const [engagement, setEngagement] = useState<Engagement | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [userData, setUserData] = useState<PrePopulatedUserData | undefined>(undefined)
    const [userDataLoading, setUserDataLoading] = useState<boolean>(true)
    const [hasApplied, setHasApplied] = useState<boolean>(false)
    const [checkingApplication, setCheckingApplication] = useState<boolean>(false)
    const [applicationError, setApplicationError] = useState<string | undefined>(undefined)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [uploadingCv, setUploadingCv] = useState<boolean>(false)

    const form = useForm<ApplicationFormData>({
        defaultValues: {
            address: '',
            availableFullTime: undefined,
            availableWithinWeek: undefined,
            cvFileUrl: undefined,
            email: '',
            expectedPayRate: '',
            mobileNumber: '',
            name: '',
            referralSource: '',
            referrerHandle: '',
        },
        mode: 'all',
        resolver: yupResolver(applicationFormSchema),
    })

    const control = form.control
    const errors = form.formState.errors
    const handleSubmit = form.handleSubmit
    const isValid = form.formState.isValid
    const hasSubmitted = form.formState.submitCount > 0
    const getValues = form.getValues
    const setValue = form.setValue
    const clearErrors = form.clearErrors
    const isReferred = form.watch('referralSource') === REFERRED_BY_OPTION

    const fetchEngagement = useCallback(async (): Promise<void> => {
        if (!nanoId) {
            navigate(rootRoute || '/', {
                replace: true,
                state: { engagementError: 'Engagement not found.' },
            })
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getEngagementByNanoId(nanoId)
            setCheckingApplication(true)
            setEngagement(response)
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 404) {
                navigate(rootRoute || '/', {
                    replace: true,
                    state: { engagementError: 'Engagement not found.' },
                })
                return
            }

            setError('Unable to load engagement details. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [nanoId, navigate])

    const fetchUserData = useCallback(async (): Promise<void> => {
        setUserDataLoading(true)
        try {
            const response = await getUserDataForApplication()
            setUserData(response)
        } catch (err) {
            setUserData({ email: '', name: '' })
        } finally {
            setUserDataLoading(false)
        }
    }, [])

    const checkApplication = useCallback(async (): Promise<void> => {
        if (!engagement?.id) {
            return
        }

        setCheckingApplication(true)
        setApplicationError(undefined)

        try {
            const response = await checkExistingApplication(engagement.id)
            setHasApplied(response.hasApplied)
        } catch (err) {
            setApplicationError('Unable to confirm your application status. Please try again.')
        } finally {
            setCheckingApplication(false)
        }
    }, [engagement?.id])

    useEffect(() => {
        fetchEngagement()
        fetchUserData()
    }, [fetchEngagement, fetchUserData])

    useEffect(() => {
        if (!userData) {
            return
        }

        setValue('name', userData.name ?? '', {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
        })
        setValue('email', userData.email ?? '', {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
        })
        setValue('address', userData.address ?? '', {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
        })
        setValue('mobileNumber', userData.mobileNumber ?? '', {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
        })
    }, [setValue, userData])

    useEffect(() => {
        checkApplication()
    }, [checkApplication])

    useEffect(() => {
        if (!hasApplied) {
            return () => undefined
        }

        const timeoutId = window.setTimeout(() => {
            navigate('/my-applications')
        }, 3000)

        return () => window.clearTimeout(timeoutId)
    }, [hasApplied, navigate])

    const isEngagementOpen = engagement?.status === EngagementStatus.OPEN

    const isLoading = loading || userDataLoading || checkingApplication

    const pageTitle = useMemo(() => (
        engagement ? `Apply for ${engagement.title}` : 'Application Form'
    ), [engagement])

    const handleBackToEngagement = useCallback(() => {
        if (nanoId) {
            navigate(`${rootRoute}/${nanoId}`)
            return
        }

        navigate(rootRoute || '/')
    }, [nanoId, navigate])

    const handleRetry = useCallback(() => {
        fetchEngagement()
    }, [fetchEngagement])

    const handleRetryApplicationCheck = useCallback(() => {
        checkApplication()
    }, [checkApplication])

    const handleCancel = useCallback(() => {
        handleBackToEngagement()
    }, [handleBackToEngagement])

    const handleGoToMyApplications = useCallback(() => {
        navigate('/my-applications')
    }, [navigate])

    const buildCreateApplicationRequest = useCallback(
        (values: ApplicationFormData): CreateApplicationRequest => {
            const trimmedName = values.name?.trim()
            const trimmedEmail = values.email?.trim()
            const trimmedAddress = values.address?.trim()
            const trimmedExpectedPayRate = values.expectedPayRate?.trim() || ''

            return {
                address: trimmedAddress || undefined,
                availability: buildAvailabilityText(values.availableWithinWeek, values.availableFullTime),
                cvFileUrl: values.cvFileUrl || undefined,
                email: trimmedEmail || undefined,
                expectedPayRate: trimmedExpectedPayRate,
                mobileNumber: values.mobileNumber?.trim() || undefined,
                name: trimmedName || undefined,
                referralSource: buildReferralSourceText(values.referralSource, values.referrerHandle),
            }
        },
        [],
    )

    const handleSubmissionError = useCallback((err: any): void => {
        const status = err?.response?.status
        if (status === 409) {
            toast.error('You have already applied for this engagement.')
            return
        }

        const errorMessage = err?.response?.data?.message
            || err?.message
            || 'Unable to submit your application. Please try again.'

        toast.error(errorMessage)
    }, [])

    const onSubmit = useCallback(async (): Promise<void> => {
        if (!engagement?.id || submitting || !isEngagementOpen) {
            return
        }

        setSubmitting(true)

        try {
            const values = getValues()
            try {
                await updateUserDataForApplication(
                    {
                        address: values.address ?? '',
                        email: values.email ?? '',
                        name: values.name ?? '',
                    },
                    userData,
                )
            } catch {
                toast.error('Unable to save your contact details. Please try again.')
                return
            }

            const request = buildCreateApplicationRequest(values)
            let handle: string | undefined
            try {
                const token = await tokenGetAsync()
                handle = typeof token?.handle === 'string' ? token.handle.trim() : undefined
            } catch {
                handle = undefined
            }

            await createApplication(engagement.id, {
                ...request,
                ...(handle ? { handle } : {}),
            })
            clearErrors()
            toast.success('Application submitted successfully!')
            navigate('/my-applications')
        } catch (err: any) {
            handleSubmissionError(err)
        } finally {
            setSubmitting(false)
        }
    }, [
        buildCreateApplicationRequest,
        clearErrors,
        engagement?.id,
        getValues,
        handleSubmissionError,
        isEngagementOpen,
        navigate,
        submitting,
        updateUserDataForApplication,
        userData,
    ])

    const handleTextInputChange = useCallback(
        (
            field:
                | ControllerRenderProps<ApplicationFormData, 'expectedPayRate'>
                | ControllerRenderProps<ApplicationFormData, 'referrerHandle'>,
        ) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const handleReferralSourceChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'referralSource'>) => (
            (event: ChangeEvent<HTMLSelectElement>): void => {
                field.onChange(event.target.value)
                if (event.target.value !== REFERRED_BY_OPTION) {
                    setValue('referrerHandle', '', { shouldValidate: true })
                }
            }
        ),
        [setValue],
    )

    const handleMobileNumberChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'mobileNumber'>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const handleContactFieldChange = useCallback(
        (
            field:
                | ControllerRenderProps<ApplicationFormData, 'name'>
                | ControllerRenderProps<ApplicationFormData, 'email'>
                | ControllerRenderProps<ApplicationFormData, 'address'>,
        ) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                const nextValue = event.target.value
                field.onChange(nextValue || undefined)
            }
        ),
        [],
    )

    const isFormDisabled = submitting || !isEngagementOpen

    const isSubmitDisabled = getIsSubmitDisabled({
        applicationError,
        hasApplied,
        hasSubmitted,
        isFormDisabled,
        isLoading,
        isUploadingCv: uploadingCv,
        isValid,
    })

    const renderCvFileField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'cvFileUrl'> }): JSX.Element => (
            <CvUploadField
                engagementId={engagement?.id}
                value={renderProps.field.value}
                onChange={renderProps.field.onChange}
                onUploadingChange={setUploadingCv}
                disabled={isFormDisabled}
                errorMessage={errors.cvFileUrl?.message}
            />
        ),
        [engagement?.id, errors.cvFileUrl?.message, isFormDisabled],
    )

    const renderExpectedPayRateField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'expectedPayRate'> }): JSX.Element => (
            <input
                id='expected-pay-rate'
                type='text'
                className={classNames(
                    styles.inputField,
                    errors.expectedPayRate && styles.inputError,
                )}
                maxLength={100}
                placeholder='e.g. USD 50/hour'
                value={renderProps.field.value ?? ''}
                onChange={handleTextInputChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.expectedPayRate}
                aria-describedby={errors.expectedPayRate ? 'expected-pay-rate-error' : undefined}
            />
        ),
        [errors.expectedPayRate, handleTextInputChange, isFormDisabled],
    )

    const renderReferralSourceField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'referralSource'> }): JSX.Element => (
            <select
                id='referral-source'
                className={classNames(
                    styles.inputField,
                    styles.selectField,
                    errors.referralSource && styles.inputError,
                )}
                value={renderProps.field.value ?? ''}
                onChange={handleReferralSourceChange(renderProps.field)}
                onBlur={renderProps.field.onBlur}
                disabled={isFormDisabled}
                aria-invalid={!!errors.referralSource}
                aria-describedby={errors.referralSource ? 'referral-source-error' : undefined}
            >
                <option value=''>Select an option</option>
                {REFERRAL_SOURCE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        ),
        [errors.referralSource, handleReferralSourceChange, isFormDisabled],
    )

    const renderReferrerHandleField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'referrerHandle'> }): JSX.Element => (
            <input
                id='referrer-handle'
                type='text'
                className={classNames(
                    styles.inputField,
                    errors.referrerHandle && styles.inputError,
                )}
                maxLength={100}
                placeholder='Topcoder handle of the member who referred you'
                value={renderProps.field.value ?? ''}
                onChange={handleTextInputChange(renderProps.field)}
                onBlur={renderProps.field.onBlur}
                disabled={isFormDisabled}
                aria-label='Referred by member'
                aria-invalid={!!errors.referrerHandle}
                aria-describedby={errors.referrerHandle ? 'referrer-handle-error' : undefined}
            />
        ),
        [errors.referrerHandle, handleTextInputChange, isFormDisabled],
    )

    const renderAvailableWithinWeekField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'availableWithinWeek'> }): JSX.Element => (
            <YesNoField
                id='available-within-week'
                question={AVAILABLE_WITHIN_WEEK_QUESTION}
                value={renderProps.field.value}
                onChange={renderProps.field.onChange}
                onBlur={renderProps.field.onBlur}
                disabled={isFormDisabled}
                errorMessage={errors.availableWithinWeek?.message}
            />
        ),
        [errors.availableWithinWeek?.message, isFormDisabled],
    )

    const renderAvailableFullTimeField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'availableFullTime'> }): JSX.Element => (
            <YesNoField
                id='available-full-time'
                question={AVAILABLE_FULL_TIME_QUESTION}
                value={renderProps.field.value}
                onChange={renderProps.field.onChange}
                onBlur={renderProps.field.onBlur}
                disabled={isFormDisabled}
                errorMessage={errors.availableFullTime?.message}
            />
        ),
        [errors.availableFullTime?.message, isFormDisabled],
    )

    const renderMobileNumberField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'mobileNumber'> }): JSX.Element => (
            <input
                id='mobile-number'
                type='tel'
                className={classNames(
                    styles.inputField,
                    errors.mobileNumber && styles.inputError,
                )}
                placeholder='+1 (555) 123-4567'
                value={renderProps.field.value ?? ''}
                onChange={handleMobileNumberChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.mobileNumber}
                aria-describedby={errors.mobileNumber ? 'mobile-number-error' : undefined}
            />
        ),
        [errors.mobileNumber, handleMobileNumberChange, isFormDisabled],
    )

    const renderNameField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'name'> }): JSX.Element => (
            <input
                id='applicant-name'
                type='text'
                className={classNames(
                    styles.inputField,
                    errors.name && styles.inputError,
                )}
                placeholder='Full name'
                value={renderProps.field.value ?? ''}
                onChange={handleContactFieldChange(renderProps.field)}
                disabled
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'applicant-name-error' : undefined}
            />
        ),
        [errors.name, handleContactFieldChange],
    )

    const renderEmailField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'email'> }): JSX.Element => (
            <input
                id='applicant-email'
                type='email'
                className={classNames(
                    styles.inputField,
                    errors.email && styles.inputError,
                )}
                placeholder='you@example.com'
                value={renderProps.field.value ?? ''}
                onChange={handleContactFieldChange(renderProps.field)}
                disabled
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'applicant-email-error' : undefined}
            />
        ),
        [errors.email, handleContactFieldChange],
    )

    const renderAddressInput = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'address'> }): JSX.Element => (
            <input
                id='applicant-address'
                type='text'
                className={classNames(
                    styles.inputField,
                    errors.address && styles.inputError,
                )}
                placeholder='Street, City, State, ZIP'
                value={renderProps.field.value ?? ''}
                onChange={handleContactFieldChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'applicant-address-error' : undefined}
            />
        ),
        [errors.address, handleContactFieldChange, isFormDisabled],
    )

    const renderLoadingState = (): JSX.Element => (
        <div className={styles.loadingState}>
            <LoadingSpinner className={styles.loadingSpinner} inline />
            <div className={styles.skeletonBlock} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
        </div>
    )

    const renderErrorState = (): JSX.Element => (
        <div className={styles.errorState}>
            <IconOutline.ExclamationIcon className={styles.errorIcon} />
            <div>
                <p className={styles.errorText}>{error}</p>
                <Button label='Retry' onClick={handleRetry} primary />
            </div>
        </div>
    )

    const renderMissingEngagementState = (): JSX.Element => (
        <div className={styles.errorState}>
            <IconOutline.ExclamationIcon className={styles.errorIcon} />
            <div>
                <p className={styles.errorText}>Engagement not available.</p>
                <Button
                    label='Back to Engagements'
                    onClick={handleBackToEngagement}
                    secondary
                />
            </div>
        </div>
    )

    const renderApplicationErrorState = (): JSX.Element => (
        <div className={styles.errorState}>
            <IconOutline.ExclamationIcon className={styles.errorIcon} />
            <div>
                <p className={styles.errorText}>{applicationError}</p>
                <Button label='Retry' onClick={handleRetryApplicationCheck} primary />
            </div>
        </div>
    )

    const renderAlreadyAppliedState = (): JSX.Element => (
        <div className={styles.infoMessage}>
            <IconOutline.InformationCircleIcon className={styles.infoIcon} />
            <div>
                <div>You have already applied for this engagement.</div>
                <div className={styles.infoActions}>
                    <Button
                        label='Go to My Applications'
                        onClick={handleGoToMyApplications}
                        secondary
                    />
                    <Button
                        label='Back to Engagement'
                        onClick={handleBackToEngagement}
                        primary
                    />
                </div>
            </div>
        </div>
    )

    const renderEngagementNotOpenBanner = (): JSX.Element | undefined => {
        if (isEngagementOpen) {
            return undefined
        }

        return (
            <div className={styles.infoMessage} data-variant='error'>
                <IconOutline.ExclamationIcon className={styles.infoIcon} />
                <div>This engagement is not accepting applications.</div>
            </div>
        )
    }

    const renderAddressField = (): JSX.Element => (
        <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor='applicant-address'>Address</label>
            <Controller
                name='address'
                control={control}
                render={renderAddressInput}
            />
            {errors.address && (
                <div className={styles.fieldError} id='applicant-address-error'>
                    {errors.address.message}
                </div>
            )}
        </div>
    )

    const renderForm = (): JSX.Element => (
        <div className={styles.formContainer}>
            {renderEngagementNotOpenBanner()}

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Your Information</div>
                    <div className={styles.readOnlyGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor='applicant-name'>Name</label>
                            <Controller
                                name='name'
                                control={control}
                                render={renderNameField}
                            />
                            {errors.name && (
                                <div className={styles.fieldError} id='applicant-name-error'>
                                    {errors.name.message}
                                </div>
                            )}
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor='applicant-email'>Email</label>
                            <Controller
                                name='email'
                                control={control}
                                render={renderEmailField}
                            />
                            {errors.email && (
                                <div className={styles.fieldError} id='applicant-email-error'>
                                    {errors.email.message}
                                </div>
                            )}
                        </div>
                        {renderAddressField()}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor='mobile-number'>
                                Mobile Number
                                <span className={styles.requiredIndicator} aria-hidden='true'>*</span>
                            </label>
                            <Controller
                                name='mobileNumber'
                                control={control}
                                render={renderMobileNumberField}
                            />
                            {errors.mobileNumber && (
                                <div className={styles.fieldError} id='mobile-number-error'>
                                    {errors.mobileNumber.message}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Application Details</div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='cv-file'>
                            CV / Resume File
                            <span className={styles.requiredIndicator} aria-hidden='true'>*</span>
                        </label>
                        <Controller
                            name='cvFileUrl'
                            control={control}
                            render={renderCvFileField}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='expected-pay-rate'>
                            Expected Pay Rate (USD/Hour)
                            <span className={styles.requiredIndicator} aria-hidden='true'>*</span>
                        </label>
                        <Controller
                            name='expectedPayRate'
                            control={control}
                            render={renderExpectedPayRateField}
                        />
                        {errors.expectedPayRate && (
                            <div className={styles.fieldError} id='expected-pay-rate-error'>
                                {errors.expectedPayRate.message}
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                            Availability
                            <span className={styles.requiredIndicator} aria-hidden='true'>*</span>
                        </div>
                        <Controller
                            name='availableWithinWeek'
                            control={control}
                            render={renderAvailableWithinWeekField}
                        />
                        <Controller
                            name='availableFullTime'
                            control={control}
                            render={renderAvailableFullTimeField}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='referral-source'>
                            How did you come to know of the opportunity?
                        </label>
                        <Controller
                            name='referralSource'
                            control={control}
                            render={renderReferralSourceField}
                        />
                        {errors.referralSource && (
                            <div className={styles.fieldError} id='referral-source-error'>
                                {errors.referralSource.message}
                            </div>
                        )}
                        {isReferred && (
                            <>
                                <Controller
                                    name='referrerHandle'
                                    control={control}
                                    render={renderReferrerHandleField}
                                />
                                {errors.referrerHandle && (
                                    <div className={styles.fieldError} id='referrer-handle-error'>
                                        {errors.referrerHandle.message}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>

                <div className={styles.submitSection}>
                    <Button
                        label={(
                            <span className={styles.submitLabel}>
                                {submitting && (
                                    <LoadingSpinner className={styles.submitSpinner} inline />
                                )}
                                Submit Application
                            </span>
                        )}
                        type='submit'
                        primary
                        disabled={isSubmitDisabled}
                    />
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                        disabled={submitting}
                    />
                </div>
            </form>
        </div>
    )

    const renderContent = (): JSX.Element => {
        if (isLoading) {
            return renderLoadingState()
        }

        if (error) {
            return renderErrorState()
        }

        if (!engagement) {
            return renderMissingEngagementState()
        }

        if (applicationError) {
            return renderApplicationErrorState()
        }

        if (hasApplied) {
            return renderAlreadyAppliedState()
        }

        return renderForm()
    }

    return (
        <ContentLayout
            title={pageTitle}
            secondaryButtonConfig={{
                label: 'Back to Engagement',
                onClick: handleBackToEngagement,
            }}
        >
            {renderContent()}
        </ContentLayout>
    )
}

export default ApplicationFormPage
