export enum ProjectType {
    design = 'Design',
    developement = 'Development',
    marathonCopilot = 'Data Science (Marathon Copilot)',
    sprintCopilot = 'Data Science (Sprint Copilot)',
    marathonTester = 'Data Science (Marathon Tester)',
    qa = 'QA (Quality Assurance)',
    ai='AI (Artificial Intelligence)',
}
export const ProjectTypeValues = {
    [ProjectType.design]: 'design',
    [ProjectType.developement]: 'dev',
    [ProjectType.marathonCopilot]: 'marathonCopilot',
    [ProjectType.marathonTester]: 'sprintCopilot',
    [ProjectType.sprintCopilot]: 'marathonTester',
    [ProjectType.qa]: 'qa',
    [ProjectType.ai]: 'ai',
}
export const ProjectTypeLabels = {
    [ProjectTypeValues[ProjectType.design]]: ProjectType.design,
    [ProjectTypeValues[ProjectType.developement]]: ProjectType.developement,
    [ProjectTypeValues[ProjectType.marathonCopilot]]: ProjectType.marathonCopilot,
    [ProjectTypeValues[ProjectType.marathonTester]]: ProjectType.marathonTester,
    [ProjectTypeValues[ProjectType.sprintCopilot]]: ProjectType.sprintCopilot,
    [ProjectTypeValues[ProjectType.qa]]: ProjectType.qa,
    [ProjectTypeValues[ProjectType.ai]]: ProjectType.ai,
}

export const ProjectTypes = [
    ProjectType.design,
    ProjectType.developement,
    ProjectType.marathonCopilot,
    ProjectType.marathonTester,
    ProjectType.sprintCopilot,
    ProjectType.qa,
    ProjectType.ai,
]
