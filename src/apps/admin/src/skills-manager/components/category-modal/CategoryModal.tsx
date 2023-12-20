import { FC, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Form, formGetInputModel, FormInputModel, FormValue, IconSolid, LoadingSpinner } from '~/libs/ui'

import {
    archiveStandardizedSkillCategory,
    saveStandardizedSkillCategory,
    StandardizedSkillCategory,
} from '../../services'

import { categoryFormDef, CategoryFormField, validateUniqueCategoryName } from './category-form.config'
import styles from './CategoryModal.module.scss'

interface CategoryModalProps {
    categories: StandardizedSkillCategory[]
    category: StandardizedSkillCategory
    onClose: () => void
    onSave: () => void
}

const CategoryModal: FC<CategoryModalProps> = props => {
    const action = props.category?.id ? 'edit' : 'add'

    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState<boolean>(false)

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => ({
        description: formGetInputModel(inputs, CategoryFormField.description).value as string,
        id: props.category.id as string,
        name: formGetInputModel(inputs, CategoryFormField.name).value as string,
    }), [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)

        return saveStandardizedSkillCategory(request as unknown as StandardizedSkillCategory)
            .then(() => {
                props.onSave.call(undefined)
                props.onClose.call(undefined)
                toast.success(`${action === 'edit' ? 'Changes' : 'Category'} saved!`)
            })
            .catch((e: any) => {
                setLoading(false)
                return Promise.reject(e)
            })
    }, [action, props.onClose, props.onSave])

    const archiveCategory = useCallback(async (): Promise<void> => {
        setLoading(true)

        return archiveStandardizedSkillCategory(props.category)
            .then(() => {
                props.onSave?.call(undefined)
                props.onClose?.call(undefined)
                toast.success(`Category ${props.category.name} archived successfully!`)
            })
            .catch((e: any) => {
                setError((e.message ?? '').replace(/with id [a-z0-9-]+/i, ''))
                setLoading(false)
                return Promise.reject(e)
            })
    }, [props.onClose, props.onSave, props.category])

    const formDef = useMemo(() => categoryFormDef(
        props.onClose,
        validateUniqueCategoryName(props.categories, props.category),
        action === 'edit' ? archiveCategory : undefined,
    ), [action, archiveCategory, props.categories, props.category, props.onClose])

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${action} Category`}
            bodyClassName={styles.modalBody}
        >
            <Form
                key='edit-category'
                formDef={formDef}
                formValues={props.category as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
                resetFormOnUnmount
            >
                {error && (
                    <div className={classNames(styles.error, 'input-error')}>
                        <IconSolid.ExclamationIcon />
                        {error}
                    </div>
                )}
            </Form>
            <LoadingSpinner hide={!loading} overlay />
        </BaseModal>
    )
}

export default CategoryModal
