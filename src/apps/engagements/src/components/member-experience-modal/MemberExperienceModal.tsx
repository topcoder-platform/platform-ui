import { FC, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { BaseModal, Button } from '~/libs/ui'

import type {
    CreateMemberExperienceRequest,
    Engagement,
    MemberExperience,
    UpdateMemberExperienceRequest,
} from '../../lib/models'
import {
    createMemberExperience,
    getMemberExperiences,
    updateMemberExperience,
} from '../../lib/services'
import { MemberExperienceForm } from '../member-experience-form'
import { MemberExperienceList } from '../member-experience-list'

import styles from './MemberExperienceModal.module.scss'

interface MemberExperienceModalProps {
    open: boolean
    onClose: () => void
    engagement: Engagement
    assignmentId: string
}

const MemberExperienceModal: FC<MemberExperienceModalProps> = (
    props: MemberExperienceModalProps,
) => {
    const open = props.open
    const onClose = props.onClose
    const engagement = props.engagement
    const assignmentId = props.assignmentId

    const [experiences, setExperiences] = useState<MemberExperience[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [saving, setSaving] = useState<boolean>(false)
    const [editingExperience, setEditingExperience] = useState<MemberExperience | undefined>(undefined)
    const [showForm, setShowForm] = useState<boolean>(false)

    const formKey = editingExperience?.id ?? 'new'
    const engagementId = engagement.id
    const hasAssignments = !engagement.assignments || engagement.assignments.length > 0
    const canDocumentExperience = Boolean(assignmentId) && hasAssignments

    const fetchExperiences = useCallback(async (): Promise<void> => {
        if (!engagementId || !assignmentId) {
            setExperiences([])
            setError('Assignment details are unavailable for this engagement.')
            setLoading(false)
            return
        }

        if (engagement.assignments && engagement.assignments.length === 0) {
            setExperiences([])
            setError('This engagement does not have any assignments yet.')
            setLoading(false)
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await getMemberExperiences(engagementId, assignmentId)
            setExperiences(response)
        } catch (err) {
            setError('Unable to load member experiences. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [assignmentId, engagement.assignments, engagementId])

    useEffect(() => {
        if (!open) {
            return
        }

        fetchExperiences()
    }, [fetchExperiences, open])

    useEffect(() => {
        if (open) {
            return
        }

        setShowForm(false)
        setEditingExperience(undefined)
        setSaving(false)
    }, [open])

    const handleRetry = useCallback(() => {
        fetchExperiences()
    }, [fetchExperiences])

    const handleAddExperience = useCallback(() => {
        setEditingExperience(undefined)
        setShowForm(true)
    }, [])

    const handleEditExperience = useCallback((experience: MemberExperience) => {
        setEditingExperience(experience)
        setShowForm(true)
    }, [])

    const handleCancelForm = useCallback(() => {
        setShowForm(false)
        setEditingExperience(undefined)
    }, [])

    const handleSubmit = useCallback(async (
        data: CreateMemberExperienceRequest | UpdateMemberExperienceRequest,
    ): Promise<void> => {
        if (saving) {
            return
        }

        if (!engagementId || !assignmentId) {
            const message = 'Assignment details are unavailable for this engagement.'
            toast.error(message)
            throw new Error(message)
        }

        setSaving(true)

        try {
            if (editingExperience?.id) {
                await updateMemberExperience(
                    engagementId,
                    assignmentId,
                    editingExperience.id,
                    data,
                )
                toast.success('Experience updated successfully')
            } else {
                await createMemberExperience(engagementId, assignmentId, data)
                toast.success('Experience documented successfully')
            }

            await fetchExperiences()
            setShowForm(false)
            setEditingExperience(undefined)
        } catch (err: any) {
            const message = err?.response?.data?.message
                || err?.message
                || 'Unable to save experience. Please try again.'
            toast.error(message)
            throw new Error(message)
        } finally {
            setSaving(false)
        }
    }, [assignmentId, editingExperience?.id, engagementId, fetchExperiences, saving])

    return (
        <BaseModal
            open={open}
            onClose={onClose}
            title='Document Your Experience'
            size='lg'
            bodyClassName={styles.modalBody}
            buttons={(
                <Button
                    label='Close'
                    onClick={onClose}
                    secondary
                />
            )}
        >
            <div className={styles.contentPanel}>
                {showForm ? (
                    <MemberExperienceForm
                        key={formKey}
                        engagementId={engagementId}
                        assignmentId={assignmentId}
                        experienceId={editingExperience?.id}
                        initialValue={editingExperience?.experienceText}
                        onSubmit={handleSubmit}
                        onCancel={handleCancelForm}
                        disabled={saving}
                    />
                ) : (
                    <>
                        <div className={styles.actionsRow}>
                            <Button
                                label='Add New Experience'
                                onClick={handleAddExperience}
                                primary
                                className={styles.addButton}
                                disabled={!canDocumentExperience || loading || saving}
                            />
                        </div>
                        <MemberExperienceList
                            experiences={experiences}
                            loading={loading}
                            error={error}
                            onRetry={handleRetry}
                            onEdit={handleEditExperience}
                            canEdit
                        />
                    </>
                )}
            </div>
        </BaseModal>
    )
}

export default MemberExperienceModal
