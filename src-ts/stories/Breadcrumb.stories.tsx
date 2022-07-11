// Breadcrumb.stories.ts|tsx

import { ComponentStory } from '@storybook/react'
import { withRouter } from 'storybook-addon-react-router-v6'

import { Breadcrumb } from '..'

export default {
    component: Breadcrumb,
    decorators: [withRouter],
    title: 'Breadcrumb',
}

const Template: ComponentStory<typeof Breadcrumb> = (args) => (
    <>
        <Breadcrumb {...args} />
    </>
)

export const Primary: ComponentStory<typeof Breadcrumb> = Template.bind({})

Primary.args = {
    items: [
        {
            name: 'First Item',
            url: '/url',
        },
        {
            name: 'Second Item',
            url: '/url',
        },
    ],
}
