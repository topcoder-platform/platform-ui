export * from './authentication-reg-source.enum'
export {
    authentication as authUrl,
    login as authUrlLogin,
    logout as authUrlLogout,
    signup as authUrlSignup,
} from './authentication-url.config'
export {
    getRegistrationSource as authGetRegistrationSource,
    initializeAsync as authInitializeAsync,
} from './authentication.functions'
