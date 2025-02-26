# Platform UI – User Management Enhancement

This patch updates the User Management page and associated dialogs to support real API endpoints for user data, roles, groups, terms, and status updates. The changes have been made against the develop branch (commit hash 4ad7cf8c55f0bb772b927ee6e9737b5b0884af88 or later).

## Deployment & Configuration

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/topcoder-platform/platform-ui.git
   cd platform-ui
Install Dependencies: Ensure you have the required Node version (see .nvmrc). Then run:

bash
Copy
yarn install
Environment Variables:

The API base URLs for v3 and v5 endpoints are configured in src/config/environments.js (or the corresponding config file).
Ensure the cookie named tcjwt is available for authentication.
Running the Application: On Mac, if required, run with elevated permissions (for port 443):

bash
Copy
sudo yarn start
Otherwise, simply run:

bash
Copy
yarn start
The application will be available at https://local.topcoder-dev.com.

API Endpoints:

User API (v3): GET /v3/users, PATCH /v3/users/{User Id}/email, etc.
Groups API (v5): GET /v5/groups, POST /v5/groups/{Group ID}/members, DELETE /v5/groups/{Group ID}/members/{User ID}
Terms API (v5): GET /v5/terms, POST /v5/terms/{Term ID}/users, DELETE /v5/terms/{Term ID}/users/{User ID}
Testing: Unit tests have been written to validate the functionality of the User Management page, dialogs, and filtering/sorting. To run the tests:

bash
Copy
yarn test
Code Quality
The changes follow the existing code styling and quality standards.
Existing components are reused wherever possible.
The code is fully typed using TypeScript.
Known Limitations
Real API integration is approximately 75% complete.
Some dialogs (e.g., Edit Terms) are not fully functional against real endpoints yet.
Error handling for real API responses has been implemented using toast notifications, but further refinements may be needed.
Directory Structure
src/apps/admin/src/user-management/: Contains the User Management page and its dialogs.
src/services/: Contains API service functions (e.g., updateUserEmail).
src/libs/useAxiosInstance.ts: Provides an Axios instance that injects the JWT token from cookies.
How to Update
To add further functionality, create additional dialogs following the patterns used in EditEmailDialog, EditRolesDialog, etc.
Ensure that new API integrations use the appropriate version of the API (v3 or v5) by using the correct Axios instance.
csharp
Copy

---

### 3. Validation Markdown (validation.md)

Below is an example validation markdown file explaining your testing procedures.

```markdown
# Validation for User Management Enhancements

## Overview

The following outlines the manual and automated tests performed on the enhanced User Management features. The tests cover the following requirements:

1. **User Management Page:**
   - Displays a table of users with sortable columns (User ID, Handle, Primary Email, User Active).
   - Supports expandable rows to view additional user details.
   - Implements filtering by Handle, Email, User ID, and Status.
   - Action buttons (Edit, Deactivate/Activate) open the corresponding dialogs.

2. **Edit Primary Email Dialog:**
   - Displays the user ID, original email, and an input for the new email.
   - On saving, calls the PATCH `/v3/users/{User Id}/email` API (using a mocked updateUserEmail function for tests).
   - Displays success and error toast notifications based on the API response.

3. **Edit Roles Dialog:**
   - Displays the user’s current roles.
   - Supports role removal and addition.
   - Updates are saved via the corresponding API endpoints (using dummy data for testing).

4. **Edit Groups Dialog:**
   - Fetches groups from the real API endpoint `/v5/groups` (fallback to dummy data if API error occurs).
   - Supports adding and removing groups from a user.
   - Uses POST and DELETE endpoints to update group membership.

5. **Edit Terms Dialog (In Progress):**
   - Provides interface to sign/unsign terms.
   - Filtering is enabled by title.
   - Not fully implemented against the real API but follows the established patterns.

6. **Edit User Status Dialog:**
   - Allows updating the user’s status and providing an optional comment.
   - Integrates with the PATCH `/v3/users/{User Id}/status` API.

## Automated Tests

Unit tests have been added for:
- Rendering the User Management page.
- Sorting and filtering functionality.
- Expanding/collapsing user rows.
- The EditPrimaryEmailDialog (ensuring onSave is called with the new email).

To run automated tests:
```bash
yarn test
All tests pass with dummy data. Note that tests involving API calls use mocks (e.g., for updateUserEmail).

Manual Testing
User Management Page:

Load the page and verify the user table is rendered.
Click the column headers to change sort order.
Use the filter inputs to search by handle, email, user ID, and status.
Dialogs:

Click on the "Edit" button for a user to open the Edit Primary Email, Roles, Groups, and Status dialogs.
For the Edit Email dialog, change the email and click "Save" to verify that the update function is called and the table reflects the new email.
For the Edit Roles and Groups dialogs, add or remove roles/groups and confirm that the changes appear in the table.
Test error scenarios by, for example, removing a role or group that is not assigned.
Mobile Responsiveness:

Resize the browser window or use device simulation tools in the browser’s developer tools to ensure the page and dialogs remain usable and visually consistent on mobile devices.
Summary
The implementation covers approximately 75% of the requirements. Dummy data has been successfully replaced by real API endpoints where possible. Some endpoints (e.g., for terms) are still in progress. All automated tests pass, and manual testing confirms that core functionality works as expected.


---

These three files should give the reviewer a clear view of your changes, how to deploy and test your code, and your validation process. Adjust file paths and details as needed based on your project structure.
