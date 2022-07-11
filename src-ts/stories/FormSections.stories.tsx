// FormSections.stories.ts|tsx

import { ComponentStory } from '@storybook/react'

import { FormSection, NonStaticField } from '../lib'
import { renderInputField } from '../lib/form/form-elements/FormElements'
import { FormSectionModel } from '../lib/form/form-section.model'
import { BugHuntFormConfig } from '../tools/work/work-self-service/intake-forms/bug-hunt/bug-hunt.form.config'

export default {
    component: FormSection,
    title: 'Form Section',
}

const Template: ComponentStory<typeof FormSection> = (args) => <FormSection {...args} />

export const Primary: ComponentStory<typeof FormSection> = Template.bind({})

Primary.args = {
    renderFormInput: (field: NonStaticField, index: number) => renderInputField(field, index, BugHuntFormConfig, () => {}, () => {}),
    section: BugHuntFormConfig.elements[0] as FormSectionModel,
}
