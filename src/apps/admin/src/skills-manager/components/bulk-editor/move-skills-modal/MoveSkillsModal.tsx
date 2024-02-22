import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react'
import { noop } from 'lodash'
import { toast } from 'react-toastify'

import { BaseModal, Button, InputSelectReact, LoadingSpinner } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../../context'
import {
    bulkUpdateStandardizedSkills,
    saveStandardizedSkillCategory,
    StandardizedSkill,
    StandardizedSkillCategory,
} from '../../../services'
import { mapCategoryToSelectOption } from '../../../lib'
import { SkillsList } from '../../skills-list'

import styles from './MoveSkillsModal.module.scss'

interface MoveSkillsModalProps {
    skills: StandardizedSkill[]
    onClose: (archived?: boolean) => void
}

const MoveSkillsModal: FC<MoveSkillsModalProps> = props => {
    const [isLoading, setIsLoading] = useState(false)
    const [categoryId, setCategoryId] = useState<string>()

    const {
        bulkEditorCtx: context,
        refetchCategories,
        categories,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const currentCategoryOptions = useMemo(() => (
        mapCategoryToSelectOption([props.skills[0]?.category].filter(Boolean))
    ), [props.skills])

    const categoryOptions = useMemo(() => mapCategoryToSelectOption(categories), [categories])

    function handleCategoryChange(ev: ChangeEvent<HTMLInputElement>): void {
        setCategoryId(ev.target.value)
    }

    async function moveAll(): Promise<void> {
        setIsLoading(true)
        await bulkUpdateStandardizedSkills(props.skills, { categoryId })
        props.onClose(true)
        setIsLoading(false)
    }

    function close(): void {
        props.onClose()
    }

    async function handleNewCategory(categoryName: string): Promise<void> {
        setIsLoading(true)

        const newCategory = await saveStandardizedSkillCategory(
            { description: ' ', name: categoryName } as StandardizedSkillCategory,
        )

        refetchCategories()

        setCategoryId(newCategory.id)
        toast.success(`Category with name '${categoryName}' created!`)
        setIsLoading(false)
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
            title='Move These Skills'
            bodyClassName={styles.modalBody}
            buttons={(
                <>
                    <Button primary light label='Cancel' onClick={close} size='lg' />
                    <Button
                        primary
                        label='Move'
                        onClick={moveAll}
                        size='lg'
                        disabled={!categoryId || categoryId === currentCategoryOptions[0]?.value}
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
                    <h2>From:</h2>
                </div>
                <InputSelectReact
                    label='Skill Category'
                    options={currentCategoryOptions}
                    value={currentCategoryOptions[0]?.value}
                    name='from'
                    onChange={noop}
                    disabled
                />
            </div>
            <div className={styles.formInput}>
                <div className={styles.formInputLabel}>
                    <h2>To:</h2>
                </div>
                <InputSelectReact
                    creatable
                    label='Skill Category'
                    placeholder='Select category'
                    options={categoryOptions}
                    name='categoryTo'
                    onChange={handleCategoryChange}
                    createLabel={function label(v: string) { return `Create new category "${v}"` }}
                    onCreateOption={handleNewCategory}
                    value={categoryId}
                    tabIndex={0}
                />
            </div>

            <LoadingSpinner hide={!isLoading} overlay />
        </BaseModal>
    )
}

export default MoveSkillsModal
