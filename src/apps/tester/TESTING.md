# Tester App Testing Checklist

## Pre-Testing Setup
- [ ] Platform-ui server running on port 3001
- [ ] Client running on https://local.topcoder-dev.com
- [ ] Logged in with valid user account
- [ ] TC_API_BASE_URL configured
- [ ] Test user accounts exist (copilot, reviewers, submitters)

## Flow Testing

### Full Challenge
- [ ] Configuration loads with defaults
- [ ] Edit configuration and save to localStorage
- [ ] Run full flow (15 steps)
- [ ] Verify progress bar updates
- [ ] Check all steps complete successfully
- [ ] Verify challenge created and completed
- [ ] Run to step "Assign Resources"
- [ ] Verify execution stops at selected step
- [ ] Check request/response debugging

### First2Finish
- [ ] Configuration loads with defaults
- [ ] Edit configuration (change reviewer, submitters)
- [ ] Run full flow (10 steps)
- [ ] Verify iterative submission/review process
- [ ] Check winner declared after passing review
- [ ] Test with multiple submitters

### Topgear Task
- [ ] Configuration loads with defaults
- [ ] Run full flow (11 steps)
- [ ] Verify "Await Submission End" step waits
- [ ] Check late submission handling
- [ ] Verify winner declared

### Topgear Task (Late)
- [ ] Configuration loads with defaults
- [ ] Run full flow (10 steps)
- [ ] Verify no wait for submission end
- [ ] Check immediate late submission
- [ ] Verify winner declared

### Design Challenge
- [ ] Configuration loads with defaults
- [ ] Edit configuration (set all reviewer roles)
- [ ] Run full flow (20 steps)
- [ ] Verify checkpoint submissions created
- [ ] Check checkpoint screening and review
- [ ] Verify final submissions created
- [ ] Check final screening, review, approval
- [ ] Verify challenge completed

### Design Single
- [ ] Configuration loads with defaults
- [ ] Run full flow (15 steps)
- [ ] Verify no checkpoint phase
- [ ] Check screening, review, approval
- [ ] Verify challenge completed

### Design Fail Screening
- [ ] Configuration loads with defaults
- [ ] Run full flow (20 steps)
- [ ] Verify screening failure handled correctly
- [ ] Check error messages in logs

### Design Fail Review
- [ ] Configuration loads with defaults
- [ ] Run full flow (20 steps)
- [ ] Verify review failure handled correctly
- [ ] Check error messages in logs

## localStorage Persistence

### Configuration Persistence
- [ ] Edit Full Challenge configuration
- [ ] Save changes
- [ ] Refresh browser
- [ ] Verify changes persisted
- [ ] Check localStorage in DevTools

### Per-Flow Configuration
- [ ] Edit Full Challenge config
- [ ] Switch to First2Finish tab
- [ ] Edit First2Finish config
- [ ] Switch back to Full Challenge
- [ ] Verify each flow has separate config

### Cross-Browser Testing
- [ ] Configure in Chrome
- [ ] Open in Firefox
- [ ] Verify Firefox shows defaults
- [ ] Edit in Firefox
- [ ] Switch back to Chrome
- [ ] Verify Chrome shows its own config

### Configuration Reset
- [ ] Edit and save configuration
- [ ] Clear localStorage
- [ ] Refresh page
- [ ] Verify reverts to defaults

### Merge Behavior
- [ ] Edit only challengeNamePrefix
- [ ] Save
- [ ] Verify other fields use defaults
- [ ] Check localStorage contains only changed field

## JWT Authentication

### Authenticated Access
- [ ] Log in to platform-ui
- [ ] Navigate to /tester
- [ ] Verify app loads
- [ ] Check reference data loads
- [ ] Run a flow successfully

### Unauthenticated Access
- [ ] Clear auth cookies
- [ ] Navigate to /tester
- [ ] Verify redirect to login or error
- [ ] Try API call directly
- [ ] Confirm 401 response

### Token Expiration
- [ ] Log in and open tester
- [ ] Wait for token expiration
- [ ] Attempt to run flow
- [ ] Verify 401 error handled
- [ ] Check re-authentication prompt

### Token Passing
- [ ] Open DevTools Network tab
- [ ] Run a flow
- [ ] Check API requests include JWT
- [ ] Verify cookies or Authorization header
- [ ] Confirm backend forwards JWT

### Authorization Validation
- [ ] Test with limited permissions user
- [ ] Verify appropriate error messages
- [ ] Check unauthorized actions blocked

## UI/UX Testing

### ConfigTable
- [ ] Displays all configuration fields
- [ ] Shows correct values from localStorage/defaults
- [ ] Updates when configuration changes
- [ ] Handles long values gracefully

### ConfigForm
- [ ] All fields editable
- [ ] Challenge types dropdown loads
- [ ] Challenge tracks dropdown loads
- [ ] Scorecards load after type/track selection
- [ ] Validation works (required fields)
- [ ] Save button persists changes
- [ ] Cancel button discards changes

### Runner
- [ ] Progress bar updates smoothly
- [ ] Steps show correct status (pending/in-progress/success/failure)
- [ ] Logs stream in real-time
- [ ] Request/response modals open
- [ ] Copy buttons work
- [ ] JSON syntax highlighting works
- [ ] Error messages display clearly

### Layout & Navigation
- [ ] Flow tabs switch correctly
- [ ] Active tab highlighted
- [ ] Responsive design works on mobile
- [ ] Follows review app styling

## Error Handling

### Invalid Configuration
- [ ] Test with non-existent user handles
- [ ] Verify error messages in logs
- [ ] Check execution stops gracefully

### Network Errors
- [ ] Disconnect network during flow
- [ ] Verify error handling
- [ ] Check reconnection behavior

### API Errors
- [ ] Test with invalid challenge type
- [ ] Verify error messages
- [ ] Check logs show API response

## Performance

### SSE Connection
- [ ] Verify connection remains stable
- [ ] Check no memory leaks during long flows
- [ ] Test reconnection after disconnect

### localStorage
- [ ] Verify fast read/write operations
- [ ] Check no performance impact on large configs

## Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Test Results
Document any issues found during testing with:
- Flow type
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Browser/environment details
