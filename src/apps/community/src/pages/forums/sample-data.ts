/* eslint-disable sort-keys */
import {
    ForumAuthor,
    ForumChallenge,
    ForumPost,
    ForumTopic,
} from './types'

export const forumAuthors: Record<string, ForumAuthor> = {
    admin: {
        avatarTone: 'red',
        handle: 'tcadmin',
        role: 'Administrator',
    },
    copilot: {
        avatarTone: 'gold',
        handle: 'fajar.mln',
        role: 'Copilot',
    },
    kharm: {
        avatarTone: 'blue',
        handle: 'kharm',
        role: 'Author',
    },
    tourist: {
        avatarTone: 'orange',
        handle: 'tourist',
        role: 'Member',
    },
    yuki: {
        avatarTone: 'green',
        handle: 'yuki.dev',
        role: 'Member',
    },
}

export const sampleForumChallenge: ForumChallenge = {
    name: 'React Component Library Development Challenge',
    tags: ['Challenge', 'React'],
    prizes: [
        {
            amount: '$1,000',
            label: '1st',
            tone: 'gold',
        },
        {
            amount: '$500',
            label: '2nd',
            tone: 'silver',
        },
        {
            amount: '$200',
            label: '3rd',
            tone: 'bronze',
        },
        {
            amount: '$100',
            label: '4th',
            tone: 'turquoise',
        },
        {
            amount: '$50',
            label: '5th',
            tone: 'turquoise',
        },
    ],
    registrantCount: 38,
    submissionCount: 19,
    nextDeadline: 'Submission',
    currentDeadline: '3d 8h',
}

export const sampleForumTopics: ForumTopic[] = [
    {
        id: 'welcome',
        title: 'Welcome to React Component Library Development Challenge',
        kind: 'announcement',
        body: [
            'Important guidelines and requirements for the challenge.',
            'Please read carefully before starting development.',
        ].join(' '),
        author: forumAuthors.copilot,
        createdAt: '20 Aug 2025, 08:08 AM',
        lastPostAt: '3 Sept 2025, 10:58 AM',
        postCount: 1,
        viewCount: 0,
    },
    {
        id: 'typescript-interface-definitions',
        title: 'TypeScript Interface Definitions - Need Clarification',
        kind: 'discussion',
        body: 'Questions about prop validation, variant typing, and reusable component interface patterns.',
        author: forumAuthors.kharm,
        createdAt: '20 Aug 2025, 08:08 AM',
        lastPostAt: '3 Sept 2025, 10:58 AM',
        postCount: 3,
        unread: true,
        viewCount: 3,
    },
    {
        id: 'storybook-coverage',
        title: 'Storybook Coverage Expectations',
        kind: 'discussion',
        body: 'Should every component variant include a separate story, or can grouped controls cover variant states?',
        author: forumAuthors.yuki,
        createdAt: '21 Aug 2025, 02:15 PM',
        lastPostAt: '2 Sept 2025, 09:12 PM',
        postCount: 5,
        viewCount: 18,
    },
    {
        id: 'accessibility-testing',
        title: 'Accessibility testing scope for interactive components',
        kind: 'discussion',
        body: 'Looking for guidance on keyboard focus, ARIA naming, and contrast requirements for the library.',
        author: forumAuthors.tourist,
        createdAt: '22 Aug 2025, 11:43 AM',
        lastPostAt: '1 Sept 2025, 04:35 PM',
        postCount: 4,
        viewCount: 12,
    },
]

export const sampleForumPosts: ForumPost[] = [
    {
        id: 'post-1',
        author: forumAuthors.kharm,
        createdAt: '20 Aug 2025, 08:08 AM',
        upVotes: 0,
        downVotes: 0,
        isEditable: true,
        body: [
            "I'm working on the TypeScript interfaces and have a few questions about the prop validation patterns",
            'mentioned in the spec.',
            '',
            'For the Button component, the spec mentions "flexible variant system" - should this be implemented as:',
            "1. String literals: `variant: 'primary' | 'secondary' | 'ghost'`",
            '2. Or more flexible: `variant?: string`',
            '',
            'Also, regarding the size prop - should we use a scale system or specific size names?',
            'Any guidance would be appreciated!',
            '',
            'https://prnt.sc/zeYNoKumQBTN',
        ].join('\n'),
    },
    {
        id: 'post-2',
        author: forumAuthors.tourist,
        createdAt: '20 Aug 2025, 08:08 AM',
        upVotes: 3,
        downVotes: 0,
        body: '+1 for priority clarification.',
    },
    {
        id: 'post-3',
        author: forumAuthors.copilot,
        createdAt: '20 Aug 2025, 08:08 AM',
        upVotes: 4,
        downVotes: 0,
        body: [
            'Good question! For maximum type safety and developer experience, I recommend using string literals',
            'for both variant and size:',
            '',
            '```typescript',
            'interface ButtonProps {',
            "  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';",
            "  size?: 'sm' | 'md' | 'lg';",
            '  children: React.ReactNode;',
            '  onClick?: () => void;',
            '}',
            '```',
            '',
            'This provides IntelliSense support and prevents typos. You can always extend the union types later',
            'if needed.',
        ].join('\n'),
    },
]
