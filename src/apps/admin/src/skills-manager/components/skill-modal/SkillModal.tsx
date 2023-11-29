import { find, pick } from 'lodash'
import { toast } from 'react-toastify'
import {
    ChangeEvent,
    FC,
    MutableRefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    BaseModal,
    Button,
    InputSelectOption,
    InputSelectReact,
    InputText,
    InputTextarea,
    LoadingSpinner,
} from '~/libs/ui'

import {
    archiveStandardizedSkill,
    saveStandardizedSkill,
    saveStandardizedSkillCategory,
    StandardizedSkill,
    StandardizedSkillCategory,
} from '../../services'
import { SkillsManagerContextValue, useSkillsManagerContext } from '../../context'

import styles from './SkillModal.module.scss'

interface SkillModalProps {
    skill: StandardizedSkill
}

const mapCategoryToSelectOption = (categories: StandardizedSkillCategory[]): InputSelectOption[] => (
    categories.map(c => ({ label: c.name, value: c.id }))
)

const SkillModal: FC<SkillModalProps> = props => {
    const {
        categories,
        refetchCategories,
        refetchSkills,
        setEditSkill,
        skillsList,
    }: SkillsManagerContextValue = useSkillsManagerContext()

    const formRef = useRef<HTMLFormElement>() as MutableRefObject<HTMLFormElement>
    const [isLoading, setIsLoading] = useState(false)
    const [formValue, setFormValue] = useState({} as Pick<StandardizedSkill, 'name'|'description'|'categoryId'>)
    const [formState, setFormState] = useState({
        categoryId: { dirty: false, error: undefined as string | undefined },
        description: { dirty: false, error: undefined as string | undefined },
        name: { dirty: false, error: undefined as string | undefined },
    })

    const action = props.skill?.id ? 'edit' : 'add'

    const categoryOptions = useMemo(() => mapCategoryToSelectOption(categories ?? []), [categories])

    function close(): void {
        setEditSkill()
    }

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

    const isFormValid = useMemo(() => (
        !Object.entries(formState)
            .find(([, value]) => !!value.error)
    ), [formState])

    async function handleNewCategory(categoryName: string): Promise<void> {
        setIsLoading(true)

        const newCategory = await saveStandardizedSkillCategory(
            { description: ' ', name: categoryName } as StandardizedSkillCategory,
        )

        refetchCategories()

        handleFormChanges({
            target: {
                form: formRef.current,
                name: 'categoryId',
                value: newCategory.id,
            },
        } as ChangeEvent<HTMLInputElement>)
        toast.success(`Category with name '${categoryName}' created!`)
        setIsLoading(false)
    }

    const saveAsync = useCallback(async (ev?: any): Promise<void> => {
        ev?.preventDefault?.()

        setIsLoading(true)

        return saveStandardizedSkill({
            categoryId: formValue.categoryId,
            description: formValue.description,
            id: props.skill.id as string,
            name: formValue.name,
        } as StandardizedSkill)
            .then(() => {
                refetchSkills()
                setEditSkill()
                toast.success(`${action === 'edit' ? 'Changes' : 'Skill'} saved!`)
            })
            .finally(() => setIsLoading(false))
    }, [
        action,
        formValue.categoryId,
        formValue.description,
        formValue.name,
        setEditSkill,
        refetchSkills,
        props.skill.id,
    ])

    const saveAndAddAnother = useCallback(async (): Promise<void> => {
        await saveAsync()
        setTimeout(setEditSkill, 100, {} as StandardizedSkill)
    }, [saveAsync, setEditSkill])

    const archiveSkill = useCallback(async (): Promise<void> => {
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
    }, [setEditSkill, props.skill, refetchSkills])

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
    }, [props.skill])

    useEffect(() => {
        validateForm()
    }, [formValue])

    return (
        <BaseModal
            onClose={close}
            open
            size='lg'
            title={`${action} Skill`}
        >
            <form className={styles.form} ref={formRef} onSubmit={saveAsync}>
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
                />
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
                />

                <div className={styles.buttonsWrap}>
                    {action === 'edit' && (
                        <Button
                            label='Archive skill'
                            size='lg'
                            secondary
                            variant='danger'
                            onClick={archiveSkill}
                        />
                    )}
                    <div className={styles.primaryGroup}>
                        <Button
                            label='Cancel'
                            size='lg'
                            primary
                            light
                            onClick={close}
                        />
                        {action === 'add' && (
                            <Button
                                label='Save and add another'
                                size='lg'
                                secondary
                                onClick={saveAndAddAnother}
                                disabled={!isFormValid}
                            />
                        )}
                        <Button
                            label='Save'
                            size='lg'
                            primary
                            onClick={saveAsync}
                            type='submit'
                            disabled={!isFormValid}
                        />
                    </div>
                </div>
            </form>
            <LoadingSpinner hide={!isLoading} overlay />
        </BaseModal>
    )
}

export default SkillModal
