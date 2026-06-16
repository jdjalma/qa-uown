
```gherkin
Background:
  Given I am logged in to the Origination portal as an admin
  And I am on the Merchants page
```

**Presence in the Config Columns panel**

```gherkin
Scenario: The new GDS fields appear as selectable options in the Config Columns panel
  When I open the Config Columns panel
  Then "UW Pipeline" is listed as a selectable column option
  And "Fraud Threshold" is listed as a selectable column option
  And "Max Approval Amount" is listed as a selectable column option
```

**Table display - new column values**

```gherkin
Scenario: New columns show empty cells for a merchant with no GDS Data configured
  Given "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" are enabled as visible columns via Config Columns
  And a merchant exists with no values set for UW Pipeline, Fraud Threshold, or Max Approval Amount in GDS Data
  When I view the merchants table
  Then the UW Pipeline, Fraud Threshold, and Max Approval Amount cells for that merchant are empty

Scenario: Enabling the new columns displays GDS Data values for merchants that have them configured
  Given "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" are enabled as visible columns via Config Columns
  And merchant "terraceFinance" has UW Pipeline, Fraud Threshold, and Max Approval Amount configured in GDS Data
  When I view the merchants table
  Then the row for "terraceFinance" shows the UW Pipeline, Fraud Threshold, and Max Approval Amount values matching its GDS Data configuration
```

**Export - new column values**

```gherkin
Scenario: The exported file contains the correct GDS Data values when the new columns are manually selected
  Given the columns "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" are selected in Config Columns
  And at least one merchant has known GDS Data values for those fields
  When I export the merchants list
  Then the exported file includes the "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" columns
  And the values in those columns match the GDS Data configuration stored for each merchant
```

**Auto-default for Active merchants export**

```gherkin
Scenario: GDS columns are automatically included when exporting Inactive merchants without manual selection
  Given "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" have not been manually selected in Config Columns
  When I export Inactive merchants
  Then the exported file contains the "UW Pipeline", "Fraud Threshold", or "Max Approval Amount" columns

Scenario: UW Pipeline, Fraud Threshold, and Max Approval Amount are included by default when exporting Active merchants
  Given "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" have not been manually selected in Config Columns
  When I export Active merchants
  Then the exported file contains the "UW Pipeline", "Fraud Threshold", and "Max Approval Amount" columns
  And those three columns display the corresponding GDS Data values for each Active merchant in the file
```

**Regression - existing Config Columns options**

```gherkin
Scenario: All existing Config Columns options remain present and selectable after the new fields are added
  When I open the Config Columns panel
  Then all column options that were available before this change are still listed
  And each pre-existing option remains selectable without errors

Scenario: Enabling a pre-existing Config Column still applies it to the merchants table
  Given a pre-existing column is currently not displayed in the merchants table
  When I enable that column via Config Columns
  Then that column appears in the merchants table with values populated for the visible merchant rows
```

---