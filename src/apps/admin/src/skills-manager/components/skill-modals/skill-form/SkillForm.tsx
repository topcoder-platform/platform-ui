import { ChangeEvent, FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { find, pick } from 'lodash'
import { toast } from 'react-toastify'

import { Button, FormInputAutocompleteOption, InputSelectReact, InputText, InputTextarea } from '~/libs/ui'

import { SkillsManagerContextValue, useSkillsManagerContext } from '../../../context'
import { mapCategoryToSelectOption } from '../../../lib'
import {
    saveStandardizedSkillCategory,
    StandardizedSkill,
    StandardizedSkillCategory,
} from '../../../services'
import { SimilarSkillsDropdown } from '../similar-skills-dropdown'

import styles from './SkillForm.module.scss'

interface SkillFormProps {
    isDisabled?: boolean
    skill: StandardizedSkill
    onSave: (skillData: Partial<StandardizedSkill>) => void
    onCancel: () => void
    onLoading: (loading?: boolean) => void

    secondaryButtons?: ReactNode
    primaryButtons?: (isFormValid: boolean) => ReactNode
}

const SkillForm: FC<SkillFormProps> = props => {
    const {
        categories,
        refetchCategories,
        skillsList,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const [forceUpdate, setForceUpdate] = useState(false)
    const [formValue, setFormValue] = useState({} as Pick<StandardizedSkill, 'name'|'description'|'categoryId'>)
    const [formState, setFormState] = useState({
        categoryId: { dirty: false, error: undefined as string | undefined },
        description: { dirty: false, error: undefined as string | undefined },
        name: { dirty: false, error: undefined as string | undefined },
    })

    const categoryOptions = useMemo(() => mapCategoryToSelectOption(categories ?? []), [categories])

    const isLoading = useCallback((loading?: boolean): void => {
        props.onLoading.call(undefined, loading)
    }, [props.onLoading])

    function handleFormChanges(ev: ChangeEvent<HTMLInputElement>): void {
        setFormValue(prevValue => ({
            ...prevValue,
            [ev.target.name]: ev.target.value,
        }))

        setFormState(prev => ({
            ...prev,
            [ev.target.name]: { dirty: true, error: undefined },
        }))
    }

    function validateName(): void {
        const name = formValue.name?.trim() ?? ''
        const isValid = name.length > 0
        const similarSkill = find(skillsList, { name })
        const isDuplicate = similarSkill && similarSkill.id !== props.skill.id
        const error = !isValid ? 'Skill name is required!' : (
            isDuplicate ? 'A skill with the same name already exists!' : undefined
        )

        setFormState(prev => ({
            ...prev,
            name: { ...prev.name, error },
        }))
    }

    function validateDescription(): void {
        const description = formValue.description?.trim() ?? ''
        const isValid = description.length > 0
        const error = !isValid ? 'Skill description is required!' : undefined

        setFormState(prev => ({
            ...prev,
            description: { ...prev.description, error },
        }))
    }

    function validateCategory(): void {
        const categoryId = formValue.categoryId?.trim() ?? ''
        const isValid = categoryId.length > 0
        const error = !isValid ? 'Skill category is required!' : undefined

        setFormState(prev => ({
            ...prev,
            categoryId: { ...prev.categoryId, error },
        }))
    }

    function validateForm(): void {
        validateName()
        validateDescription()
        validateCategory()
    }

    function handleFormSubmit(ev?: any): void {
        ev?.preventDefault?.()
        props.onSave(formValue)
    }

    const isFormValid = useMemo(() => (
        !Object.entries(formState)
            .find(([, value]) => !!value.error)
    ), [formState])

    async function handleNewCategory(categoryName: string): Promise<void> {
        isLoading(true)

        const newCategory = await saveStandardizedSkillCategory(
            { description: ' ', name: categoryName } as StandardizedSkillCategory,
        )

        refetchCategories()

        handleFormChanges({
            target: {
                name: 'categoryId',
                value: newCategory.id,
            },
        } as ChangeEvent<HTMLInputElement>)
        toast.success(`Category with name '${categoryName}' created!`)
        isLoading(false)
    }

    useEffect(() => {
        // when skill object changes, persist the new props into formValue state
        setFormValue({
            categoryId: props.skill.category?.id,
            ...pick(props.skill, ['name', 'description', 'categoryId']),
        })

        setFormState({
            categoryId: { dirty: false, error: props.skill.category?.id ? undefined : 'required' },
            description: { dirty: false, error: props.skill.description ? undefined : 'required' },
            name: { dirty: false, error: props.skill.name ? undefined : 'required' },
        })

        setForceUpdate(true)
    }, [props.skill])

    useEffect(() => {
        validateForm()
    }, [formValue])

    useEffect(() => {
        if (forceUpdate) {
            setForceUpdate(false)
        }
    }, [forceUpdate])

    return (
        <form className={styles.form} onSubmit={handleFormSubmit}>
            <SimilarSkillsDropdown
                categories={categories}
                skillName={formValue.name}
                skills={skillsList}
                isInputDirty={formState.name.dirty}
            >
                <InputText
                    dirty={formState.name.dirty}
                    label='Skill Name'
                    name='name'
                    placeholder='Enter skill name'
                    type='text'
                    value={formValue.name}
                    onChange={handleFormChanges}
                    autoFocus
                    onBlur={validateName}
                    error={formState.name.error}
                    tabIndex={0}
                    disabled={props.isDisabled}
                    forceUpdateValue={forceUpdate}
                    autocomplete={FormInputAutocompleteOption.off}
                />
            </SimilarSkillsDropdown>
            <InputTextarea
                dirty={formState.description.dirty}
                label='Skill Description'
                name='description'
                placeholder='Enter skill description'
                value={formValue.description as string}
                onChange={handleFormChanges as any}
                onBlur={validateDescription as any}
                error={formState.description.error}
                tabIndex={0}
                disabled={props.isDisabled}
            />
            <InputSelectReact
                dirty={formState.categoryId.dirty}
                creatable
                label='Skill Category'
                placeholder='Select category'
                options={categoryOptions}
                name='categoryId'
                onChange={handleFormChanges}
                createLabel={function label(v: string) { return `Create new category "${v}"` }}
                onCreateOption={handleNewCategory}
                value={formValue.categoryId}
                onBlur={validateCategory}
                error={formState.categoryId.error}
                tabIndex={0}
                disabled={props.isDisabled}
            />

            <div className={styles.buttonsWrap}>
                {props.secondaryButtons}
                <div className={styles.primaryGroup}>
                    <Button
                        label='Cancel'
                        size='lg'
                        primary
                        light
                        onClick={props.onCancel}
                    />
                    {props.primaryButtons?.(isFormValid)}
                    <Button
                        label='Save'
                        size='lg'
                        primary
                        type='submit'
                        disabled={!isFormValid || props.isDisabled}
                    />
                </div>
            </div>
        </form>
    )
}

export default SkillForm
