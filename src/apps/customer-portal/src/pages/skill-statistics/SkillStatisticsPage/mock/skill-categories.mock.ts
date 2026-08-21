import { FC, SVGProps } from 'react'

import { IconOutline } from '~/libs/ui'

export type SkillCategoryIcon = FC<SVGProps<SVGSVGElement>>

export type SkillCategoryMock = {
    color: string
    icon: SkillCategoryIcon
    id: string
    name: string
    officialName: string
    size: number
    skillsBreakdown: Array<{ name: string; percentage: number }>
    totalMembers: number
    totalSkills: number
}

export type SkillMemberMock = {
    countryCode: string
    countryName: string
    handle: string
    name: string
    photoURL?: string
    rating: number
    wins: number
}

export const PROGRAMMING_CATEGORY_ID = '481b5ebc-2fe6-45ed-a90c-736936d458d7'

export const SKILL_CATEGORIES: SkillCategoryMock[] = [
    {
        color: '#1B4F72',
        icon: IconOutline.TerminalIcon,
        id: PROGRAMMING_CATEGORY_ID,
        name: 'Programming & Development',
        officialName: 'Programming and Development',
        size: 10,
        skillsBreakdown: [
            { name: 'JavaScript', percentage: 40 },
            { name: 'Python', percentage: 30 },
            { name: 'Swift', percentage: 15 },
        ],
        totalMembers: 1012928,
        totalSkills: 1059,
    },
    {
        color: '#3D8B8F',
        icon: IconOutline.RssIcon,
        id: 'cfb17211-2abd-41e1-b169-e90cf038c6a7',
        name: 'Networking and Telecommunications',
        officialName: 'Networking and Telecommunications',
        size: 8.4,
        skillsBreakdown: [
            { name: 'TCP/IP', percentage: 35 },
            { name: 'Routing', percentage: 28 },
            { name: '5G', percentage: 22 },
        ],
        totalMembers: 412800,
        totalSkills: 286,
    },
    {
        color: '#5B9BD5',
        icon: IconOutline.GlobeAltIcon,
        id: '5aadafad-da63-488e-8499-32b596215789',
        name: 'Web Development',
        officialName: 'Web Development',
        size: 7.8,
        skillsBreakdown: [
            { name: 'React', percentage: 38 },
            { name: 'Node.js', percentage: 27 },
            { name: 'CSS', percentage: 20 },
        ],
        totalMembers: 388420,
        totalSkills: 412,
    },
    {
        color: '#5EB3C4',
        icon: IconOutline.ShieldCheckIcon,
        id: '221f4e3f-1ac8-438b-9dc1-977e30656789',
        name: 'Cybersecurity',
        officialName: 'Cybersecurity',
        size: 7.2,
        skillsBreakdown: [
            { name: 'Pen Testing', percentage: 32 },
            { name: 'SIEM', percentage: 26 },
            { name: 'IAM', percentage: 24 },
        ],
        totalMembers: 276540,
        totalSkills: 198,
    },
    {
        color: '#1A3D3D',
        icon: IconOutline.CloudIcon,
        id: 'cc346829-c9e4-44a9-996b-34054cf20fec',
        name: 'Cloud Computing',
        officialName: 'Cloud Computing',
        size: 6.4,
        skillsBreakdown: [
            { name: 'AWS', percentage: 42 },
            { name: 'Azure', percentage: 28 },
            { name: 'GCP', percentage: 18 },
        ],
        totalMembers: 241100,
        totalSkills: 176,
    },
    {
        color: '#2D4A3E',
        icon: IconOutline.RefreshIcon,
        id: 'aa495f25-2f2d-4334-9b6f-2ffe11d835d2',
        name: 'Software Development Lifecycle',
        officialName: 'Software Development Lifecycle (SDLC)',
        size: 6.2,
        skillsBreakdown: [
            { name: 'Agile', percentage: 40 },
            { name: 'CI/CD', percentage: 30 },
            { name: 'Scrum', percentage: 18 },
        ],
        totalMembers: 198760,
        totalSkills: 94,
    },
    {
        color: '#4A5D4A',
        icon: IconOutline.DuplicateIcon,
        id: 'e2429c1b-7609-49e0-93cc-341a89e12269',
        name: 'DevOps & Automation',
        officialName: 'DevOps and Automation',
        size: 5.8,
        skillsBreakdown: [
            { name: 'Kubernetes', percentage: 34 },
            { name: 'Terraform', percentage: 28 },
            { name: 'Jenkins', percentage: 22 },
        ],
        totalMembers: 176430,
        totalSkills: 142,
    },
    {
        color: '#3D7EA6',
        icon: IconOutline.ChipIcon,
        id: '185f4bf3-50de-46af-aaa6-9011872395cf',
        name: 'Operating Systems',
        officialName: 'Operating Systems',
        size: 5.5,
        skillsBreakdown: [
            { name: 'Linux', percentage: 48 },
            { name: 'Windows', percentage: 22 },
            { name: 'macOS', percentage: 16 },
        ],
        totalMembers: 154220,
        totalSkills: 88,
    },
    {
        color: '#2C5F8A',
        icon: IconOutline.ChartBarIcon,
        id: '4064574c-befa-4fb3-a8e2-34038d7f845b',
        name: 'Data Analysis & Big Data',
        officialName: 'Data Analysis and Big Data',
        size: 5.4,
        skillsBreakdown: [
            { name: 'SQL', percentage: 36 },
            { name: 'Spark', percentage: 26 },
            { name: 'Tableau', percentage: 20 },
        ],
        totalMembers: 148900,
        totalSkills: 164,
    },
    {
        color: '#7EB8C4',
        icon: IconOutline.SparklesIcon,
        id: 'a1289278-a734-4523-918f-ea0f05667e24',
        name: 'Machine Learning & AI',
        officialName: 'Machine Learning and AI',
        size: 5.1,
        skillsBreakdown: [
            { name: 'PyTorch', percentage: 33 },
            { name: 'TensorFlow', percentage: 29 },
            { name: 'NLP', percentage: 21 },
        ],
        totalMembers: 132450,
        totalSkills: 210,
    },
    {
        color: '#2C4A6E',
        icon: IconOutline.ServerIcon,
        id: 'e50b1794-e08d-4dc3-a4b1-6b5213c7da8e',
        name: 'Databases & Data Warehousing',
        officialName: 'Databases and Data Warehousing',
        size: 5,
        skillsBreakdown: [
            { name: 'PostgreSQL', percentage: 34 },
            { name: 'Snowflake', percentage: 28 },
            { name: 'Redshift', percentage: 20 },
        ],
        totalMembers: 121800,
        totalSkills: 118,
    },
    {
        color: '#3D5C5C',
        icon: IconOutline.PencilAltIcon,
        id: '3eb5163c-cd3f-4c7d-b059-95c901bc2066',
        name: 'UX Design & Multimedia',
        officialName: 'User Experience Design and Multimedia',
        size: 4.6,
        skillsBreakdown: [
            { name: 'Figma', percentage: 42 },
            { name: 'UX Research', percentage: 24 },
            { name: 'Motion', percentage: 16 },
        ],
        totalMembers: 98600,
        totalSkills: 76,
    },
    {
        color: '#6B7C4A',
        icon: IconOutline.CalculatorIcon,
        id: 'b3c8970d-79e8-4f97-a84e-841aebaa890f',
        name: 'Mathematics & Statistics',
        officialName: 'Mathematics and Statistics',
        size: 4.5,
        skillsBreakdown: [
            { name: 'Statistics', percentage: 38 },
            { name: 'Linear Algebra', percentage: 27 },
            { name: 'R', percentage: 19 },
        ],
        totalMembers: 87400,
        totalSkills: 64,
    },
    {
        color: '#2D5A8A',
        icon: IconOutline.CubeTransparentIcon,
        id: '35e9e3c6-3480-4fdb-9f77-91e667923a01',
        name: 'Virtualization',
        officialName: 'Virtualization',
        size: 4.4,
        skillsBreakdown: [
            { name: 'VMware', percentage: 36 },
            { name: 'Hyper-V', percentage: 28 },
            { name: 'KVM', percentage: 20 },
        ],
        totalMembers: 76210,
        totalSkills: 41,
    },
    {
        color: '#5A8A8A',
        icon: IconOutline.MapIcon,
        id: '6b9717ef-9520-4507-9039-2acedbec002d',
        name: 'Geospatial Information Systems',
        officialName: 'Geospatial Information Systems (GIS)',
        size: 4,
        skillsBreakdown: [
            { name: 'ArcGIS', percentage: 40 },
            { name: 'QGIS', percentage: 28 },
            { name: 'GeoJSON', percentage: 18 },
        ],
        totalMembers: 54120,
        totalSkills: 52,
    },
    {
        color: '#4EC4C4',
        icon: IconOutline.DesktopComputerIcon,
        id: '831ed28d-c20f-40c8-a348-d1d3739e9046',
        name: 'Hardware & Systems Administration',
        officialName: 'Hardware and Systems Administration',
        size: 3.9,
        skillsBreakdown: [
            { name: 'Linux Admin', percentage: 36 },
            { name: 'Networking', percentage: 27 },
            { name: 'Hardware', percentage: 21 },
        ],
        totalMembers: 49880,
        totalSkills: 58,
    },
    {
        color: '#2C4A6E',
        icon: IconOutline.ClipboardCheckIcon,
        id: 'c5f83f60-4dcf-4305-b55e-b38fe5afec60',
        name: 'Software Testing & QA',
        officialName: 'Software Testing and Quality Assurance',
        size: 3.8,
        skillsBreakdown: [
            { name: 'Selenium', percentage: 34 },
            { name: 'Cypress', percentage: 28 },
            { name: 'JMeter', percentage: 20 },
        ],
        totalMembers: 46750,
        totalSkills: 72,
    },
    {
        color: '#5A8A9A',
        icon: IconOutline.DatabaseIcon,
        id: '38fadd80-8721-4ce0-9387-cb6ad3ce48da',
        name: 'Database Management',
        officialName: 'Database Management',
        size: 3.7,
        skillsBreakdown: [
            { name: 'MySQL', percentage: 38 },
            { name: 'Oracle', percentage: 26 },
            { name: 'MongoDB', percentage: 20 },
        ],
        totalMembers: 43210,
        totalSkills: 81,
    },
    {
        color: '#4A9A9A',
        icon: IconOutline.DeviceMobileIcon,
        id: '0ae22576-48ed-4ffd-9319-058b6fd80675',
        name: 'Mobile App Development',
        officialName: 'Mobile App Development',
        size: 3.5,
        skillsBreakdown: [
            { name: 'Swift', percentage: 32 },
            { name: 'Kotlin', percentage: 30 },
            { name: 'React Native', percentage: 22 },
        ],
        totalMembers: 38940,
        totalSkills: 96,
    },
    {
        color: '#3D6A8A',
        icon: IconOutline.ShareIcon,
        id: 'f1daa100-b63b-45c1-a638-90fbfc817200',
        name: 'Blockchain',
        officialName: 'Blockchain',
        size: 3.3,
        skillsBreakdown: [
            { name: 'Solidity', percentage: 40 },
            { name: 'Ethereum', percentage: 28 },
            { name: 'Web3', percentage: 18 },
        ],
        totalMembers: 27650,
        totalSkills: 44,
    },
    {
        color: '#5EB8B0',
        icon: IconOutline.WifiIcon,
        id: 'e4a51b10-ecba-46eb-89e2-5908bb324a8c',
        name: 'IoT (Internet of Things)',
        officialName: 'IoT (Internet of Things)',
        size: 3.2,
        skillsBreakdown: [
            { name: 'MQTT', percentage: 34 },
            { name: 'Embedded C', percentage: 28 },
            { name: 'Arduino', percentage: 22 },
        ],
        totalMembers: 24180,
        totalSkills: 39,
    },
    {
        color: '#3D5A6E',
        icon: IconOutline.ClipboardListIcon,
        id: '07a0abe3-2791-4068-b5b5-be48fefa3551',
        name: 'Project Management',
        officialName: 'Project Management',
        size: 3.1,
        skillsBreakdown: [
            { name: 'Jira', percentage: 36 },
            { name: 'PMP', percentage: 26 },
            { name: 'Kanban', percentage: 22 },
        ],
        totalMembers: 21890,
        totalSkills: 27,
    },
    {
        color: '#4A6A7A',
        icon: IconOutline.CodeIcon,
        id: '1f5ed3e8-8d22-44ea-b75d-ea85147a04da',
        name: 'Scripting & Automation',
        officialName: 'Scripting and Automation',
        size: 3,
        skillsBreakdown: [
            { name: 'Bash', percentage: 36 },
            { name: 'Python', percentage: 32 },
            { name: 'PowerShell', percentage: 18 },
        ],
        totalMembers: 19640,
        totalSkills: 33,
    },
]
