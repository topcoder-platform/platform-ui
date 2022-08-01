export * from './authentication-reg-source.enum'
export {
    authentication as authUrl,
    login as authUrlLogin,
    logout as authUrlLogout,
    signup as authUrlSignup,
} from './authentication-url.config'
export { initializeAsync as authInitializeAsync } from './authentication.functions'
