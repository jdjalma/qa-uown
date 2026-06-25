# Servicing — Documents Page — BDD Scenarios

> **Portal:** Servicing (`/documents/{accountPk}`)
> **Source:** `servicing/pages/documents/[account].tsx` · `components/document-information/index.tsx` · `utils/data-table-columns.tsx`
> **Status:** Draft (pending live UI validation via MCP)
> **Created:** 2026-06-25

---

## Feature: Visualização da lista de documentos

```gherkin
Feature: Servicing Documents Page — Documents List

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"

  Scenario: Page loads showing the Documents table
    When the page finishes loading
    Then I see the heading "Documents"
    And I see a search input with placeholder "Search table"
    And I see the button "ADD NEW"
    And I see the documents table with columns:
      | Date | Type | File Name | Link Used Count | Payment Made | Description |
    And the table is sorted by Date in descending order by default

  Scenario: Table shows all documents for the account
    When the page finishes loading
    Then the documents table displays all documents associated with account 17301
    And each row shows: Date, Type, File Name, Link Used Count, Payment Made, Description, and action icons

  Scenario: Table displays Payment Made with visual indicator
    Given the account has documents with payment status
    When the page finishes loading
    Then rows where Payment Made is true show a green checkmark icon
    And rows where Payment Made is false show a red X icon
    And rows where Payment Made has no value show a dash "-"

  Scenario: File Name is truncated on desktop for long names
    Given the account has a document with a file name longer than 30 characters
    When the page finishes loading
    Then the File Name cell displays the first 30 characters followed by "..."
    And the full file name is accessible via the HTML title attribute of the cell

  Scenario: Table paginates at 10 rows per page
    Given the account has more than 10 documents
    When the page finishes loading
    Then the table shows 10 rows on the first page
    And pagination controls are visible at the bottom of the table

  Scenario: Empty state when account has no documents
    Given I navigate to the documents page of an account with no documents
    When the page finishes loading
    Then the table shows the message "There are no records to display"
    And the ADD NEW button is still visible

  Scenario: Link Used Count shows dash when null
    Given the account has a document with no link used count recorded
    When the page finishes loading
    Then the Link Used Count cell shows "-" for that row

  Scenario: Description falls back to Subject when Description is empty
    Given the account has a document with no description but a subject value
    When the page finishes loading
    Then the Description cell displays the subject value for that row
```

---

## Feature: Pesquisa e filtro de documentos

```gherkin
Feature: Servicing Documents Page — Search and Filter

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"
    And the documents table has loaded with multiple rows

  Scenario: Filter by document type narrows the table
    When I type "LEASE" in the search input
    Then only rows where Type contains "LEASE" are displayed
    And rows that do not match are hidden

  Scenario: Filter by partial file name
    When I type "Lease Agr" in the search input
    Then only rows whose file name contains "Lease Agr" are displayed

  Scenario: Filter by formatted date string
    When I type "06/15/2026" in the search input
    Then only rows with a Date matching "06/15/2026" are displayed

  Scenario: Filter is case-insensitive
    When I type "driverslicense" in the search input
    Then rows with Type "DRIVERSLICENSE" are displayed

  Scenario: Clearing the filter restores the full list
    Given I have typed "LEASE" in the search input and the list is filtered
    When I clear the search input
    Then all document rows are displayed again

  Scenario: Filter with no matching results shows empty state
    When I type "ZZZNOMATCH" in the search input
    Then the table shows the message "There are no records to display"
```

---

## Feature: Upload de novo documento

```gherkin
Feature: Servicing Documents Page — Upload Document

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"
    And the documents table has loaded

  Scenario: ADD NEW button opens the Upload Document modal
    When I click the "ADD NEW" button
    Then the modal "Attach/Upload Documents" is displayed
    And I see the field "Document Type" as a required select
    And I see the field "Attach Document" as a required file input
    And I see the field "Description" as an optional textarea
    And I see the field "Visible to Borrower" as a required select with options "True" and "False"
    And I see the button "ADD DOCUMENT"

  Scenario: Document Type dropdown shows all valid types
    When I click the "ADD NEW" button
    And I open the Document Type dropdown
    Then I see the options:
      | DRIVERSLICENSE |
      | PAYSTUB        |
      | BANKSTATEMENT  |
      | SIGNEDPOD      |
      | CORRESPONDENCE |
      | LEASE          |

  Scenario: Upload succeeds with all required fields filled
    When I click "ADD NEW"
    And I select document type "LEASE"
    And I attach a valid PDF file smaller than 24 MB
    And I fill in description "Signed lease agreement"
    And I select Visible to Borrower "True"
    And I click "ADD DOCUMENT"
    Then the modal closes
    And the new document appears in the table
    And the document row shows type "LEASE" and description "Signed lease agreement"

  Scenario: Upload is rejected when no file is selected
    When I click "ADD NEW"
    And I select document type "PAYSTUB"
    And I do not attach any file
    And I click "ADD DOCUMENT"
    Then I see the error message "Please upload a file before submitting the request"
    And the modal remains open

  Scenario: Upload is rejected when file exceeds 24 MB
    When I click "ADD NEW"
    And I select document type "BANKSTATEMENT"
    And I attach a file larger than 24 MB
    And I click "ADD DOCUMENT"
    Then I see the error message "Maximum File Size Allowed is 24 MB"
    And the modal remains open

  Scenario: Upload is rejected when Document Type is not selected
    When I click "ADD NEW"
    And I do not select a document type
    And I attach a valid PDF file
    And I click "ADD DOCUMENT"
    Then I see the validation error "File type is required."
    And the modal remains open

  Scenario: Closing the Upload modal without submitting discards changes
    When I click "ADD NEW"
    And I select document type "LEASE"
    And I close the modal
    Then the modal is dismissed
    And no new row is added to the table
```

---

## Feature: Edição de documento existente

```gherkin
Feature: Servicing Documents Page — Edit Document

  Background:
    Given I am logged in to the Servicing portal with "edit_document" permission
    And I navigate to "/documents/17301"
    And the documents table has loaded with at least one document

  Scenario: Edit icon is visible for users with edit_document permission
    When the table loads
    Then each row shows the edit (pencil) icon in the actions column

  Scenario: Edit icon is NOT visible for users without edit_document permission
    Given I am logged in without "edit_document" permission
    When the table loads
    Then no row shows the edit icon in the actions column

  Scenario: Clicking the edit icon opens the Edit Document modal
    When I click the edit icon on the first document row
    Then the modal "Edit Documents" is displayed
    And the field "Document Type" is pre-filled with the current document type
    And the field "Description" is pre-filled with the current description
    And the field "Visible to Borrower" is pre-filled with the current visibility setting
    And I see the button "SAVE"

  Scenario: Editing Document Type updates the row
    Given the Edit Document modal is open for a document of type "PAYSTUB"
    When I change Document Type to "CORRESPONDENCE"
    And I click "SAVE"
    Then I see the toast "Updated the Document successfully"
    And the modal closes
    And the document row now shows type "CORRESPONDENCE"

  Scenario: Editing Description updates the row
    Given the Edit Document modal is open for a document
    When I change the description to "Updated description text"
    And I click "SAVE"
    Then I see the toast "Updated the Document successfully"
    And the document row now shows description "Updated description text"

  Scenario: Editing Visible to Borrower updates the record
    Given the Edit Document modal is open for a document with Visible to Borrower "False"
    When I change Visible to Borrower to "True"
    And I click "SAVE"
    Then I see the toast "Updated the Document successfully"

  Scenario: Document Type is required in the Edit modal
    Given the Edit Document modal is open
    When I clear the Document Type field
    And I click "SAVE"
    Then I see the validation error "File type is required."
    And the modal remains open

  Scenario: Closing the Edit modal without saving discards changes
    Given the Edit Document modal is open with a document type "PAYSTUB"
    When I change the type to "LEASE"
    And I close the modal
    Then the modal is dismissed
    And the document row still shows type "PAYSTUB"
```

---

## Feature: Reenvio de documento

```gherkin
Feature: Servicing Documents Page — Resend Document

  Background:
    Given I am logged in to the Servicing portal with "resend_stored_doc" permission
    And I navigate to "/documents/17301"
    And the documents table has loaded

  Scenario: Resend icon is visible only for documents with an email queue or e-sign link
    When the table loads
    Then the resend icon is visible only on rows that have an associated email queue or e-sign document
    And rows without an email queue or e-sign document do not show the resend icon

  Scenario: Resend icon is NOT visible for users without resend_stored_doc permission
    Given I am logged in without "resend_stored_doc" permission
    When the table loads
    Then no row shows the resend icon in the actions column

  Scenario: Clicking the resend icon opens the Resend Document modal
    When I click the resend icon on an eligible document row
    Then the modal "Please verify or update the email" is displayed
    And the email field is pre-filled with the customer's primary email address
    And I see the button "SEND"

  Scenario: Resend succeeds with a valid email address
    Given the Resend modal is open with the primary email pre-filled
    When I click "SEND"
    Then I see the toast "Document has been resent successfully"
    And the modal closes

  Scenario: Resend with a custom email address
    Given the Resend modal is open
    When I clear the email field
    And I type "custom@example.com"
    And I click "SEND"
    Then I see the toast "Document has been resent successfully"
    And the modal closes

  Scenario: Resend is rejected when the email field is empty
    Given the Resend modal is open
    When I clear the email field
    And I click "SEND"
    Then I see the validation error "Please enter the email you wish to send document to"
    And the modal remains open

  Scenario: Resend is rejected with an invalid email format
    Given the Resend modal is open
    When I clear the email field
    And I type "not-a-valid-email"
    And I click "SEND"
    Then I see the validation error "Please enter a valid email"
    And the modal remains open

  Scenario: Closing the Resend modal without sending cancels the action
    Given the Resend modal is open
    When I close the modal
    Then the modal is dismissed
    And no resend request is sent
```

---

## Feature: Download de documento

```gherkin
Feature: Servicing Documents Page — Download Document

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"
    And the documents table has loaded with at least one document

  Scenario: Download icon is always visible on every row
    When the table loads
    Then every document row shows the download icon in the actions column

  Scenario: Clicking the download icon opens the file in a new tab
    When I click the download icon on a document row
    Then a new browser tab opens
    And the file download begins in that new tab

  Scenario: Download icon tooltip says "Download"
    When I hover over the download icon on a document row
    Then the tooltip "Download" is displayed
```

---

## Feature: Ordenação da tabela

```gherkin
Feature: Servicing Documents Page — Table Sorting

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"
    And the documents table has loaded with multiple rows

  Scenario: Table is sorted by Date descending on initial load
    When the page finishes loading
    Then the most recent document appears first in the table

  Scenario: Clicking the Date column header sorts ascending
    When I click the "Date" column header
    Then the table is sorted by Date in ascending order
    And the oldest document appears first

  Scenario: Clicking the Date column header twice sorts descending
    When I click the "Date" column header twice
    Then the table is sorted by Date in descending order

  Scenario: Clicking the Type column header sorts alphabetically
    When I click the "Type" column header
    Then rows are sorted alphabetically by document type

  Scenario: Clicking the Link Used Count column header sorts numerically
    When I click the "Link Used Count" column header
    Then rows are sorted by link used count in ascending order

  Scenario: Clicking the Payment Made column header groups by payment status
    When I click the "Payment Made" column header
    Then rows are grouped by payment made status (false first, then true)
```

---

## Feature: Paginação da tabela

```gherkin
Feature: Servicing Documents Page — Pagination

  Background:
    Given I am logged in to the Servicing portal
    And I navigate to "/documents/17301"
    And the account has more than 10 documents

  Scenario: Table shows 10 rows per page by default
    When the page finishes loading
    Then exactly 10 document rows are visible

  Scenario: Navigating to next page shows the next set of documents
    When I click the next page button in the pagination controls
    Then the table shows the next set of documents
    And the previously shown documents are no longer visible

  Scenario: Pagination persists after search filter is cleared
    Given I filter the table to show fewer than 10 results
    When I clear the filter
    Then the pagination resets and all documents are paginated at 10 per page
```
