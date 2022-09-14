import { EnvironmentConfig } from '../../../../config'

export default function getDataSource(): string {
  return `${EnvironmentConfig.API.V5}/gamification`
}
