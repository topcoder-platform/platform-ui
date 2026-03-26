import { InputMultiselectOption } from '~/libs/ui'

export const INDUSTRIES_OPTIONS: string[] = [
    'Banking',
    'Consumer goods',
    'Energy',
    'Entertainment',
    'Healthcare',
    'Pharma',
    'Tech & technology services',
    'Telecoms',
    'Public sector',
    'Travel & hospitality',
    'Others',
]

export const preferredRoleOptions: InputMultiselectOption[] = [
    { label: 'AI / ML Engineer', value: 'AI_ML_ENGINEER' },
    { label: 'Data Scientist / Data Engineer', value: 'DATA_SCIENTIST_ENGINEER' },
    { label: 'Cybersecurity Analyst / Security Engineer', value: 'CYBERSECURITY_ENGINEER' },
    { label: 'Cloud Engineer / Solutions Architect', value: 'CLOUD_ENGINEER' },
    { label: 'DevOps Engineer / SRE', value: 'DEVOPS_SRE' },
    { label: 'Full-Stack Developer', value: 'FULL_STACK_DEVELOPER' },
    { label: 'QA Lead / Automation Engineer', value: 'QA_AUTOMATION_ENGINEER' },
    { label: 'UX Designer', value: 'UX_DESIGNER' },
    { label: 'Technical Project Manager', value: 'TECHNICAL_PM' },
    { label: 'Database Administrator', value: 'DB_ADMIN' },
    { label: 'AI Prompt Engineer', value: 'AI_PROMPT_ENGINEER' },
    { label: 'Enterprise Architect', value: 'ENTERPRISE_ARCHITECT' },
]
