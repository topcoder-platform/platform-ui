/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import { Meta, StoryObj } from '@storybook/react'

import { InputMultiselect } from '.'

const meta: Meta<typeof InputMultiselect> = {
    argTypes: {
    },
    component: InputMultiselect,
    excludeStories: /.*Decorator$/,
    // tags: ['autodocs'],
    title: 'Forms/InputMultiselect',
}

export default meta

type Story = StoryObj<typeof InputMultiselect>;

export const Basic: Story = {
    args: {
        onChange: () => undefined,
        onFetchOptions: d => Promise.resolve(d ? [
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' },
            { label: 'Option 3', value: '3' },
            { label: 'Option 4', value: '4' },
            { label: 'Option 5', value: '5' },
            { label: 'Option 6', value: '6' },
            { label: 'Option 7', value: '7' },
            { label: 'Option 8', value: '8' },
            { label: 'Option 9', value: '9' },
            { label: 'Option 10', value: '10' },
            { label: 'Option 11', value: '11' },
            { label: 'Option 12', value: '12' },
            { label: 'Option 13', value: '13' },
            { label: 'Option 14', value: '14' },
            { label: 'Option 15', value: '15' },
            { label: 'Option 16', value: '16' },
            { label: 'Option 17', value: '17' },
            { label: 'Option 18', value: '18' },
            { label: 'Option 19', value: '19' },
        ] : []),
    },
}
