# Work showcase and WIN (PM-6329)

The project editor and showcase form share `project.details.customer`, `smu`,
`smuOther`, and `dealCloseDate`. New showcases start with the current project
values. Existing showcases load those values from the post API response. Saving
a showcase updates its content and these project fields in one projects API
transaction, then refreshes the cached project.

Project metadata is optional in the project editor and required when saving the
showcase form. SMU accepts APMEA, Europe, Americas1, Americas2, or Others. Others
requires a custom value; selecting a standard SMU clears the stored custom value.
Deal Close Date is a `YYYY-MM-DD` calendar date and is not converted between timezones.

The showcase form follows this order:

1. Title
2. Type (required: Open Innovation, Private POD Delivery, Flexi-Talent Supply, AI Data Licensing)
3. Customer / SMU / Deal Close Date
4. Industry/Sector
5. Category/Technology
6. The Challenge
7. The Solution (the existing `content` API field)
8. Business Impact Realised
9. Key Win
10. Post Media
11. Topcoder Challenge Launched
12. Current Status (Delivered, In Delivery, On-Hold, Planned)
13. Owner (a name or handle)

The Challenge, The Solution and Business Impact Realised use the same Markdown
editor and sanitized rich-text preview. Key Win and Owner are single-line strings
of up to 255 characters. Existing title, taxonomy and solution requirements remain.

**Send to WIN** is unchecked for new posts and retains the saved choice on edits.
Saving with the checkbox selected makes the record available to authorized callers
of `GET /v6/reports/WIN`. This is a pull integration: the success message confirms
availability to WIN. Validation and API failures keep the form open with an error.
Unchecking removes the post from the WIN report after saving. Archived posts and
posts belonging to deleted projects are excluded from the report.

## Deployment and verification

Deploy the PM-6329 projects API migration and application before enabling this UI;
deploy the reports API change for WIN callers. No new UI environment variables are needed.

Use `.nvmrc`, then `yarn lint`, `yarn run build`, and the tests for
`ProjectShowcasePage`, `ProjectEditorForm`, `project-editor.schema`, and
`showcase-post.schema`. Manually check that editing metadata in either form is
reflected when reopening the other form, and that opting in/out changes the WIN report.
