# Timesheet Management for Engagement Assignees

## 1\. Objective

Implement a centralized timesheet management capability within the Engagements Portal that allows:

*   Engagement assignees to enter and submit hours worked.

*   Engagement managers to review and approve submitted timesheets.

*   Administrators to monitor and override timesheet actions.

*   Approved timesheet hours to be integrated with engagement payments in the Work App.


## 2\. Application URL

The timesheet module must be accessible at:

​[![](https://engagements.topcoder.com/favicon.png)Topcoder Top Technology Talent On-Demand](https://engagements.topcoder.com/timesheets)Open

The page and available actions must be displayed based on the logged-in user’s role and engagement-level authorization.

## 3\. Entry Point from My Assignments

Within the Engagements Portal:

1.  Navigate to **My Assignments**.

2.  For each engagement in **Active** status, display a **Timesheet** button.

3.  Clicking the button must open the timesheet page for the selected engagement.

4.  The button must not be displayed, or must be disabled, for engagements that are not in Active status.


The engagement context should be carried automatically when the timesheet page is opened.

- - -

# 4\. Member Timesheet View

## 4.1 Engagement Information

At the top of the page, display the following read-only engagement details:

*   Engagement Title

*   Standard Hours per Day

*   Member Name, with Topcoder handle in brackets

*   Manager Name, with Topcoder handle in brackets


If multiple managers are assigned, display all assigned managers.

Example:

Member: John Smith (johnsmith)

Managers: Mary Jones (maryj), Robert Lee (robertl)

## 4.2 Date Range Selection

Provide a timesheet date picker with:

*   From Date

*   To Date


When the member selects a date range, the system must generate one timesheet row for each calendar date within the selected range, inclusive of both the start and end dates.
Don’t allow to select more than 31 days range.

Example:

If the member selects **September 7, 2026 to September 11, 2026**, the system must generate five rows:

*   07-09-2026

*   08-09-2026

*   09-09-2026

*   10-09-2026

*   11-09-2026


## 4.3 Timesheet Fields

Each generated row must contain the following fields:

|     |     |
| --- | --- |
| Field | Description |
| Select | Checkbox used to select the row for submission |
| Date | Date in DD-MM-YYYY format |
| Day | Day of the week, such as Monday or Tuesday |
| Hours Worked | Decimal numeric input supporting values such as 8, 8.5, or 9.5 |
| Remarks | Descriptive text input for entering work details or comments |
| Status | Displays \-, Submitted, or Approved |

The Date and Day fields must be automatically populated and read-only.

## 4.4 Data Validation

The following validations must apply:

*   Hours Worked must accept only numeric or decimal values.

*   Hours Worked cannot be negative.

*   Only selected rows must be submitted.

*   Rows with missing or invalid required information must not be submitted.

*   The To Date cannot be earlier than the From Date.

*   Duplicate timesheet rows must not be created for the same engagement, assignee, and date.


## 4.5 Timesheet Submission

When the member selects one or more rows, display a summary section at the bottom of the page containing:

*   Total Selected Days

*   Total Selected Hours

*   Submit button with the selected row count


Example:

Total Days: 5

Total Hours: 42.5

Submit (5)

When the member clicks **Submit (5)**, display a confirmation message.

Suggested confirmation message:

> You are about to submit 5 timesheet entries totaling 42.5 hours. Once submitted, these entries will be sent to the engagement manager for approval. Do you want to continue?

Available actions:

*   Cancel

*   Submit


After successful submission:

*   The status of the selected rows must change from \- to Submitted.

*   The submission date, time, and submitting user must be recorded.

*   The assigned engagement managers must be able to view the submitted rows.


## 4.6 Editing Submitted Entries

A member may edit an entry while its status is Submitted.

If the member changes the Hours Worked or Remarks field:

*   The status of that row must change from Submitted to \-.

*   The modified row must be resubmitted for approval.

*   Other unchanged submitted rows must retain their existing status.

*   The system must retain an audit history of the original submission and subsequent changes.


## 4.7 Approved Entries

Once an entry reaches Approved status:

*   The member must not be able to edit the entry.

*   Hours Worked and Remarks must be displayed as read-only.

*   The row checkbox must be disabled.

*   The approval date, approving manager, and approval comments should be available for reference.


Any correction to an approved entry must require administrator intervention.

- - -

# 5\. Manager Timesheet View

## 5.1 Manager Authorization

An engagement can have more than one assigned manager.

Any assigned manager may approve a submitted timesheet. Approval from one authorized manager is sufficient to change the selectedentries to Approved.

Once an entry has been approved by one manager, other managers must see the entry as Approved and must not be able to approve it again.

## 5.2 Engagement List

When an authorized manager opens:

Plain Text

​[![](https://engagements.topcoder.com/favicon.png)Topcoder Top Technology Talent On-Demand](https://engagements.topcoder.com/timesheets)Open

the system must display all engagements for which the user has timesheet approval authority.

The list must include:

|     |     |
| --- | --- |
| Field | Description |
| Engagement Title | Name of the engagement |
| Assignee Name | Member name with Topcoder handle |
| Action | View button |

If an engagement has multiple assignees, each assignee may be displayed as a separate record.

## 5.3 View Submitted Timesheets

When the manager clicks **View**, open the timesheet page for the selected engagement and assignee.

The page must display the same engagement information and timesheet columns available in the member view. However, the date range selector must initially be replaced by a Status dropdown.

Status options:

*   Pending Approval (Default)

*   Approved


When **Pending Approval** is selected:

*   Display all timesheet entries submitted by the member that are awaiting approval.

*   Provide a checkbox for each submitted row.

*   Allow the manager to select one or more entries for approval.


## 5.4 Timesheet Approval

When one or more rows are selected, display:

*   Total Selected Days

*   Total Selected Hours

*   Approve button with the number of selected rows


Example:

Total Days: 5

Total Hours: 42.5

Approve (5)

When the manager clicks **Approve (5)**, display a confirmation dialog containing:

*   Number of selected entries

*   Total hours

*   A text input box for approval comments

*   Cancel button

*   Approve button


Suggested confirmation message:

> You are about to approve 5 timesheet entries totaling 42.5 hours. Please enter an approval comment and confirm the action.

After approval:

*   The selected entries must change to Approved.

*   The manager’s name and handle must be recorded.

*   Approval date and time must be recorded.

*   Approval comments must be stored.

*   The approved entries must immediately become read-only for the member.

*   The approved hours must become eligible for payment processing.


## 5.5 Viewing Approved Timesheets

When the manager selects **Approved** from the Status dropdown:

*   Display From Date and To Date fields.

*   Allow the manager to select a date range.

*   Display approved timesheet entries within that date range.

*   Approved records must be read-only.

*   Display the approving manager, approval date, and approval comments.


Managers must be able to view entries approved by any authorized manager assigned to the engagement, not only entries they approved personally.

- - -

# 6\. Administrator Timesheet View

## 6.1 Engagement List

When an administrator opens:

​[![](https://engagements.topcoder.com/favicon.png)Topcoder Top Technology Talent On-Demand](https://engagements.topcoder.com/timesheets)Open

the system must display all engagements that are eligible for timesheet management.

The list must include:

|     |     |
| --- | --- |
| Field | Description |
| Engagement Title | Name of the engagement |
| Assignee | Assigned member’s name and handle |
| Timesheet Status | Pending Approval or Approved |
| Action | View button |

Administrators should be able to search and filter records by:

*   Engagement title

*   Assignee

*   Manager

*   Timesheet status

*   Date range


## 6.2 Administrator Permissions

Administrators must have permission to:

*   View all timesheet entries.

*   Create or update unsubmitted entries.

*   Edit submitted entries.

*   Approve submitted entries.

*   Reopen approved entries.

*   Correct approved hours or remarks.

*   Submit entries on behalf of a member.

*   Approve entries on behalf of a manager.

*   Assign or remove engagement managers.

*   Override member or manager actions when operationally required.


All administrator overrides must:

*   Require an override reason.

*   Record the administrator’s identity.

*   Record the date and time.

*   Preserve the previous value and status.

*   Be included in the audit history.


## 6.3 Manager Assignment

Provide an **Add Manager** option in the engagement details section of the administrator timesheet page.

Administrators must be able to:

*   Search for a manager by Topcoder handle.

*   Assign one or more managers.

*   Remove an assigned manager.

*   View all currently assigned managers.


The system must prevent duplicate manager assignments.

- - -

# 7\. Work App Manager Synchronization

Add a new **Managers** field in:

Work App → Engagement Assignees

The field must support the assignment of one or more manager handles.

Manager information must be synchronized between:

*   Engagements Portal Timesheet page

*   Work App Engagement Assignees view


Synchronization must work in both directions:

*   A manager added or removed in the Engagements Portal must be reflected in the Work App.

*   A manager added or removed in the Work App must be reflected in the Engagements Portal.


The synchronized manager list will determine who has timesheet approval authority.

The system should validate that:

*   The manager handle exists.

*   The manager account is active.

*   The same manager is not assigned more than once.

*   Unauthorized users cannot update manager assignments.


- - -

# 8\. Work App Payment Integration, Phase 2

## 8.1 Objective

After the timesheet workflow is implemented, integrate approved timesheet hours with engagement payment creation in the Work App.

## 8.2 Automatic Hours Population

When creating an engagement payment:

1.  The payment administrator selects a payment date range.

2.  The system retrieves approved timesheet entries for:

    *   The selected engagement

    *   The selected assignee

    *   The selected date range

3.  The system automatically calculates and populates:

    *   Total approved days

    *   Total approved hours

    *   Applicable hourly rate

    *   Calculated payment amount


Only entries with Approved status must be included.

## 8.3 Payment Validation

The system must:

*   Allow payment only against approved timesheet hours.

*   Prevent payment against pending or unsubmitted hours.

*   Prevent the same approved timesheet entry from being paid more than once.

*   Prevent payment hours from exceeding the approved timesheet hours.

*   Retain traceability between the payment, engagement, assignee, and approved timesheet records.


## 8.4 Timesheet Link in Work App

Add a **View Timesheet** link to:

Work App → Engagement Assignees

The link must open the timesheet page for the corresponding engagement and assignee.

Access to the linked page must continue to follow role-based authorization.

- - -

# 9\. Timesheet Status Definitions

|     |     |     |     |
| --- | --- | --- | --- |
| Status | Description | Member Can Edit | Manager Can Approve |
| \-  | Draft or not submitted | Yes | No  |
| Submitted | Submitted and awaiting approval | Yes, but status resets to \- | Yes |
| Approved | Approved by an authorized manager | No  | No  |

If an administrator reopens an Approved entry, the entry should return to \- or another explicitly defined status such as Reopened, based onthe final workflow design.

- - -

# 10\. Notifications (Probably V3)

The system should send email notifications for the following events:

*   Timesheet submitted by a member.

*   Submitted timesheet modified and resubmission required.

*   Timesheet approved by a manager.

*   Manager assigned to an engagement.

*   Approved timesheet reopened or modified by an administrator.


- - -

# 11\. Audit and Security Requirements

The system must maintain an audit trail for:

*   Timesheet creation

*   Submission

*   Editing after submission

*   Resubmission

*   Approval

*   Manager assignment or removal

*   Administrator overrides

*   Payment association


Each audit record must include:

*   Engagement

*   Assignee

*   Timesheet date

*   Previous and updated values

*   Previous and updated statuses

*   User performing the action

*   User role

*   Date and time

*   Comments or override reason, where applicable


Role-based access must ensure that:

*   Members can access only their own timesheets.

*   Managers can access only engagements where they have approval authority.

*   Administrators can access all authorized engagement timesheets.

*   Direct URL manipulation must not provide access to unauthorized timesheets.
