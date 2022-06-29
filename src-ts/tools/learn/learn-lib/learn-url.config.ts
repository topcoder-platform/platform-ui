import { EnvironmentConfig } from '../../../config'

export function getPath(...parts: Array<string>): string {
    return [learnPath, ...parts].filter(Boolean).join('/')
}

const learnPath: string = `${EnvironmentConfig.API.V5}/learning-paths`
