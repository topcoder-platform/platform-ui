export type UserEmailPreferences = {
    status: 'subscribed' | 'unsubscribed'
    email_address: string
    interests: {
        [key: string]: boolean
    }
}
