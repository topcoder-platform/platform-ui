import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'

import { AUTOSAVE_DELAY_MS } from '../../../../lib/constants/challenge-editor.constants'
import {
    useAutosave,
    useFetchChallengeTypes,
} from '../../../../lib/hooks'
import {
    Challenge,
    ChallengeEditorFormData,
    ChallengeType,
} from '../../../../lib/models'
import {
    challengeEditorSchema,
} from '../../../../lib/schemas/challenge-editor.schema'
import {
    createChallenge,
    patchChallenge,
} from '../../../../lib/services'
import {
    formatLastSaved,
    showErrorToast,
    showSuccessToast,
    transformChallengeToFormData,
    transformFormDataToChallenge,
} from '../../../../lib/utils'

import {
    AssignedMemberField,
} from './AssignedMemberField'
import {
    AttachmentsField,
} from './AttachmentsField'
import {
    ChallengeDescriptionField,
} from './ChallengeDescriptionField'
import {
    ChallengeScheduleSection,
} from './ChallengeScheduleSection'
import {
    BillingAccountField,
} from './BillingAccountField'
import {
    ChallengeFeeField,
} from './ChallengeFeeField'
import {
    ChallengeNameField,
} from './ChallengeNameField'
import {
    ChallengePrivateDescriptionField,
} from './ChallengePrivateDescriptionField'
import {
    ChallengePrizesField,
} from './ChallengePrizesField'
import {
    ChallengeSkillsField,
} from './ChallengeSkillsField'
import {
    ChallengeTagsField,
} from './ChallengeTagsField'
import {
    ChallengeTotalField,
} from './ChallengeTotalField'
import {
    ChallengeTrackField,
} from './ChallengeTrackField'
import {
    ChallengeTypeField,
} from './ChallengeTypeField'
import {
    CheckpointPrizesField,
} from './CheckpointPrizesField'
import {
    CopilotField,
} from './CopilotField'
import {
    CopilotFeeField,
} from './CopilotFeeField'
import {
    DiscussionForumField,
} from './DiscussionForumField'
import {
    GroupsField,
} from './GroupsField'
import {
    MaximumSubmissionsField,
} from './MaximumSubmissionsField'
import {
    NDAField,
} from './NDAField'
import {
    ReviewCostField,
} from './ReviewCostField'
import {
    ReviewersField,
} from './ReviewersField'
import {
    ReviewTypeField,
} from './ReviewTypeField'
import {
    RoundTypeField,
} from './RoundTypeField'
import {
    StockArtsField,
} from './StockArtsField'
import {
    SubmissionVisibilityField,
} from './SubmissionVisibilityField'
import {
    TermsField,
} from './TermsField'
import styles from './ChallengeEditorForm.module.scss'

interface ChallengeEditorFormProps {
    challenge?: Challenge
}

interface SaveChallengeOptions {
    isAutosave?: boolean
    navigateAfterCreate?: boolean
}

function getStatusText(
    saveStatus: 'error' | 'idle' | 'saved' | 'saving',
): string {
    if (saveStatus === 'saving') {
        return 'Saving...'
    }

    if (saveStatus === 'saved') {
        return 'Saved'
    }

    if (saveStatus === 'error') {
        return 'Save failed'
    }

    return ''
}

export const ChallengeEditorForm: FC<ChallengeEditorFormProps> = (
    props: ChallengeEditorFormProps,
) => {
    const navigate = useNavigate()

    const [currentChallengeId, setCurrentChallengeId] = useState<string | undefined>(props.challenge?.id)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [lastSaved, setLastSaved] = useState<Date | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'saved' | 'saving'>('idle')

    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: transformChallengeToFormData(props.challenge),
        mode: 'onChange',
        resolver: yupResolver(challengeEditorSchema) as any,
    })

    const formState = formMethods.formState
    const handleSubmit = formMethods.handleSubmit
    const reset = formMethods.reset
    const watch = formMethods.watch
    const values = watch()
    const challengeTypes = useFetchChallengeTypes().challengeTypes

    const selectedChallengeType = useMemo<ChallengeType | undefined>(
        () => challengeTypes.find(challengeType => challengeType.id === values.typeId),
        [
            challengeTypes,
            values.typeId,
        ],
    )

    useEffect(() => {
        setCurrentChallengeId(props.challenge?.id)
        reset(transformChallengeToFormData(props.challenge))
    }, [props.challenge, reset])

    const saveChallenge = useCallback(
        async (
            formData: ChallengeEditorFormData,
            options: SaveChallengeOptions = {},
        ): Promise<void> => {
            if (!options.isAutosave) {
                setIsSaving(true)
                setSaveStatus('saving')
            }

            setSaveError(undefined)

            try {
                const payload = transformFormDataToChallenge(formData)
                let savedChallenge: Challenge

                if (currentChallengeId) {
                    savedChallenge = await patchChallenge(currentChallengeId, payload)
                } else {
                    savedChallenge = await createChallenge(payload)
                }

                const nextValues = transformChallengeToFormData(savedChallenge)
                const savedAt = new Date()

                setCurrentChallengeId(savedChallenge.id)
                setLastSaved(savedAt)
                setSaveStatus('saved')

                reset(nextValues)

                if (!options.isAutosave) {
                    if (!formData.id) {
                        showSuccessToast('Challenge created successfully')
                    } else {
                        showSuccessToast('Challenge saved successfully')
                    }
                }

                if (options.navigateAfterCreate && !formData.id) {
                    navigate('/challenges')
                }
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to save challenge'

                setSaveError(errorMessage)
                setSaveStatus('error')

                if (!options.isAutosave) {
                    showErrorToast('Failed to save challenge')
                }

                throw error
            } finally {
                if (!options.isAutosave) {
                    setIsSaving(false)
                }
            }
        },
        [currentChallengeId, navigate, reset],
    )

    const autosaveResult = useAutosave<ChallengeEditorFormData>({
        delay: AUTOSAVE_DELAY_MS,
        enabled: formState.isDirty && formState.isValid,
        formValues: values,
        onSave: async formData => {
            await saveChallenge(formData, {
                isAutosave: true,
            })
        },
    })

    useEffect(() => {
        if (autosaveResult.saveStatus === 'idle') {
            return
        }

        setSaveStatus(autosaveResult.saveStatus)

        if (autosaveResult.lastSaved) {
            setLastSaved(autosaveResult.lastSaved)
        }
    }, [autosaveResult.lastSaved, autosaveResult.saveStatus])

    const onSubmit = useCallback(
        async (formData: ChallengeEditorFormData): Promise<void> => {
            await saveChallenge(formData, {
                navigateAfterCreate: true,
            })
        },
        [saveChallenge],
    )

    const statusText = useMemo(
        () => getStatusText(isSaving ? 'saving' : saveStatus),
        [isSaving, saveStatus],
    )

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <input type='hidden' {...formMethods.register('id')} />

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Basic Information</h3>
                    <div className={styles.grid}>
                        <ChallengeNameField />
                        <ChallengeTrackField disabled={!!props.challenge?.id} />
                        <ChallengeTypeField disabled={!!props.challenge?.id} />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Specification</h3>
                    <div className={styles.block}>
                        <ChallengeDescriptionField />
                        <ChallengePrivateDescriptionField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Metadata</h3>
                    <div className={styles.grid}>
                        <ChallengeTagsField />
                        <ChallengeSkillsField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Prizes &amp; Billing</h3>
                    <div className={styles.grid}>
                        <BillingAccountField
                            name='billing.billingAccountId'
                            required
                        />
                        <ChallengePrizesField
                            challengeTypeAbbreviation={selectedChallengeType?.abbreviation}
                            challengeTypeName={selectedChallengeType?.name}
                            name='prizeSets'
                        />
                        <CheckpointPrizesField name='prizeSets' />
                        <CopilotFeeField name='prizeSets' />
                        <ReviewCostField name='prizeSets' />
                        <ChallengeFeeField challengeFee={values.challengeFee} />
                        <ChallengeTotalField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Timeline &amp; Schedule</h3>
                    <div className={styles.block}>
                        <ChallengeScheduleSection />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Advanced Options</h3>
                    <div className={styles.grid}>
                        <AssignedMemberField />
                        <CopilotField />
                        <GroupsField />
                        <TermsField />
                        <DiscussionForumField />
                        <NDAField />
                        <ReviewTypeField />
                        <RoundTypeField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Submission Settings</h3>
                    <div className={styles.grid}>
                        <SubmissionVisibilityField />
                        <StockArtsField />
                        <MaximumSubmissionsField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Reviewers</h3>
                    <div className={styles.block}>
                        <ReviewersField />
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Attachments</h3>
                    <div className={styles.block}>
                        <AttachmentsField />
                    </div>
                </section>

                <div className={styles.footer}>
                    <div className={styles.statusArea}>
                        {statusText
                            ? <span className={styles.statusText}>{statusText}</span>
                            : undefined}
                        <span className={styles.lastSaved}>{formatLastSaved(lastSaved)}</span>
                        {saveError
                            ? <span className={styles.errorText}>{saveError}</span>
                            : undefined}
                    </div>

                    <div className={styles.actions}>
                        <Link className={styles.cancelLink} to='/challenges'>
                            Cancel
                        </Link>
                        <Button
                            disabled={!formState.isValid || isSaving}
                            label='Save challenge'
                            primary
                            size='lg'
                            type='submit'
                        />
                    </div>
                </div>
            </form>
        </FormProvider>
    )
}

export default ChallengeEditorForm
