import { Decorator, Meta, StoryObj } from '@storybook/react'

import { LoadingSpinner } from '.'

const meta: Meta<typeof LoadingSpinner> = {
    component: LoadingSpinner,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Components/LoadingSpinner',
}

export default meta

type Story = StoryObj<typeof LoadingSpinner>;

const baseDecorator: Decorator = Story => (
    <div>
        <Story />
        <h3>Page title</h3>
        <p>Main page content</p>
    </div>
)

export const Normal: Story = {
    args: {},
    decorators: [baseDecorator],
}

export const Overlay: Story = {
    args: {
        overlay: true,
    },
    decorators: [baseDecorator],
}
