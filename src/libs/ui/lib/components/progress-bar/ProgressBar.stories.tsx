/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { Meta, StoryObj } from '@storybook/react'

import { ProgressBar } from '.'

const meta: Meta<typeof ProgressBar> = {
    argTypes: {
    },
    component: ProgressBar,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Components/ProgressBar',
}

export default meta

type Story = StoryObj<typeof ProgressBar>;

export const Primary: Story = {
    args: {
        progress: 0.5,
    },
}

export const Completed: Story = {
    args: {
        progress: 1,
    },
}
