// Breadcrumb.stories.ts|tsx

import { ComponentStory } from '@storybook/react'

import { Avatar } from '../lib/avatar'

export default {
    component: Avatar,
    title: 'Avatar',
}

const Template: ComponentStory<typeof Avatar> = (args) => (<Avatar {...args} />)

export const Small: ComponentStory<typeof Avatar> = Template.bind({})

Small.args = {
  lastName: 'Name',
  size: 'sm',
}

export const ExtraLarge: ComponentStory<typeof Avatar> = Template.bind({})

ExtraLarge.args = {
  lastName: 'Name',
  size: 'xl',
}