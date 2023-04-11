/* eslint-disable import/no-dynamic-require, no-console, global-require */
import { GlobalConfig } from './global-config.model'

const EnvironmentConfig: GlobalConfig = (() => {
    const env: string = process.env.REACT_APP_HOST_ENV || 'dev'

    console.info(`REACT_APP_HOST_ENV: "${process.env.REACT_APP_HOST_ENV}"`)
    console.info(`env: "${env}"`)

    // for security reason don't let to require any arbitrary file defined in process.env
    if (['prod', 'dev'].indexOf(env) < 0) {
        return require('./dev')
    }

    return require(`./${env}`)
})()

export * from './global-config.model'
export default EnvironmentConfig
