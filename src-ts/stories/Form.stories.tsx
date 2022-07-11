// Form.stories.ts|tsx

import { ComponentStory } from '@storybook/react'

import { Form } from '../lib/form'
import { BugHuntFormConfig } from '../tools/work/work-self-service/intake-forms/bug-hunt/bug-hunt.form.config'

export default {
    component: Form,
    title: 'Form',
}

const Template: ComponentStory<typeof Form> = (args) => <Form {...args} />

export const Primary: ComponentStory<typeof Form> = Template.bind({})

Primary.args = {
    formDef: BugHuntFormConfig,
}

export const FormPrefilled: ComponentStory<typeof Form> = Template.bind({})

FormPrefilled.args = {
    formDef: BugHuntFormConfig,
    formValues: {
        description: 'Project description',
        features: 'The list of features',
        goals: 'Custom goals',
        profileTitle: 'Website bug hunt',
    },
}
