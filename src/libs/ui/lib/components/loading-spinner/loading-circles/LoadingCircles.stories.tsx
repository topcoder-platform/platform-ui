import { Meta, StoryObj } from '@storybook/react'

import { LoadingCircles } from '.'

const meta: Meta<typeof LoadingCircles> = {
    component: LoadingCircles,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Components/LoadingCircles',
}

export default meta

type Story = StoryObj<typeof LoadingCircles>;

export const Primary: Story = {
    args: {},
}
