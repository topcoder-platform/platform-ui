import { EnvironmentConfig } from '../../../config'

export const authentication: string = EnvironmentConfig.URL.ACCOUNTS_APP_CONNECTOR

export const login: string = `${authentication}?retUrl=${encodeURIComponent(window.location.href.match(/[^?]*/)?.[0] || window.location.host)}`

export const logout: string = `${authentication}?logout=true&retUrl=${encodeURIComponent('https://' + window.location.host)}`

export const signup: string = `${login}&regSource=tcBusiness&mode=signUp`
