import { ChangeEvent, FC, useEffect, useState } from 'react'
import { find } from 'lodash'

import { BaseModal, Button, InputRadio, LoadingSpinner } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../../context'
import { StandardizedSkill } from '../../../services'
import { SkillsList } from '../../skills-list'
import { SearchSkillInput } from '../search-skill-input'
import { SkillForm } from '../../skill-modals'

import styles from './ReplaceSkillsModal.module.scss'

interface ReplaceSkillsModalProps {
    allSkills: StandardizedSkill[]
    skills: StandardizedSkill[]
    onClose: (archived?: boolean) => void
}

const ReplaceSkillsModal: FC<ReplaceSkillsModalProps> = props => {
    const [isLoading, setIsLoading] = useState(false)
    const [type, setType] = useState<'existing'|'new'>('existing')
    const [replacingSkill, setReplacingSkill] = useState<StandardizedSkill>()

    const {
        bulkEditorCtx: context,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    async function replaceAll(): Promise<void> {
        setIsLoading(true)
        // TODO: call api to replace skills
        props.onClose(true)
        setIsLoading(false)
    }

    function close(): void {
        props.onClose()
    }

    function handleSkillSelect(event: ChangeEvent<HTMLInputElement>): void {
        setReplacingSkill(find(props.allSkills, { id: event.target.value }))
    }

    function handleNewForm(skillData: Partial<StandardizedSkill>, dataIsValid: boolean):void {
        setReplacingSkill(dataIsValid ? skillData as StandardizedSkill : undefined)
    }

    function toggleType(t: 'existing'|'new'): void {
        setReplacingSkill(undefined)
        setType(t)
    }

    useEffect(() => {
        if (!props.skills.length) {
            props.onClose.call(undefined)
        }
    }, [props.onClose, props.skills])

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Replace These Skills'
            bodyClassName={styles.modalBody}
            buttons={(
                <>
                    <Button primary light label='Cancel' onClick={close} size='lg' />
                    <Button
                        primary
                        label='Replace'
                        onClick={replaceAll}
                        size='lg'
                        disabled={!replacingSkill}
                    />
                </>
            )}
        >
            <SkillsList
                className={styles.skillsList}
                skills={props.skills}
                onSelect={context.toggleSkill}
                isSelected={context.isSkillSelected}
                editMode={!!context.isEditing}
            />

            <div className={styles.formInput}>
                <div className={styles.formInputLabel}>
                    <h2>With:</h2>
                    <InputRadio
                        label='Existing Skill'
                        name='replace-with'
                        id='replace-with-existing'
                        value='existing'
                        checked={type === 'existing'}
                        onChange={function t() { toggleType('existing') }}
                    />
                    <InputRadio
                        label='New Skill'
                        name='replace-with'
                        id='replace-with-new'
                        value='new'
                        checked={type === 'new'}
                        onChange={function t() { toggleType('new') }}
                    />
                </div>
                {type === 'existing' && (
                    <SearchSkillInput
                        skills={props.allSkills}
                        onChange={handleSkillSelect}
                    />
                )}
                {type === 'new' && (
                    <SkillForm
                        onChange={handleNewForm}
                        onLoading={setIsLoading as (l?: boolean) => void}
                        hideCancelBtn
                        hideSaveBtn
                    />
                )}
            </div>

            <LoadingSpinner hide={!isLoading} overlay />
        </BaseModal>
    )
}

export default ReplaceSkillsModal
