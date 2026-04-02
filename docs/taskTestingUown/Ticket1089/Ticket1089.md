-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1089

UOWN | Origination | Add Campaign Code fields to Merchant Setting page for bulk updates

Synopsis
Currently, in the individual Merchant edit page, there are two fields called peakCampaignId and offPeakCampaignId.
It has been identified that some Merchants have the same codes in these fields, while others have different values.
To streamline work and increase user efficiency, these two fields should also be available for bulk editing in the Merchant Setting page,
which is already designed for mass changes.

Business Objective
Optimize the user workflow by reducing time and manual effort, allowing peakCampaignId and offPeakCampaignId fields to be updated for multiple Merchants at once,
regardless of whether the codes are the same or different.

Feature Request | Business Requirements
Add peakCampaignId and offPeakCampaignId fields to the Merchant Setting page
Allow simultaneous editing of these fields for multiple Merchants.
Ensure fields accept identical or different values without restrictions.
Maintain validation and formatting consistent with the existing individual Merchant edit page.
Ensure changes are applied correctly to all selected Merchants.
Test the bulk update process to prevent errors and ensure data consistency.

I added two new fields to merchantSettings page. We need to guarantee that the form still working, and the new fields is updating the selected merchants correctly.
I also implemented the logic to redirect the user to the previous page when he save/update the merchant in merchant details page. You can test this behavior reimplement please

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2
> ```gherkin
>
> ### Scenario: Bulk update Campaign Codes and validate UI, logs and DB
> When Log in to origination
> And Navigate to merchant settings list page
> When Filter merchants by Sales Rep Code "<salesRepCode>"
> When Select all merchants for bulk update
> And Capture a merchant code from settings list
> And Bulk Peak Campaign Id is set to "<peakCampaignId>" for the selected merchants
> And Bulk Off Peak Campaign Id is set to "<offPeakCampaignId>" for the selected merchants
> And The bulk merchant settings are saved
> And No error toast is shown
> And Open captured merchant by code
> Then Peak Campaign Id should be "<peakCampaignId>"
> And Off Peak Campaign Id should be "<offPeakCampaignId>"
> When Search logs by notes "<filterNotesPeak>" userId "<filterUserId>" type "<filterLogTypes>"
> Then Should see log of type "<searchType>" containing "<searchNotes>"
> Then In database, merchant "<properties>" has Campaign Codes peak "<peakCampaignId>" and off peak "<offPeakCampaignId>"
> Then Test is successful
> Examples:
> | env | browser | salesRepCode | peakCampaignId | offPeakCampaignId | filterNotesPeak | filterUserId | filterLogTypes       | searchType           | searchNotes    | filterUserId | filterLogTypes       | searchType           | searchNotes       |
> | qa2 | chrome  | 270092       | 1001           | 2002              | peakCampaignId  | manager      | MERCHANT_DATA_CHANGE | MERCHANT_DATA_CHANGE | peakCampaignId | manager      | MERCHANT_DATA_CHANGE | MERCHANT_DATA_CHANGE | offPeakCampaignId |
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
>

>
>
>

>
>
>




> ## Tests in stg
> ```gherkin
>
> ### Scenario: Bulk update Campaign Codes and validate UI, logs and DB
> When Log in to origination
> And Navigate to merchant settings list page
> When Filter merchants by Sales Rep Code "<salesRepCode>"
> When Select all merchants for bulk update
> And Capture a merchant code from settings list
> And Bulk Peak Campaign Id is set to "<peakCampaignId>" for the selected merchants
> And Bulk Off Peak Campaign Id is set to "<offPeakCampaignId>" for the selected merchants
> And The bulk merchant settings are saved
> And No error toast is shown
> And Open captured merchant by code
> Then Peak Campaign Id should be "<peakCampaignId>"
> And Off Peak Campaign Id should be "<offPeakCampaignId>"
> When Search logs by notes "<filterNotesPeak>" userId "<filterUserId>" type "<filterLogTypes>"
> Then Should see log of type "<searchType>" containing "<searchNotes>"
> Then In database, merchant "<properties>" has Campaign Codes peak "<peakCampaignId>" and off peak "<offPeakCampaignId>"
> Then Test is successful
> Examples:
> | env | browser | salesRepCode | peakCampaignId | offPeakCampaignId | filterNotesPeak | filterUserId | filterLogTypes       | searchType           | searchNotes    | filterUserId | filterLogTypes       | searchType           | searchNotes       |
> | stg | chrome  | 270092       | 1001           | 2002              | peakCampaignId  | manager      | MERCHANT_DATA_CHANGE | MERCHANT_DATA_CHANGE | peakCampaignId | manager      | MERCHANT_DATA_CHANGE | MERCHANT_DATA_CHANGE | offPeakCampaignId |
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
>

>
>
>

>
>
>
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_AddCampaignCodeFieldsToMerchantSettingsPageForBulkUpdates_Ticket1089