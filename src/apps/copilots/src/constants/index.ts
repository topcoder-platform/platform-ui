export enum ProjectType {
    design = 'Design',
    developement = 'Development',
    datascience = 'Data Science',
    qa = 'QA (Quality Assurance)',
    ai='AI (Artificial Intelligence)',
}
export const ProjectTypeValues = {
    [ProjectType.design]: 'design',
    [ProjectType.developement]: 'dev',
    [ProjectType.datascience]: 'datascience',
    [ProjectType.qa]: 'qa',
    [ProjectType.ai]: 'ai',
}
export const ProjectTypeLabels = {
    [ProjectTypeValues[ProjectType.design]]: ProjectType.design,
    [ProjectTypeValues[ProjectType.developement]]: ProjectType.developement,
    [ProjectTypeValues[ProjectType.datascience]]: ProjectType.datascience,
    [ProjectTypeValues[ProjectType.qa]]: ProjectType.qa,
    [ProjectTypeValues[ProjectType.ai]]: ProjectType.ai,
}

export const ProjectTypes = [
    ProjectType.design,
    ProjectType.developement,
    ProjectType.datascience,
    ProjectType.qa,
    ProjectType.ai,
]
