import { toast } from 'react-toastify'
import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
    LoadingSpinner,
    useConfirmationModal,
} from '~/libs/ui'

import {
    archiveStandardizedSkill,
    restoreArchivedStandardizedSkill,
    saveStandardizedSkill,
    StandardizedSkill,
} from '../../services'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'
import { isSkillArchived } from '../../lib'

import SkillForm from './skill-form/SkillForm'

interface SkillModalProps {
    skill: StandardizedSkill
}

const SkillModal: FC<SkillModalProps> = props => {
    const {
        refetchSkills,
        setEditSkill,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const confirmModal = useConfirmationModal()

    const [isLoading, setIsLoading] = useState(false)
    const isArchived = useMemo(() => isSkillArchived(props.skill), [props.skill])

    const action = isArchived ? 'restore' : props.skill?.id ? 'edit' : 'add'

    function close(): void {
        setEditSkill()
    }

    const saveAsync = useCallback(async (skillData: Partial<StandardizedSkill>): Promise<void> => {
        setIsLoading(true)

        return saveStandardizedSkill({
            ...skillData,
            id: props.skill.id as string,
        } as StandardizedSkill)
            .then(() => {
                refetchSkills()
                setEditSkill()
                toast.success(`${action === 'edit' ? 'Changes' : 'Skill'} saved!`)
            })
            .finally(() => setIsLoading(false))
    }, [props.skill.id, refetchSkills, setEditSkill, action])

    const addAnother = useCallback(async (): Promise<void> => {
        setTimeout(setEditSkill, 750, {} as StandardizedSkill)
    }, [setEditSkill])

    const archiveSkill = useCallback(async (): Promise<void> => {
        const confirmed = await confirmModal.confirm({
            content: 'Are you sure you want to archive this skill?',
            title: 'Confirm Archive',
        })

        if (!confirmed) {
            return undefined
        }

        setIsLoading(true)
        return archiveStandardizedSkill(props.skill)
            .then(() => {
                refetchSkills()
                setEditSkill()
                toast.success(`Skill ${props.skill.name} archived successfully!`)
            })
            .catch((e: any) => {
                setIsLoading(false)
                return Promise.reject(e)
            })
    }, [confirmModal, props.skill, refetchSkills, setEditSkill])

    const restoreSkill = useCallback(async (): Promise<void> => {
        setIsLoading(true)

        // eslint-disable-next-line unicorn/no-null
        return restoreArchivedStandardizedSkill({ ...props.skill, deleted_at: null })
            .then(() => {
                refetchSkills()
                setEditSkill()
                toast.success(`Skill ${props.skill.name} restored successfully!`)
            })
            .catch((e: any) => {
                setIsLoading(false)
                return Promise.reject(e)
            })
    }, [setEditSkill, props.skill, refetchSkills])

    const renderSaveAndAddBtn = useCallback((isFormValid: boolean) => action === 'add' && (
        <Button
            label='Save and add another'
            size='lg'
            secondary
            type='submit'
            onClick={addAnother}
            disabled={!isFormValid}
        />
    ), [action, addAnother])

    return (
        <BaseModal
            onClose={close}
            open
            size='lg'
            title={`${action} Skill`}
        >
            <SkillForm
                skill={props.skill}
                onSave={saveAsync}
                onLoading={setIsLoading as (l?: boolean) => void}
                onCancel={close}
                isDisabled={isArchived}
                secondaryButtons={action !== 'add' && (
                    !isArchived ? (
                        <Button
                            label='Archive skill'
                            size='lg'
                            secondary
                            variant='danger'
                            onClick={archiveSkill}
                        />
                    ) : (
                        <Button
                            label='Restore skill'
                            size='lg'
                            secondary
                            onClick={restoreSkill}
                        />
                    )
                )}
                primaryButtons={renderSaveAndAddBtn}
            />
            <LoadingSpinner hide={!isLoading} overlay />
            {confirmModal.modal}
        </BaseModal>
    )
}

export default SkillModal
