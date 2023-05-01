/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */

import { Meta, StoryObj } from '@storybook/react'

import '../../styles/index.scss'

import { TabsNavbar, TabsNavItem } from '.'

const meta: Meta<typeof TabsNavbar> = {
    argTypes: {
        onChange: { action: 'tab changed' },
    },
    component: TabsNavbar,
    excludeStories: /.*Decorator$/,
    tags: ['autodocs'],
    title: 'Components/TabsNavbar',
}

export default meta

type Story = StoryObj<typeof TabsNavbar>;

const PrimarySbTabs: TabsNavItem[] = [
    {
        id: '0',
        title: 'First',
    },
    {
        id: '1',
        title: 'Second',
    },
    {
        id: '2',
        title: 'Third',
    },
]

export const Primary: Story = {
    args: {
        defaultActive: '0',
        tabs: PrimarySbTabs,
    },
}

const WithBadgesSbTabs: TabsNavItem[] = [
    {
        badges: [{ count: 0, type: 'info' }],
        id: '0',
        title: 'First',
    },
    {
        badges: [{ count: 1, type: 'important' }],
        id: '1',
        title: 'Second',
    },
    {
        badges: [{ count: 2, type: 'info' }, { count: 1, type: 'important' }],
        id: '2',
        title: 'Third',
    },
]

export const WithBadges: Story = {
    args: {
        defaultActive: '0',
        tabs: WithBadgesSbTabs,
    },
}

const WithUrlsSbTabs: TabsNavItem[] = [
    {
        badges: [{ count: 0, type: 'info' }],
        id: '0',
        title: 'Prod',
        url: 'https://topcoder.com',
    },
    {
        badges: [{ count: 1, type: 'important' }],
        id: '1',
        title: 'Dev',
        url: 'https://topcoder-dev.com',
    },
]

export const WithUrls: Story = {
    args: {
        defaultActive: '0',
        tabs: WithUrlsSbTabs,
    },
}
