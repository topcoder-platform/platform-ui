import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, type ControllerRenderProps, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { Button, ContentLayout, IconOutline, LoadingSpinner } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import type { CreateApplicationRequest, Engagement } from '../../lib/models'
import { EngagementStatus } from '../../lib/models'
import {
    checkExistingApplication,
    createApplication,
    getEngagementByNanoId,
    getUserDataForApplication,
} from '../../lib/services'
import { isDeadlinePassed } from '../../lib/utils'
import { rootRoute } from '../../engagements.routes'

import type { ApplicationFormData, PrePopulatedUserData } from './application-form.types'
import { applicationFormSchema } from './application-form.schema'
import CharacterCounter from './components/CharacterCounter'
import PortfolioUrlsField from './components/PortfolioUrlsField'
import styles from './ApplicationFormPage.module.scss'

interface SubmitDisabledParams {
    applicationError?: string
    hasApplied: boolean
    isFormDisabled: boolean
    isLoading: boolean
    isValid: boolean
}

const getIsSubmitDisabled = (params: SubmitDisabledParams): boolean => (
    !params.isValid
    || params.isFormDisabled
    || params.isLoading
    || params.hasApplied
    || Boolean(params.applicationError)
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

    const form = useForm<ApplicationFormData>({
        defaultValues: {
            availability: '',
            coverLetter: '',
            portfolioUrls: [],
            resumeUrl: undefined,
            yearsOfExperience: undefined,
        },
        mode: 'all',
        resolver: yupResolver(applicationFormSchema),
    })

    const control = form.control
    const errors = form.formState.errors
    const handleSubmit = form.handleSubmit
    const isValid = form.formState.isValid
    const getValues = form.getValues
    const clearErrors = form.clearErrors
    const coverLetterValue = form.watch('coverLetter') ?? ''
    const availabilityValue = form.watch('availability') ?? ''

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

    const deadlinePassed = useMemo(() => (
        engagement?.applicationDeadline
            ? isDeadlinePassed(engagement.applicationDeadline)
            : false
    ), [engagement?.applicationDeadline])

    const engagementClosed = engagement?.status === EngagementStatus.CLOSED

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

    const onSubmit = useCallback(async (): Promise<void> => {
        if (!engagement?.id || submitting) {
            return
        }

        setSubmitting(true)

        try {
            const values = getValues()
            const portfolioLinks = values.portfolioUrls?.filter((url): url is string => !!url)
            const request: CreateApplicationRequest = {
                availability: values.availability?.trim() || '',
                coverLetter: values.coverLetter?.trim() || '',
                portfolioLinks,
                resumeUrl: values.resumeUrl || undefined,
                yearsOfExperience: values.yearsOfExperience,
            }

            await createApplication(engagement.id, request)
            clearErrors()
            toast.success('Application submitted successfully!')
            navigate('/my-applications')
        } catch (err: any) {
            const status = err?.response?.status
            if (status === 409) {
                toast.error('You have already applied for this engagement.')
            } else {
                const errorMessage = err?.response?.data?.message
                    || err?.message
                    || 'Unable to submit your application. Please try again.'

                toast.error(errorMessage)
            }
        } finally {
            setSubmitting(false)
        }
    }, [clearErrors, engagement?.id, getValues, navigate, submitting])

    const handleCoverLetterChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'coverLetter'>) => (
            (event: ChangeEvent<HTMLTextAreaElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const handleResumeUrlChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'resumeUrl'>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                const nextValue = event.target.value
                field.onChange(nextValue || undefined)
            }
        ),
        [],
    )

    const handleYearsOfExperienceChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'yearsOfExperience'>) => (
            (event: ChangeEvent<HTMLInputElement>): void => {
                const nextValue = event.target.value
                const parsedValue = nextValue === '' ? undefined : Number(nextValue)
                field.onChange(Number.isNaN(parsedValue) ? undefined : parsedValue)
            }
        ),
        [],
    )

    const handleAvailabilityChange = useCallback(
        (field: ControllerRenderProps<ApplicationFormData, 'availability'>) => (
            (event: ChangeEvent<HTMLTextAreaElement>): void => {
                field.onChange(event.target.value)
            }
        ),
        [],
    )

    const isFormDisabled = submitting || deadlinePassed || engagementClosed

    const isSubmitDisabled = getIsSubmitDisabled({
        applicationError,
        hasApplied,
        isFormDisabled,
        isLoading,
        isValid,
    })

    const renderCoverLetterField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'coverLetter'> }): JSX.Element => (
            <textarea
                id='cover-letter'
                className={classNames(
                    styles.inputField,
                    styles.textareaField,
                    errors.coverLetter && styles.inputError,
                )}
                maxLength={5000}
                placeholder='Share a brief note about your interest in this engagement.'
                value={renderProps.field.value ?? ''}
                onChange={handleCoverLetterChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.coverLetter}
                aria-describedby={errors.coverLetter ? 'cover-letter-error' : undefined}
            />
        ),
        [errors.coverLetter, handleCoverLetterChange, isFormDisabled],
    )

    const renderResumeUrlField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'resumeUrl'> }): JSX.Element => (
            <input
                id='resume-url'
                type='url'
                className={classNames(
                    styles.inputField,
                    errors.resumeUrl && styles.inputError,
                )}
                placeholder='https://'
                value={renderProps.field.value ?? ''}
                onChange={handleResumeUrlChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.resumeUrl}
                aria-describedby={errors.resumeUrl ? 'resume-url-error' : undefined}
            />
        ),
        [errors.resumeUrl, handleResumeUrlChange, isFormDisabled],
    )

    const renderYearsOfExperienceField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'yearsOfExperience'> }): JSX.Element => (
            <input
                id='years-of-experience'
                type='number'
                min={0}
                step={1}
                className={classNames(
                    styles.inputField,
                    errors.yearsOfExperience && styles.inputError,
                )}
                value={renderProps.field.value ?? ''}
                onChange={handleYearsOfExperienceChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.yearsOfExperience}
                aria-describedby={
                    errors.yearsOfExperience
                        ? 'years-of-experience-error'
                        : undefined
                }
            />
        ),
        [errors.yearsOfExperience, handleYearsOfExperienceChange, isFormDisabled],
    )

    const renderAvailabilityField = useCallback(
        (renderProps: { field: ControllerRenderProps<ApplicationFormData, 'availability'> }): JSX.Element => (
            <textarea
                id='availability'
                className={classNames(
                    styles.inputField,
                    styles.textareaField,
                    errors.availability && styles.inputError,
                )}
                maxLength={500}
                placeholder='Share your availability or preferred start date.'
                value={renderProps.field.value ?? ''}
                onChange={handleAvailabilityChange(renderProps.field)}
                disabled={isFormDisabled}
                aria-invalid={!!errors.availability}
                aria-describedby={errors.availability ? 'availability-error' : undefined}
            />
        ),
        [errors.availability, handleAvailabilityChange, isFormDisabled],
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

    const renderEngagementClosedBanner = (): JSX.Element | undefined => {
        if (!engagementClosed) {
            return undefined
        }

        return (
            <div className={styles.infoMessage} data-variant='error'>
                <IconOutline.ExclamationIcon className={styles.infoIcon} />
                <div>This engagement is no longer accepting applications.</div>
            </div>
        )
    }

    const renderDeadlinePassedBanner = (): JSX.Element | undefined => {
        if (engagementClosed || !deadlinePassed) {
            return undefined
        }

        return (
            <div className={styles.infoMessage} data-variant='warning'>
                <IconOutline.ClockIcon className={styles.infoIcon} />
                <div>The application deadline has passed.</div>
            </div>
        )
    }

    const renderAddressField = (): JSX.Element | undefined => {
        if (!userData?.address) {
            return undefined
        }

        return (
            <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor='applicant-address'>Address</label>
                <input
                    id='applicant-address'
                    type='text'
                    className={classNames(styles.inputField, styles.readOnlyField)}
                    value={userData.address}
                    readOnly
                    aria-readonly='true'
                />
            </div>
        )
    }

    const renderForm = (): JSX.Element => (
        <div className={styles.formContainer}>
            {renderEngagementClosedBanner()}
            {renderDeadlinePassedBanner()}

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Your Information</div>
                    <div className={styles.readOnlyGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor='applicant-name'>Name</label>
                            <input
                                id='applicant-name'
                                type='text'
                                className={classNames(styles.inputField, styles.readOnlyField)}
                                value={userData?.name ?? ''}
                                readOnly
                                aria-readonly='true'
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor='applicant-email'>Email</label>
                            <input
                                id='applicant-email'
                                type='email'
                                className={classNames(styles.inputField, styles.readOnlyField)}
                                value={userData?.email ?? ''}
                                readOnly
                                aria-readonly='true'
                            />
                        </div>
                        {renderAddressField()}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Application Details</div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='cover-letter'>Cover Letter</label>
                        <Controller
                            name='coverLetter'
                            control={control}
                            render={renderCoverLetterField}
                        />
                        <div className={styles.fieldMeta}>
                            <CharacterCounter
                                currentLength={coverLetterValue.length}
                                maxLength={5000}
                            />
                        </div>
                        {errors.coverLetter && (
                            <div className={styles.fieldError} id='cover-letter-error'>
                                {errors.coverLetter.message}
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='resume-url'>Resume URL</label>
                        <Controller
                            name='resumeUrl'
                            control={control}
                            render={renderResumeUrlField}
                        />
                        {errors.resumeUrl && (
                            <div className={styles.fieldError} id='resume-url-error'>
                                {errors.resumeUrl.message}
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='years-of-experience'>
                            Years of Experience
                        </label>
                        <Controller
                            name='yearsOfExperience'
                            control={control}
                            render={renderYearsOfExperienceField}
                        />
                        {errors.yearsOfExperience && (
                            <div className={styles.fieldError} id='years-of-experience-error'>
                                {errors.yearsOfExperience.message}
                            </div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor='availability'>Availability</label>
                        <Controller
                            name='availability'
                            control={control}
                            render={renderAvailabilityField}
                        />
                        <div className={styles.fieldMeta}>
                            <CharacterCounter
                                currentLength={availabilityValue.length}
                                maxLength={500}
                            />
                        </div>
                        {errors.availability && (
                            <div className={styles.fieldError} id='availability-error'>
                                {errors.availability.message}
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Portfolio</div>
                    <PortfolioUrlsField
                        control={control}
                        errors={errors}
                        disabled={isFormDisabled}
                    />
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
