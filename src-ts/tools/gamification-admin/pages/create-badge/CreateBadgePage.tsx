import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout, FormDefinition, formOnReset, formGetInputFields } from '../../../../lib'
import { baseUrl } from '../../gamification-admin.routes'
import { toolTitle } from '../../GamificationAdmin'
import { CreateBadgeForm, createBadgeFormDef } from './create-badge-form'

import styles from './CreateBadgePage.module.scss'

const CreateBadgePage: FC = () => {
  const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
    { name: toolTitle, url: baseUrl },
    { name: 'create badge', url: '#' },
  ], [])

  const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...createBadgeFormDef })

    function onSave(): void {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(formGetInputFields(updatedForm.groups || []))
        setFormDef(updatedForm)
    }

  return (
    <ContentLayout
      title='Create Badge'
    >
      <Breadcrumb items={breadcrumb} />
      <div className={styles.container}>
        <CreateBadgeForm
          formDef={createBadgeFormDef}
          onSave={onSave}
        />
      </div>
    </ContentLayout>
  )
}

export default CreateBadgePage
