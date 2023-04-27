/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */

import { Meta, StoryObj } from '@storybook/react'

import { IconOutline } from '../svgs'

import Tooltip from './Tooltip'

const meta: Meta<typeof Tooltip> = {
    argTypes: {
        children: {
            description: 'The element that will trigger the tooltip',
            table: { disable: true },
        },
        clickable: {
            defaultValue: false,
            description: 'Set to true to allow clicks inside the tooltip',
        },
        content: {
            description: 'Content displayed inside the tooltip',
        },
        disableWrap: {
            defaultValue: false,
            description: 'Do not add any wrapper arround the children/triggerer',
        },
        strategy: {
            defaultValue: 'absolute',
            description: [
                'The position strategy used for the tooltip.',
                'Set to `fixed` if you run into issues with `overflow: hidden`',
                'on the tooltip parent container',
            ].join(' '),
        },
    },
    component: Tooltip,
    excludeStories: /.*Decorator$/,
    tags: ['autodocs'],
    title: 'Components/Tooltip',
}

export default meta

type Story = StoryObj<typeof Tooltip>;

export const Primary: Story = {
    args: {
        children: <IconOutline.QuestionMarkCircleIcon width='35' />,
        content: 'Help tooltip',
        disableWrap: true,
        strategy: 'fixed',
    },
}
