# Accounts App

The Preferences tab loads marketing email categories from
`EnvironmentConfig.CONTACT_API/me/subscriptions` using the member's normal bearer
token. The member chooses categories explicitly, then saves the complete selection
with `PUT`; an empty selection opts out of every active marketing category. The API
derives member identity from authentication, so the browser never supplies a target
member ID. Loading and save failures preserve the member's choices and offer retry.
Existing delivery suppression is shown and is not cleared by a subscription change.
The separate forum settings link and account/security email behavior remain available.

Email preferences are shown only when `EnvironmentConfig.CONTACT_API_ENABLED` is
true. The flag defaults to true for dev/QA and false for production, where the
Contact API is not yet deployed. While disabled, the tab shows Forum preferences
without making Contact API requests. Set `REACT_APP_CONTACT_API_ENABLED=true` for
the production build once the API is available.

`getMarketingPreferences()` returns the authenticated member's categories and
suppression flag. `saveMarketingPreferences(subscriptionTypeIds)` stores selected
active category IDs and returns refreshed preferences; both reject on API failure.
`MarketingPreferences` renders these choices, saves only on the member's explicit
action, and handles loading, failure and success feedback. Method inputs, outputs,
usage and failure behavior are documented in source.
