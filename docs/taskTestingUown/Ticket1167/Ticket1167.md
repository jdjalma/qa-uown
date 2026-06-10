-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1167

UOWN | Origination | Create Kornerstone Programs
Aberto
  Tíquete criado 1 semana atrás por Fernando Martins
Aberto
UOWN | Origination | Create Kornerstone Programs
Synopsis
For release R1.47.0, five Kornerstone programs must be created in the system:

KW-16
Standard-12
Release90
Prime-10
KW-Choice
The file provided contains naming guidance and describes the program variations.
KW-16 can also be used as a reference in Sandbox to understand how the program should be configured.

Kornerstone assigns different money factors for different merchants using the same program.
Since our platform defines the money factor at the Merchant Program level, we must create separate program records for the different money factor variations.

Additionally, there must be a service to associate each KS merchant with its corresponding newly created program.
The RetailerID in the file corresponds to the merchantRefCode (KS-retailerId), which determines the association.
After association, previous/old program associations must be removed.

Business Objective
This work ensures that Kornerstone merchants are correctly mapped to their respective programs based on the correct money factor variation.
Creating these 5 programs and establishing the logic for associating each Kornerstone merchant improves accuracy, prevents mismatches in program assignments, and supports Kornerstone-specific operational requirements.

Feature Request | Business Requirements
Create the following 5 Kornerstone programs in the system:

KW-16

Term length: 16 months
  Multiple: 2.0 - 2.3
  Buyout: Some states/retailers get cash price + $100 for 90 days
    Anytime buyout 
      (Early Ownership Price = (Past Due Amounts) + (Remaining Cash Price)
      Remaining Cash Price = (Cash Price) - Total Amount Paid + Lease Fee Paid
      Lease Fee Paid = No of Payments made x (Lease Cost / Number of Payments))
  Initial Payment: Varies by retailer($15-$49)

Standard-12

Term length: 12 months
  Multiple: 2.0 - 2.3
  Buyout: 90 days same as cash(some have a additional early buyout fee)
    Early buyout(after 90 days): varies by state but generally payment of 75% of remaing balance
  Initial Payment: Varies by retailer($15-$49)

Release90

Term length: 3 months
  Multiple: varies from 1.2 - 1.97
  Buyout: no early buyout option
  Initial Payment: $0

Prime-10

Term length: 10 months
  Multiple: varies from 1.5 or 1.75
  Buyout: 
    Within 3 months: Remaing Principal amount + 10%
    After 3 months: Remaining Principal amount
  Initial Payment: $49

KW-Choice

Term length: 16 months
  Multiple: 2.0 - 2.3
  Buyout: 
    3 month: 1.15
    6 month: 1.4
    9 month: 1.65
    12 month: 1.9

    Anytime buyout: 
      (Early Ownership Price = (Past Due Amounts) + (Remaining Cash Price)
      Remaining Cash Price = (Cash Price) - Total Amount Paid + Lease Fee Paid
      Lease Fee Paid = No of Payments made x (Lease Cost / Number of Payments))
  Initial Payment: Varies by retailer($15-$49)

---

Testing Steps
Overview
This feature allows importing merchant-program relationships from Excel files. The service reads Retailer ID, Product Type, and Multiple columns to update merchant-program associations.
Prerequisites

Valid Excel file (.xlsx) with the following columns (in order):

Retailer ID (e.g., 877)
Product Type (e.g., RL90, KW-16, KWC, P10, STD-12)
Months
Multiple (e.g., 1.2746)
Buyout Type
EBO Fee
Is EBO Fee Active
Initial Payment
Initial Payment Required

Test Scenarios
1. Successful Import
Test Case: Import file with valid merchants and programs
curl --location 'https://svc-sandbox.uownleasing.com/uown/importKornerstoneMerchantPrograms' \
--form 'excelFile=@"/path/to/valid-file.xlsx"'

Expected Result:
successfulImports > 0
failedImports = 0 (or minimal)
Programs are associated with merchants in database

Verification:
Check merchant-program associations in database
Verify activity logs created
---
2. Unknown Product Type (Warning)
Test Case: File contains Product Type not in mapping (e.g., PR-24)

Expected Result:
Row added to warnings array
Row not counted as failed
Processing continues for other rows
---
3. Missing Merchant
Test Case: Retailer ID doesn't exist in database (e.g., KS99999)

Expected Result:
Warning added: "Merchant not found with refMerchantCode 'KS99999'"
failedImports incremented
Other rows continue processing
---
4. Missing Program
Test Case: Program name constructed from Product Type + Multiple doesn't exist

Expected Result:
Warning added: "Program not found with name 'Release90-1.2746'"
failedImports incremented
Other rows continue processing
---
5. Skip Logic (Already Associated)
Test Case: Re-import same file where merchant already has the program

Expected Result:
skippedImports > 0
No database operations for skipped rows
No duplicate activity logs

Verification:
Check that skippedImports count matches rows where program already exists
Verify no duplicate associations created
---
6. Invalid File Format
Test Case: Upload non-.xlsx file or empty file

Expected Result:
Error in errors array: "File must be an .xlsx file" or "Excel file is null or empty"
No processing occurs
---
7. Invalid Data
Test Case: File with missing required columns (Retailer ID, Product Type, Multiple)

Expected Result:
Errors added for rows with missing data
failedImports incremented
Valid rows still processed

Response Structure
{
  "totalRowsProcessed": 100,
  "successfulImports": 95,
  "failedImports": 3,
  "skippedImports": 2,
  "errors": [
    "Row 5: Retailer ID is required",
    "Row 10: Invalid Retailer ID format: ABC"
  ],
  "warnings": [
    "Row 15: Merchant not found with refMerchantCode 'KS999'",
    "Row 20: Program not found with name 'Release90-1.5'",
    "Row 25: Unknown Product Type 'PR-24'. Valid types: RL90, KW-16, KWC, P10, STD-12"
  ]
}
---
8. Postman Collection for Programs
{
	"info": {
		"_postman_id": "2d3c8984-a648-4c61-bca0-dd9cec59f4da",
		"name": "KS Programs",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "26957464"
	},
	"item": [
		{
			"name": "KLEVERWISE-16",
			"item": [
				{
					"name": "KW-16-2",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KW-16-2\",\r\n    \"moneyFactor\": 0.125,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Kleverwise\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-16-2\",    \"moneyFactor\": 0.125,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Kleverwise\"}'"
					},
					"response": []
				},
				{
					"name": "KW-16-2.1",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KW-16-2.1\",\r\n    \"moneyFactor\": 0.13125,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Kleverwise\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-16-2.1\",    \"moneyFactor\": 0.13125,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Kleverwise\"}'"
					},
					"response": []
				},
				{
					"name": "KW-16-2.25",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KW-16-2.25\",\r\n    \"moneyFactor\": 0.140625,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Kleverwise\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-16-2.25\",    \"moneyFactor\": 0.140625,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Kleverwise\"}'"
					},
					"response": []
				},
				{
					"name": "KW-16-2.3",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KW-16-2.3\",\r\n    \"moneyFactor\": 0.14375,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Kleverwise\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-16-2.3\",    \"moneyFactor\": 0.14375,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Kleverwise\"}'"
					},
					"response": []
				}
			]
		},
		{
			"name": "KW-CHOICE",
			"item": [
				{
					"name": "KWC-2",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KWC-2\",\r\n    \"moneyFactor\": 0.125,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-KWChoice\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-Choice-2\",    \"moneyFactor\": 0.125,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-KWChoice\"}'"
					},
					"response": []
				},
				{
					"name": "KWC-2.25",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KWC-2.25\",\r\n    \"moneyFactor\": 0.140625,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-KWChoice\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-Choice-2.25\",    \"moneyFactor\": 0.140625,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-KWChoice\"}'"
					},
					"response": []
				},
				{
					"name": "KWC-2.3",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"KWC-2.3\",\r\n    \"moneyFactor\": 0.14375,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 16,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-KWChoice\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"KW-Choice-2.3\",    \"moneyFactor\": 0.14375,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 16,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-KWChoice\"}'"
					},
					"response": []
				}
			]
		},
		{
			"name": "PRIME-10",
			"item": [
				{
					"name": "P10-1.5",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"P10-1.5\",\r\n    \"moneyFactor\": 0.15,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0.1,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 10,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Prime10\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Prime-10-1.5\",    \"moneyFactor\": 0.15,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0.1,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 10,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Prime10\"}'"
					},
					"response": []
				},
				{
					"name": "P10-1.75",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"P10-1.75\",\r\n    \"moneyFactor\": 0.175,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.3,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0.1,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 10,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Prime10\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Prime-10-1.75\",    \"moneyFactor\": 0.175,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.3,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0.1,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 10,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Prime10\"}'"
					},
					"response": []
				}
			]
		},
		{
			"name": "RELEASE-90",
			"item": [
				{
					"name": "RL90-1.2746",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.2746\",\r\n    \"moneyFactor\": 0.31865,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.2746\",    \"moneyFactor\": 0.31865,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.3378",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.3378\",\r\n    \"moneyFactor\": 0.33445,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.3378\",    \"moneyFactor\": 0.33445,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.4041",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.4041\",\r\n    \"moneyFactor\": 0.351025,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.4041\",    \"moneyFactor\": 0.351025,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.4738",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.4738\",\r\n    \"moneyFactor\": 0.36845,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.4738\",    \"moneyFactor\": 0.36845,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.5471",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.5471\",\r\n    \"moneyFactor\": 0.386775,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.5471\",    \"moneyFactor\": 0.386775,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.6",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.6\",\r\n    \"moneyFactor\": 0.4,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.6\",    \"moneyFactor\": 0.4,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.6243",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.6243\",\r\n    \"moneyFactor\": 0.406075,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.6243\",    \"moneyFactor\": 0.406075,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.7056",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.7056\",\r\n    \"moneyFactor\": 0.4264,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.7056\",    \"moneyFactor\": 0.4264,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.7916",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.7916\",\r\n    \"moneyFactor\": 0.4479,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.7916\",    \"moneyFactor\": 0.4479,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				},
				{
					"name": "RL90-1.9788",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"RL90-1.9788\",\r\n    \"moneyFactor\": 0.4947,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 0,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 4,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Release90\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Release90-1.9788\",    \"moneyFactor\": 0.4947,    \"quickPayPct\": 0,    \"payoffDiscount\": 0,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 0,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 4,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Release90\"}'"
					},
					"response": []
				}
			]
		},
		{
			"name": "STANDARD-12",
			"item": [
				{
					"name": "STD-12-2",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"STD-12-2\",\r\n    \"moneyFactor\": 0.166667,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.25,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 12,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Standard12\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Standard-12-2\",    \"moneyFactor\": 0.166667,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.25,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 12,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Standard12\"}'"
					},
					"response": []
				},
				{
					"name": "STD-12-2.1",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"STD-12-2.1\",\r\n    \"moneyFactor\": 0.175,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.25,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 12,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Standard12\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Standard-12-2.1\",    \"moneyFactor\": 0.175,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.25,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 12,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Standard12\"}'"
					},
					"response": []
				},
				{
					"name": "STD-12-2.25",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"STD-12-2.25\",\r\n    \"moneyFactor\": 0.1875,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.25,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 12,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Standard12\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Standard-12-2.25\",    \"moneyFactor\": 0.1875,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.25,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 12,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Standard12\"}'"
					},
					"response": []
				},
				{
					"name": "STD-12-2.3",
					"request": {
						"method": "POST",
						"header": [
							{
								"key": "Content-Type",
								"value": "application/json"
							}
						],
						"body": {
							"mode": "raw",
							"raw": "{\r\n    \"programName\": \"STD-12-2.3\",\r\n    \"moneyFactor\": 0.191667,\r\n    \"quickPayPct\": 0,\r\n    \"payoffDiscount\": 0.25,\r\n    \"chargeAppFeeIfDeliveryIsZero\": false,\r\n    \"dealerDiscount\": 0,\r\n    \"maxDollarAmount\": 0,\r\n    \"dealerRebate\": 0,\r\n    \"epoDays\": 90,\r\n    \"epoFeePercent\": 0,\r\n    \"minCartAmount\": 0,\r\n    \"maxCartAmount\": 0,\r\n    \"termMonths\": 12,\r\n    \"programType\": \"SAME_AS_CASH\",\r\n    \"lendingCategoryType\": \"LTO\",\r\n    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",\r\n    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",\r\n    \"processingFeeOverride\": 0,\r\n    \"amountChargedAtSigning\": 0,\r\n    \"groupName\": \"KS-Standard12\"\r\n}",
							"options": {
								"raw": {
									"language": "json"
								}
							}
						},
						"url": {
							"raw": "{{url}}/uown/createOrUpdateProgram",
							"host": [
								"{{url}}"
							],
							"path": [
								"uown",
								"createOrUpdateProgram"
							]
						},
						"description": "Generated from cURL: curl --location '{{url}}/uown/createOrUpdateProgram' \\--header 'Content-Type: application/json' \\--data '{    \"programName\": \"Standard-12-2.3\",    \"moneyFactor\": 0.191667,    \"quickPayPct\": 0,    \"payoffDiscount\": 0.25,    \"chargeAppFeeIfDeliveryIsZero\": false,    \"dealerDiscount\": 0,    \"maxDollarAmount\": 0,    \"dealerRebate\": 0,    \"epoDays\": 90,    \"epoFeePercent\": 0,    \"minCartAmount\": 0,    \"maxCartAmount\": 0,    \"termMonths\": 12,    \"programType\": \"SAME_AS_CASH\",    \"lendingCategoryType\": \"LTO\",    \"allowedFrequencyOverride\": \"WEEKLY,BI_WEEKLY,MONTHLY\",    \"states\": \"AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY\",    \"processingFeeOverride\": 0,    \"amountChargedAtSigning\": 0,    \"groupName\": \"KS-Standard12\"}'"
					},
					"response": []
				}
			]
		}
	],
	"auth": {
		"type": "apikey",
		"apikey": [
			{
				"key": "value",
				"value": "knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2",
				"type": "string"
			},
			{
				"key": "key",
				"value": "Authorization",
				"type": "string"
			}
		]
	},
	"event": [
		{
			"listen": "prerequest",
			"script": {
				"type": "text/javascript",
				"packages": {},
				"requests": {},
				"exec": [
					""
				]
			}
		},
		{
			"listen": "test",
			"script": {
				"type": "text/javascript",
				"packages": {},
				"requests": {},
				"exec": [
					""
				]
			}
		}
	]
}
---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 5 arquivos
+
326
−
0
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

db/rep
‎ository‎

MerchantProg
‎ramRepo.java‎
+2 -0

pojo
‎/rest‎

KornerstoneMerchantPr
‎ogramImportResult.java‎
+35 -0

re
‎st‎

AdminContr
‎oller.java‎
+14 -0

ser
‎vice‎

ExcelFileS
‎ervice.java‎
+107 -0

KornerstoneMerchantPro
‎gramImportService.java‎
+168 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantProgramRepo.java 
+
2
−
0

Visualizado
@@ -14,6 +14,8 @@ public interface MerchantProgramRepo extends JpaRepository<MerchantProgram, Long

    Optional<MerchantProgram> findByProgramInfo_ProgramId(String programId);

    Optional<MerchantProgram> findByProgramInfo_ProgramName(String programName);

    @Query(value = "select m.* from uown_merchant_program m " +
        "join uown_los_lead l on l.merchant_program_pk = m.pk " +
        "where l.pk = :leadPk ", nativeQuery = true)
 src/main/java/com/uownleasing/svc/pojo/rest/KornerstoneMerchantProgramImportResult.java  0 → 100644
+
35
−
0

Visualizado
package com.uownleasing.svc.pojo.rest;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KornerstoneMerchantProgramImportResult {
    private int totalRowsProcessed;
    private int successfulImports;
    private int failedImports;
    private int skippedImports;
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public void addError(String error) {
        if (error != null && !error.isEmpty()) {
            this.errors.add(error);
        }
    }

    public void addWarning(String warning) {
        if (warning != null && !warning.isEmpty()) {
            this.warnings.add(warning);
        }
    }
}
 src/main/java/com/uownleasing/svc/rest/AdminController.java 
+
14
−
0

Visualizado
@@ -29,6 +29,7 @@ import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Nullable;
import javax.validation.constraints.Positive;
import java.io.IOException;
import java.math.*;
import java.util.*;
import java.util.stream.Collectors;
@@ -50,6 +51,8 @@ public class AdminController {

    private final MerchantProgramService merchantProgramService;

    private final KornerstoneMerchantProgramImportService kornerstoneMerchantProgramImportService;

    private final UpdateProgramsService updateProgramsService;

    private final StateConfigurationsService stateConfigurationsService;
@@ -265,6 +268,17 @@ public class AdminController {
        }
    }

    @PostMapping(value = "/importKornerstoneMerchantPrograms", consumes = {"multipart/form-data"})
    public KornerstoneMerchantProgramImportResult importKornerstoneMerchantPrograms(@RequestParam("excelFile") @Nullable MultipartFile excelFile) {
        try {
            return kornerstoneMerchantProgramImportService.importKornerstoneMerchantProgramsFromExcel(excelFile);
        } catch (IOException e) {
            KornerstoneMerchantProgramImportResult result = new KornerstoneMerchantProgramImportResult();
            result.addError("Error reading Excel file: " + e.getMessage());
            return result;
        }
    }

    @PostMapping(value="/createOrUpdateProgram")
    public MerchantProgram addProgramToMerchant(@RequestBody ProgramInfo programInfo){
        return merchantProgramService.createOrUpdate(programInfo);

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
KSPrograms_1.xlsx:

Retailer ID	Product Type	Months	Multiple	Buyout type	EBO fee	is EBO fee active	InitialPayment	InitialPaymentRequired
877	STD-12	12	2.25	Traditional	10	1	40	1
911	KW-16	16	2.25	Kleverwise	100	1	49	1
921	STD-12	12	2.25	Traditional	0	1	39	1
926	STD-12	12	2.3	Traditional	50	1	49	1
927	STD-12	12	2.3	Traditional	50	1	49	1
928	KW-16	16	2.3	Kleverwise	100	1	49	1
946	STD-12	12	2.25	Traditional	0	1	39	1
947	STD-12	12	2.25	Traditional	0	1	49	1
981	KW-16	16	2.3	Kleverwise	100	1	49	1
995	STD-12	12	2.25	Traditional	0	1	39	1
998	STD-12	12	2.25	Traditional	0	1	39	1
1002	STD-12	12	2.25	Traditional	0	1	39	1
1011	KW-16	16	2.25	Kleverwise	100	1	49	1
1045	STD-12	12	2.25	Traditional	0	1	49	1
1046	STD-12	12	2.25	Traditional	0	1	25	1
1069	KW-16	16	2.25	Kleverwise	0	0	49	1
1084	KW-16	16	2.3	Kleverwise	100	1	49	1
1099	KW-16	16	2.3	Kleverwise	100	1	49	1
1104	STD-12	12	2.3	Traditional	0	0	49	1
1124	STD-12	12	2.3	Traditional	0	0	49	1
1151	STD-12	12	2.25	Traditional	0	1	39	1
1161	STD-12	12	2.25	Traditional	0	1	39	1
1167	KW-16	16	2.3	Kleverwise	100	1	49	1
1174	KW-16	16	2.25	Kleverwise	100	1	49	1
1175	KW-16	16	2.3	Kleverwise	100	1	49	1
1181	KW-16	16	2.3	Kleverwise	100	1	49	1
1182	KW-16	16	2.3	Kleverwise	100	1	49	1
1185	STD-12	12	2.3	Traditional	50	1	49	1
1195	KW-16	16	2.25	Kleverwise	0	0	49	1
1198	STD-12	12	2.3	Traditional	50	1	25	1
1203	KW-16	16	2.25	Kleverwise	100	1	49	1
1205	KW-16	16	2.3	Kleverwise	100	1	49	1
1217	KW-16	16	2.25	Kleverwise	0	0	49	1
1221	STD-12	12	2.25	Traditional	0	1	39	1
1240	STD-12	12	2.25	Traditional	0	1	39	1
1259	KW-16	16	2.25	Kleverwise	100	1	49	1
1267	STD-12	12	2	Traditional	50	1	49	1
1273	STD-12	12	2.3	Traditional	50	1	25	1
1275	STD-12	12	2.3	Traditional	50	1	49	1
1278	KW-16	16	2.25	Kleverwise	100	1	49	1
1282	KW-16	16	2.25	Kleverwise	100	1	49	1
1291	KW-16	16	2.3	Kleverwise	100	1	49	1
1304	KW-16	16	2.3	Kleverwise	100	1	49	1
1312	KW-16	16	2.25	Kleverwise	100	1	49	1
1318	KW-16	16	2.3	Kleverwise	100	1	49	1
1337	KW-16	16	2.25	Kleverwise	100	1	39	1
1339	STD-12	12	2.25	Traditional	0	1	49	1
1340	KW-16	16	2.25	Kleverwise	100	1	49	1
1344	STD-12	12	2.25	Traditional	0	1	39	1
1373	STD-12	12	2.3	Traditional	50	1	49	1
1379	STD-12	12	2.3	Traditional	50	1	39	1
1380	STD-12	12	2.3	Traditional	50	1	49	1
1386	STD-12	12	2.3	Traditional	50	1	49	1
1393	KW-16	16	2.25	Kleverwise	100	1	10	1
1408	STD-12	12	2.3	Traditional	50	1	49	1
1415	KW-16	16	2.3	Kleverwise	100	1	49	1
1425	KW-16	16	2.25	Kleverwise	100	1	49	1
1427	STD-12	12	2.3	Traditional	50	1	49	1
1428	KW-16	16	2.25	Kleverwise	100	1	49	1
1429	STD-12	12	2.3	Traditional	50	1	25	1
1432	KW-16	16	2.25	Kleverwise	100	1	49	1
1438	KW-16	16	2.25	Kleverwise	100	1	49	1
1443	KW-16	16	2.1	Kleverwise	50	1	49	1
1455	KW-16	16	2.25	Kleverwise	0	0	49	1
1458	STD-12	12	2.25	Traditional	0	1	39	1
1460	STD-12	12	2.25	Traditional	0	1	39	1
1461	STD-12	12	2.25	Traditional	0	1	39	1
1462	STD-12	12	2.25	Traditional	0	1	39	1
1463	STD-12	12	2.25	Traditional	0	1	39	1
1465	STD-12	12	2.3	Traditional	50	1	49	1
1468	STD-12	12	2.25	Traditional	100	1	49	1
1478	KW-16	16	2.3	Kleverwise	100	1	49	1
1480	KW-16	16	2.25	Kleverwise	0	0	49	1
1481	STD-12	12	2.25	Traditional	0	1	39	1
1482	STD-12	12	2.25	Traditional	0	1	39	1
1483	STD-12	12	2.25	Traditional	0	1	39	1
1484	STD-12	12	2.25	Traditional	0	1	39	1
1485	STD-12	12	2.25	Traditional	0	1	39	1
1486	STD-12	12	2.25	Traditional	0	1	39	1
1487	STD-12	12	2.25	Traditional	0	1	39	1
1488	STD-12	12	2.25	Traditional	0	1	39	1
1491	KW-16	16	2.3	Kleverwise	100	1	49	1
1493	KW-16	16	2.3	Kleverwise	100	1	49	1
1504	STD-12	12	2.25	Traditional	0	1	39	1
1519	KW-16	16	2.25	Kleverwise	100	1	49	1
1520	KW-16	16	2.3	Kleverwise	100	1	49	1
1525	STD-12	12	2.3	Traditional	50	1	49	1
1547	KW-16	16	2.3	Kleverwise	100	1	39	1
1548	STD-12	12	2.25	Traditional	0	1	39	1
1549	STD-12	12	2.25	Traditional	0	1	39	1
1550	STD-12	12	2.25	Traditional	0	1	39	1
1551	STD-12	12	2.25	Traditional	0	1	39	1
1552	STD-12	12	2.25	Traditional	0	1	39	1
1553	STD-12	12	2.25	Traditional	0	1	39	1
1554	STD-12	12	2.25	Traditional	0	1	39	1
1555	STD-12	12	2.25	Traditional	0	1	39	1
1556	STD-12	12	2.25	Traditional	0	1	39	1
1557	STD-12	12	2.25	Traditional	0	1	39	1
1558	STD-12	12	2.25	Traditional	0	1	39	1
1559	STD-12	12	2.25	Traditional	0	1	39	1
1560	STD-12	12	2.25	Traditional	0	1	39	1
1561	STD-12	12	2.25	Traditional	0	1	39	1
1562	STD-12	12	2.25	Traditional	0	1	39	1
1563	STD-12	12	2.25	Traditional	0	1	39	1
1564	STD-12	12	2.25	Traditional	0	1	39	1
1565	STD-12	12	2.25	Traditional	0	1	39	1
1566	STD-12	12	2.25	Traditional	0	1	39	1
1567	STD-12	12	2.25	Traditional	0	1	39	1
1568	STD-12	12	2.25	Traditional	0	1	39	1
1569	STD-12	12	2.25	Traditional	0	1	39	1
1620	STD-12	12	2.3	Traditional	50	1	49	1
1627	STD-12	12	2.3	Traditional	50	1	49	1
1629	STD-12	12	2.3	Traditional	50	1	49	1
1630	KW-16	16	2.25	Kleverwise	100	1	49	1
1644	KW-16	16	2.3	Kleverwise	100	1	49	1
1647	KW-16	16	2.3	Kleverwise	100	1	49	1
1662	KW-16	16	2.25	Kleverwise	100	1	49	1
1663	KW-16	16	2.25	Kleverwise	100	1	49	1
1671	STD-12	12	2.3	Traditional	50	1	49	1
1675	KW-16	16	2.25	Kleverwise	100	1	49	1
1678	STD-12	12	2.25	Traditional	0	1	39	1
1694	KW-16	16	2.25	Kleverwise	100	1	49	1
1719	KW-16	16	2.25	Kleverwise	0	0	49	1
1724	STD-12	12	2.25	Traditional	0	1	39	1
1739	STD-12	12	2.25	Traditional	0	1	39	1
1746	STD-12	12	2.25	Traditional	0	1	39	1
1769	STD-12	12	2.25	Traditional	0	1	39	1
1771	KW-16	16	2.25	Kleverwise	100	1	37.73	1
1779	KW-16	16	2.3	Kleverwise	100	1	49	1
1787	KW-16	16	2.3	Kleverwise	100	1	49	1
1794	KW-16	16	2.25	Kleverwise	100	1	49	1
1796	STD-12	12	2.25	Traditional	0	1	39	1
1797	STD-12	12	2.25	Traditional	0	1	39	1
1811	KW-16	16	2	Kleverwise	100	1	49	1
1816	KW-16	16	2.3	Kleverwise	0	0	49	1
1822	KW-16	16	2.3	Kleverwise	50	1	49	1
1824	KW-16	16	2.3	Kleverwise	100	1	49	1
1828	KW-16	16	2.3	Kleverwise	0	0	49	1
1833	KW-16	16	2.3	Kleverwise	100	1	49	1
1834	KWC	16	2.3	KWChoice	100	1	49	1
1835	KWC	16	2.3	KWChoice	100	1	49	1
1836	KWC	16	2.3	KWChoice	100	1	49	1
1843	KW-16	16	2.25	Kleverwise	100	1	49	1
1846	KW-16	16	2	Kleverwise	100	1	49	1
1849	KW-16	16	2.25	Kleverwise	100	1	49	1
1869	KW-16	16	2.3	Kleverwise	100	1	59	1
1881	KW-16	16	2.25	Kleverwise	100	1	49	1
1885	STD-12	12	2.25	Traditional	0	1	39	1
1889	KW-16	16	2.3	Kleverwise	100	1	49	1
1890	KW-16	16	2.25	Kleverwise	100	1	49	1
1892	KW-16	16	2.25	Kleverwise	100	1	49	1
1896	KW-16	16	2.3	Kleverwise	100	1	49	1
1898	KW-16	16	2	Kleverwise	100	1	49	1
1906	KW-16	16	2	Kleverwise	100	1	25	1
1909	STD-12	12	2	Traditional	50	1	39	1
1912	KW-16	16	2.3	Kleverwise	100	1	49	1
1914	KW-16	16	2.25	Kleverwise	100	1	49	1
1915	KW-16	16	2.3	Kleverwise	100	1	49	1
1917	KW-16	16	2	Kleverwise	100	1	49	1
1918	KW-16	16	2	Kleverwise	100	1	49	1
1919	KW-16	16	2	Kleverwise	100	1	49	1
1920	KW-16	16	2	Kleverwise	100	1	49	1
1921	KW-16	16	2	Kleverwise	100	1	49	1
1922	KW-16	16	2	Kleverwise	100	1	49	1
1923	KW-16	16	2.3	Kleverwise	100	1	49	1
1925	KW-16	16	2.25	Kleverwise	100	1	49	1
1930	KWC	16	2.3	KWChoice	100	1	49	1
1941	STD-12	12	2.3	Traditional	50	1	49	1
1943	KW-16	16	2	Kleverwise	100	1	49	1
1944	KW-16	16	2	Kleverwise	100	1	49	1
1945	KW-16	16	2	Kleverwise	100	1	49	1
1946	KW-16	16	2	Kleverwise	100	1	49	1
1947	KW-16	16	2	Kleverwise	100	1	49	1
1948	KW-16	16	2	Kleverwise	100	1	49	1
1949	STD-12	12	2.3	Traditional	50	1	49	1
1951	KW-16	16	2.25	Kleverwise	100	1	49	1
1958	STD-12	12	2.3	Traditional	0	0	49	1
1962	KW-16	16	2.25	Kleverwise	100	1	49	1
1965	KW-16	16	2.3	Kleverwise	100	1	49	1
1968	STD-12	12	2.3	Traditional	50	1	49	1
1969	STD-12	12	2.3	Traditional	50	1	49	1
1981	KW-16	16	2.25	Kleverwise	100	1	49	1
1987	KW-16	16	2.25	Kleverwise	100	1	49	1
2009	KW-16	16	2.3	Kleverwise	100	1	49	1
2015	KW-16	16	2.1	Kleverwise	50	1	49	1
2020	STD-12	12	2.25	Traditional	25	1	25	1
2021	KW-16	16	2.3	Kleverwise	100	1	49	1
2022	STD-12	12	2.25	Traditional	0	1	39	1
2036	KWC	16	2.3	KWChoice	100	1	49	1
2053	KW-16	16	2.3	Kleverwise	100	1	49	1
2056	KWC	16	2.3	KWChoice	100	1	49	1
2066	KW-16	16	2.25	Kleverwise	100	1	49	1
2068	KW-16	16	2	Kleverwise	100	1	49	1
2075	KW-16	16	2.3	Kleverwise	100	1	49	1
2076	STD-12	12	2.25	Traditional	25	1	25	1
2078	KW-16	16	2.3	Kleverwise	100	1	49	1
2079	KW-16	16	2.3	Kleverwise	100	1	49	1
2080	KW-16	16	2.3	Kleverwise	100	1	49	1
2092	STD-12	12	2.25	Traditional	0	1	39	1
2094	KW-16	16	2.25	Kleverwise	0	0	49	1
2097	KW-16	16	2.25	Kleverwise	0	0	49	1
2102	STD-12	12	2.3	Traditional	50	1	49	1
2106	KWC	16	2.3	KWChoice	100	1	49	1
2113	KW-16	16	2.25	Kleverwise	100	1	49	1
2120	KW-16	16	2.25	Kleverwise	100	1	49	1
2126	STD-12	12	2	Traditional	50	1	39	1
2129	KWC	16	2.3	KWChoice	100	1	49	1
2133	KW-16	16	2.3	Kleverwise	100	1	49	1
2136	STD-12	12	2	Traditional	50	1	39	1
2139	STD-12	12	2.3	Traditional	50	1	49	1
2141	KW-16	16	2.3	Kleverwise	100	1	49	1
2142	KW-16	16	2.25	Kleverwise	100	1	49	1
2144	KW-16	16	2.25	Kleverwise	100	1	49	1
2145	STD-12	12	2	Traditional	50	1	39	1
2149	KW-16	16	2	Kleverwise	100	1	49	1
2151	STD-12	12	2	Traditional	50	1	39	1
2154	STD-12	12	2.3	Traditional	50	1	25	1
2155	KW-16	16	2.3	Kleverwise	100	1	49	1
2157	STD-12	12	2.3	Traditional	50	1	49	1
2160	KWC	16	2.3	KWChoice	100	1	49	1
2162	KW-16	16	2.25	Kleverwise	100	1	49	1
2165	KW-16	16	2	Kleverwise	100	1	49	1
2173	STD-12	12	2	Traditional	50	1	39	1
2188	KW-16	16	2.25	Kleverwise	100	1	49	1
2201	KWC	16	2.3	KWChoice	100	1	49	1
2204	KW-16	16	2.25	Kleverwise	100	1	49	1
2209	KW-16	16	2.3	Kleverwise	100	1	39	1
2214	KW-16	16	2.1	Kleverwise	50	1	49	1
2224	KW-16	16	2.25	Kleverwise	100	1	49	1
2233	STD-12	12	2.25	Traditional	0	1	39	1
2245	STD-12	12	2.3	Traditional	50	1	49	1
2254	KW-16	16	2.3	Kleverwise	100	1	49	1
2265	KW-16	16	2.25	Kleverwise	0	1	49	1
2292	KW-16	16	2.25	Kleverwise	100	1	49	1
2294	STD-12	12	2.25	Traditional	0	1	39	1
2295	STD-12	12	2	Traditional	50	1	39	1
2331	KW-16	16	2.3	Kleverwise	100	1	49	1
2372	KW-16	16	2.3	Kleverwise	100	1	49	1
2384	KW-16	16	2.25	Kleverwise	0	0	49	1
2387	KW-16	16	2.3	Kleverwise	100	1	49	1
2395	KW-16	16	2	Kleverwise	100	1	49	1
2400	KW-16	16	2.25	Kleverwise	100	1	49	1
2401	KW-16	16	2.3	Kleverwise	100	1	49	1
2406	KW-16	16	2.25	Kleverwise	100	1	49	1
2407	KW-16	16	2.3	Kleverwise	100	1	49	1
2415	KW-16	16	2.25	Kleverwise	100	1	49	1
2419	KW-16	16	2.25	Kleverwise	100	1	49	1
2423	KW-16	16	2.3	Kleverwise	100	1	49	1
2426	KW-16	16	2.3	Kleverwise	100	1	49	1
2429	KW-16	16	2.25	Kleverwise	100	1	49	1
2446	KW-16	16	2.3	Kleverwise	100	1	49	1
2457	STD-12	12	2.3	Traditional	50	1	49	1
2460	KW-16	16	2.3	Kleverwise	100	1	25	1
2467	KW-16	16	2.25	Kleverwise	100	1	49	1
2471	KW-16	16	2.25	Kleverwise	100	1	49	1
2488	KW-16	16	2.3	Kleverwise	100	1	49	1
2489	KW-16	16	2.3	Kleverwise	100	1	49	1
2506	STD-12	12	2.3	Traditional	50	1	49	1
2507	STD-12	12	2.3	Traditional	50	1	49	1
2519	KW-16	16	2.1	Kleverwise	50	1	49	1
2524	KW-16	16	2.25	Kleverwise	100	1	49	1
2525	KW-16	16	2.25	Kleverwise	100	1	49	1
2527	KW-16	16	2.25	Kleverwise	100	1	49	1
2536	STD-12	12	2.25	Traditional	0	1	39	1
2542	STD-12	12	2.25	Traditional	0	1	39	1
2545	KW-16	16	2	Kleverwise	100	1	49	1
2547	STD-12	12	2.25	Traditional	0	1	39	1
2553	STD-12	12	2.3	Traditional	50	1	49	1
2559	KW-16	16	2.25	Kleverwise	100	1	49	1
2566	KW-16	16	2.3	Kleverwise	100	1	49	1
2567	KWC	16	2.3	KWChoice	100	1	49	1
2570	KW-16	16	2	Kleverwise	100	1	49	1
2571	STD-12	12	2.3	Traditional	50	1	49	1
2594	KW-16	16	2.25	Kleverwise	0	0	49	1
2596	STD-12	12	2.3	Traditional	50	1	49	1
2598	STD-12	12	2.3	Traditional	50	1	49	1
2602	KWC	16	2.3	KWChoice	100	1	49	1
2609	KWC	16	2.3	KWChoice	100	1	49	1
2610	KW-16	16	2.25	Kleverwise	100	1	49	1
2615	KW-16	16	2.1	Kleverwise	50	1	49	1
2624	STD-12	12	2	Traditional	50	1	39	1
2640	STD-12	12	2.25	Traditional	0	1	39	1
2648	KW-16	16	2.25	Kleverwise	100	1	49	1
2650	KW-16	16	2.25	Kleverwise	100	1	49	1
2654	KW-16	16	2.3	Kleverwise	0	0	49	1
2656	KW-16	16	2.3	Kleverwise	100	1	49	1
2657	KW-16	16	2.3	Kleverwise	100	1	49	1
2659	KW-16	16	2.3	Kleverwise	100	1	49	1
2660	KW-16	16	2.3	Kleverwise	100	1	49	1
2661	KW-16	16	2.3	Kleverwise	100	1	49	1
2662	KW-16	16	2.3	Kleverwise	100	1	49	1
2663	KW-16	16	2.3	Kleverwise	100	1	49	1
2664	KW-16	16	2.3	Kleverwise	100	1	49	1
2665	KW-16	16	2.3	Kleverwise	100	1	49	1
2671	KW-16	16	2.3	Kleverwise	100	1	49	1
2694	KW-16	16	2.25	Kleverwise	100	1	49	1
2696	KW-16	16	2.25	Kleverwise	100	1	49	1
2703	KW-16	16	2	Kleverwise	100	1	49	1
2704	KW-16	16	2	Kleverwise	100	1	49	1
2705	KW-16	16	2.3	Kleverwise	100	1	49	1
2707	KWC	16	2.3	KWChoice	100	1	49	1
2711	KW-16	16	2.3	Kleverwise	100	1	49	1
2712	STD-12	12	2.3	Traditional	50	1	49	1
2732	KW-16	16	2	Kleverwise	100	1	49	1
2733	KW-16	16	2.25	Kleverwise	100	1	49	1
2738	KW-16	16	2.25	Kleverwise	100	1	49	1
2739	KW-16	16	2.25	Kleverwise	100	1	49	1
2740	KW-16	16	2.25	Kleverwise	100	1	49	1
2741	KW-16	16	2.25	Kleverwise	100	1	49	1
2744	STD-12	12	2.3	Traditional	50	1	49	1
2748	KW-16	16	2.3	Kleverwise	100	1	49	1
2753	KW-16	16	2.25	Kleverwise	100	1	49	1
2757	KW-16	16	2.25	Kleverwise	100	1	49	1
2766	KW-16	16	2	Kleverwise	50	1	25	1
2794	KW-16	16	2.3	Kleverwise	100	1	49	1
2797	KWC	16	2.3	KWChoice	50	1	5	1
2799	KW-16	16	2.3	Kleverwise	100	1	49	1
2805	KW-16	16	2.3	Kleverwise	100	1	49	1
2816	KW-16	16	2.3	Kleverwise	100	1	49	1
2821	KW-16	16	2.25	Kleverwise	100	1	49	1
2837	STD-12	12	2.3	Traditional	50	1	39	1
2840	KW-16	16	2.3	Kleverwise	100	1	49	1
2846	KW-16	16	2.3	Kleverwise	100	1	49	1
2847	KWC	16	2.3	KWChoice	100	1	49	1
2849	KW-16	16	2.3	Kleverwise	100	1	49	1
2855	STD-12	12	2.3	Traditional	50	1	49	1
2856	KW-16	16	2	Kleverwise	100	1	49	1
2857	KW-16	16	2.3	Kleverwise	100	1	49	1
2859	KW-16	16	2.3	Kleverwise	100	1	49	1
2869	KW-16	16	2.3	Kleverwise	100	1	49	1
2871	KW-16	16	2.25	Kleverwise	100	1	49	1
2876	KW-16	16	2.3	Kleverwise	100	1	49	1
2882	STD-12	12	2.3	Traditional	50	1	39	1
2893	KW-16	16	2.3	Kleverwise	100	1	49	1
2900	P10	10	1.5	Prime10	0	0	49	1
2903	KW-16	16	2.25	Kleverwise	0	0	49	1
2904	STD-12	12	2.25	Traditional	0	1	49	1
2909	STD-12	12	2.3	Traditional	50	1	49	1
2911	KW-16	16	2.25	Kleverwise	100	1	49	1
2913	KW-16	16	2.3	Kleverwise	100	1	49	1
2918	KW-16	16	2.25	Kleverwise	100	1	49	1
2921	KW-16	16	2.25	Kleverwise	100	1	49	1
2923	STD-12	12	2	Traditional	50	1	39	1
2925	KWC	16	2.3	KWChoice	100	1	49	1
2926	KW-16	16	2.3	Kleverwise	100	1	39	1
2956	KW-16	16	2	Kleverwise	100	1	49	1
2962	STD-12	12	2.3	Traditional	50	1	49	1
2963	STD-12	12	2.3	Traditional	50	1	25	1
2976	KW-16	16	2.3	Kleverwise	100	1	49	1
2977	KW-16	16	2.25	Kleverwise	100	1	49	1
2978	KW-16	16	2.3	Kleverwise	100	1	49	1
2979	STD-12	12	2.3	Traditional	50	1	49	1
2988	STD-12	12	2.25	Traditional	0	1	39	1
2991	STD-12	12	2.3	Traditional	50	1	49	1
2992	KW-16	16	2	Kleverwise	100	1	49	1
2993	KW-16	16	2.3	Kleverwise	100	1	49	1
3000	STD-12	12	2.3	Traditional	50	1	49	1
3008	KW-16	16	2.25	Kleverwise	100	1	49	1
3010	KW-16	16	2	Kleverwise	100	1	49	1
3012	STD-12	12	2.3	Traditional	50	1	49	1
3015	KW-16	16	2.25	Kleverwise	100	1	49	1
3023	STD-12	12	2.25	Traditional	0	1	39	1
3028	KW-16	16	2.3	Kleverwise	100	1	49	1
3029	KW-16	16	2.3	Kleverwise	100	1	49	1
3037	STD-12	12	2.3	Traditional	50	1	49	1
3067	KW-16	16	2.3	Kleverwise	100	1	49	1
3069	KW-16	16	2.25	Kleverwise	100	1	49	1
3072	STD-12	12	2	Traditional	50	1	39	1
3076	KW-16	16	2.25	Kleverwise	100	1	49	1
3081	STD-12	12	2.3	Traditional	50	1	49	1
3083	KW-16	16	2.25	Kleverwise	100	1	49	1
3087	KW-16	16	2.3	Kleverwise	100	1	49	1
3088	KW-16	16	2.25	Kleverwise	100	1	49	1
3089	STD-12	12	2.3	Traditional	50	1	49	1
3099	KW-16	16	2.25	Kleverwise	100	1	49	1
3115	KW-16	16	2.25	Kleverwise	0	0	49	1
3116	KW-16	16	2.25	Kleverwise	100	1	49	1
3117	STD-12	12	2.3	Traditional	50	1	49	1
3124	STD-12	12	2.25	Traditional	0	1	39	1
3125	STD-12	12	2.25	Traditional	0	1	39	1
3128	KW-16	16	2.25	Kleverwise	100	1	49	1
3132	KW-16	16	2	Kleverwise	100	1	49	1
3137	STD-12	12	2.25	Traditional	10	1	40	1
3145	STD-12	12	2.25	Traditional	0	1	39	1
3153	KW-16	16	2.3	Kleverwise	100	1	49	1
3159	KW-16	16	2.25	Kleverwise	100	1	49	1
3167	STD-12	12	2.25	Traditional	0	1	39	1
3169	KW-16	16	2	Kleverwise	100	1	49	1
3176	KW-16	16	2.25	Kleverwise	100	1	49	1
3181	KW-16	16	2.25	Kleverwise	100	1	49	1
3185	KW-16	16	2.25	Kleverwise	100	1	40	1
3192	STD-12	12	2.25	Traditional	0	1	39	1
3208	STD-12	12	2.25	Traditional	0	1	39	1
3209	KWC	16	2.3	KWChoice	100	1	49	1
3210	KW-16	16	2.3	Kleverwise	100	1	49	1
3213	STD-12	12	2.25	Traditional	0	1	49	1
3214	KW-16	16	2.25	Kleverwise	100	1	49	1
3217	KW-16	16	2	Kleverwise	100	1	49	1
3223	KW-16	16	2.3	Kleverwise	100	1	99	1
3227	KW-16	16	2	Kleverwise	50	1	25	1
3231	KW-16	16	2.25	Kleverwise	100	1	49	1
3232	STD-12	12	2.25	Traditional	0	1	39	1
3235	KW-16	16	2.25	Kleverwise	100	1	49	1
3241	STD-12	12	2.25	Traditional	0	1	39	1
3242	KW-16	16	2.25	Kleverwise	100	1	49	1
3245	KW-16	16	2.25	Kleverwise	100	1	49	1
3251	KW-16	16	2.25	Kleverwise	100	1	49	1
3253	STD-12	12	2.3	Traditional	50	1	49	1
3256	KW-16	16	2	Kleverwise	100	1	49	1
3258	KWC	16	2.3	KWChoice	100	1	49	1
3259	STD-12	12	2.25	Traditional	0	1	39	1
3263	KW-16	16	2	Kleverwise	0	1	49	1
3277	KW-16	16	2.3	Kleverwise	100	1	49	1
3286	KW-16	16	2.3	Kleverwise	100	1	49	1
3289	KW-16	16	2	Kleverwise	100	1	49	1
3294	KW-16	16	2.3	Kleverwise	100	1	49	1
3305	KW-16	16	2.25	Kleverwise	100	1	25	1
3308	STD-12	12	2	Traditional	0	1	4	1
3310	KW-16	16	2.25	Kleverwise	100	1	49	1
3316	KW-16	16	2.3	Kleverwise	100	1	49	1
3317	STD-12	12	2.3	Traditional	50	1	49	1
3319	KW-16	16	2.25	Kleverwise	100	1	49	1
3320	STD-12	12	2.3	Traditional	50	1	49	1
3326	KW-16	16	2.25	Kleverwise	100	1	49	1
3332	STD-12	12	2.25	Traditional	0	1	39	1
3336	KW-16	16	2.3	Kleverwise	100	1	49	1
3337	KW-16	16	2.3	Kleverwise	100	1	49	1
3339	KW-16	16	2.3	Kleverwise	100	1	49	1
3340	KW-16	16	2.25	Kleverwise	100	1	49	1
3359	STD-12	12	2.3	Traditional	50	1	49	1
3392	KW-16	16	2.3	Kleverwise	100	1	49	1
3394	STD-12	12	2.3	Traditional	50	1	39	1
3395	STD-12	12	2.3	Traditional	50	1	39	1
3396	KW-16	16	2.25	Kleverwise	100	1	49	1
3397	KW-16	16	2	Kleverwise	100	1	49	1
3398	KW-16	16	2.3	Kleverwise	100	1	10	1
3404	STD-12	12	2.25	Traditional	0	1	39	1
3408	KW-16	16	2.3	Kleverwise	100	1	49	1
3411	KW-16	16	2.3	Kleverwise	100	1	39	1
3412	KW-16	16	2.3	Kleverwise	100	1	49	1
3426	STD-12	12	2.25	Traditional	0	1	39	1
3431	KW-16	16	2.25	Kleverwise	100	1	49	1
3438	KW-16	16	2.3	Kleverwise	100	1	49	1
3440	KW-16	16	2.3	Kleverwise	100	1	49	1
3445	KW-16	16	2.25	Kleverwise	100	1	49	1
3449	KW-16	16	2.25	Kleverwise	100	1	49	1
3452	STD-12	12	2	Traditional	50	1	39	1
3461	KW-16	16	2.25	Kleverwise	100	1	49	1
3468	STD-12	12	2.3	Traditional	50	1	49	1
3472	KW-16	16	2.25	Kleverwise	100	1	49	1
3473	KW-16	16	2.25	Kleverwise	100	1	49	1
3474	KW-16	16	2.3	Kleverwise	100	1	49	1
3475	STD-12	12	2.3	Traditional	50	1	49	1
3480	KW-16	16	2.25	Kleverwise	100	1	49	1
3483	KW-16	16	2.25	Kleverwise	100	1	49	1
3486	KW-16	16	2.3	Kleverwise	100	1	49	1
3487	KW-16	16	2.25	Kleverwise	100	1	49	1
3498	KWC	16	2.3	KWChoice	100	1	49	1
3503	KW-16	16	2.25	Kleverwise	100	1	49	1
3505	KW-16	16	2.25	Kleverwise	100	1	49	1
3508	KW-16	16	2.25	Kleverwise	100	1	49	1
3509	KW-16	16	2.25	Kleverwise	0	0	49	1
3513	KW-16	16	2.25	Kleverwise	100	1	49	1
3519	KW-16	16	2.25	Kleverwise	100	1	49	1
3520	KW-16	16	2.3	Kleverwise	100	1	49	1
3522	KW-16	16	2	Kleverwise	100	1	49	1
3526	KW-16	16	2.3	Kleverwise	100	1	49	1
3529	KW-16	16	2.25	Kleverwise	100	1	49	1
3538	STD-12	12	2.25	Traditional	0	1	39	1
3546	STD-12	12	2.3	Traditional	0	0	49	1
3548	STD-12	12	2.3	Traditional	50	1	49	1
3552	KW-16	16	2	Kleverwise	100	1	49	1
3570	KW-16	16	2.25	Kleverwise	100	1	49	1
3578	KW-16	16	2.25	Kleverwise	100	1	49	1
3583	KW-16	16	2.25	Kleverwise	100	1	49	1
3592	STD-12	12	2.25	Traditional	0	1	39	1
3594	STD-12	12	2.25	Traditional	0	1	39	1
3603	STD-12	12	2.3	Traditional	50	1	49	1
3619	KW-16	16	2.3	Kleverwise	100	1	49	1
3620	KW-16	16	2.3	Kleverwise	100	1	49	1
3631	KW-16	16	2.3	Kleverwise	100	1	49	1
3633	STD-12	12	2.25	Traditional	0	1	39	1
3639	KW-16	16	2.25	Kleverwise	100	1	49	1
3641	KW-16	16	2.25	Kleverwise	0	0	49	1
3650	KW-16	16	2.3	Kleverwise	100	1	49	1
3655	KW-16	16	2.25	Kleverwise	100	1	49	1
3662	STD-12	12	2.25	Traditional	0	1	39	1
3667	KW-16	16	2	Kleverwise	100	1	49	1
3669	STD-12	12	2.3	Traditional	50	1	39	1
3672	KW-16	16	2.3	Kleverwise	100	1	49	1
3683	KW-16	16	2	Kleverwise	50	1	49	1
3695	KW-16	16	2.25	Kleverwise	100	1	49	1
3696	KW-16	16	2.25	Kleverwise	100	1	49	1
3703	KWC	16	2.3	KWChoice	100	1	49	1
3717	KW-16	16	2.25	Kleverwise	100	1	49	1
3723	STD-12	12	2.3	Traditional	50	1	49	1
3727	STD-12	12	2.3	Traditional	50	1	39	1
3729	STD-12	12	2.3	Traditional	50	1	49	1
3738	KW-16	16	2.25	Kleverwise	100	1	49	1
3743	KWC	16	2.3	KWChoice	100	1	49	1
3749	KW-16	16	2.3	Kleverwise	100	1	49	1
3751	STD-12	12	2.3	Traditional	50	1	49	1
3752	STD-12	12	2.3	Traditional	50	1	49	1
3756	KW-16	16	2.3	Kleverwise	100	1	49	1
3757	KW-16	16	2.3	Kleverwise	100	1	50	1
3769	STD-12	12	2.3	Traditional	50	1	49	1
3778	KW-16	16	2.25	Kleverwise	100	1	49	1
3782	KW-16	16	2.25	Kleverwise	100	1	49	1
3783	KW-16	16	2.25	Kleverwise	100	1	10	1
3785	KW-16	16	2	Kleverwise	100	1	49	1
3787	STD-12	12	2.3	Traditional	50	1	49	1
3789	KW-16	16	2.3	Kleverwise	100	1	49	1
3798	STD-12	12	2.3	Traditional	50	1	49	1
3808	KW-16	16	2.25	Kleverwise	100	1	49	1
3809	STD-12	12	2.3	Traditional	50	1	49	1
3811	STD-12	12	2.3	Traditional	50	1	49	1
3816	KW-16	16	2.25	Kleverwise	100	1	49	1
3817	KW-16	16	2.25	Kleverwise	100	1	49	1
3823	KW-16	16	2	Kleverwise	100	1	49	1
3824	STD-12	12	2.3	Traditional	50	1	25	1
3831	KW-16	16	2.25	Kleverwise	100	1	49	1
3834	KW-16	16	2.25	Kleverwise	100	1	49	1
3842	KW-16	16	2.25	Kleverwise	100	1	49	1
3843	STD-12	12	2.3	Traditional	50	1	39	1
3844	KW-16	16	2.3	Kleverwise	100	1	49	1
3845	KW-16	16	2.3	Kleverwise	100	1	49	1
3856	KW-16	16	2.3	Kleverwise	100	1	49	1
3860	KW-16	16	2.3	Kleverwise	100	1	49	1
3862	KW-16	16	2.3	Kleverwise	100	1	49	1
3868	KWC	16	2.3	KWChoice	100	1	49	1
3880	KW-16	16	2.25	Kleverwise	100	1	49	1
3881	KW-16	16	2.25	Kleverwise	100	1	49	1
3893	KW-16	16	2.25	Kleverwise	100	1	49	1
3894	STD-12	12	2.3	Traditional	50	1	39	1
3905	KW-16	16	2.25	Kleverwise	100	1	49	1
3910	STD-12	12	2.3	Traditional	50	1	49	1
3911	KW-16	16	2.25	Kleverwise	100	1	49	1
3912	STD-12	12	2.3	Traditional	50	1	49	1
3918	STD-12	12	2.3	Traditional	50	1	49	1
3920	KW-16	16	2.25	Kleverwise	100	1	49	1
3924	KW-16	16	2.25	Kleverwise	100	1	49	1
3927	KW-16	16	2.25	Kleverwise	0	0	49	1
3945	STD-12	12	2.25	Traditional	0	1	39	1
3952	KW-16	16	2.25	Kleverwise	100	1	49	1
3955	KW-16	16	2.3	Kleverwise	100	1	49	1
3958	STD-12	12	2.3	Traditional	50	1	49	1
3959	STD-12	12	2.3	Traditional	50	1	49	1
3961	STD-12	12	2.3	Traditional	50	1	49	1
3966	KW-16	16	2.25	Kleverwise	100	1	49	1
3967	KW-16	16	2.1	Kleverwise	50	1	49	1
3970	STD-12	12	2	Traditional	50	1	49	1
3971	STD-12	12	2	Traditional	50	1	49	1
3976	STD-12	12	2	Traditional	50	1	49	1
3995	STD-12	12	2.3	Traditional	50	1	39	1
3996	KW-16	16	2.3	Kleverwise	50	1	25	1
3997	KW-16	16	2.3	Kleverwise	100	1	49	1
3998	STD-12	12	2.25	Traditional	10	1	40	1
4002	STD-12	12	2.3	Traditional	50	1	49	1
4003	STD-12	12	2.3	Traditional	50	1	49	1
4016	KW-16	16	2.3	Kleverwise	100	1	49	1
4021	STD-12	12	2.3	Traditional	50	1	49	1
4025	KW-16	16	2.3	Kleverwise	100	1	49	1
4037	KW-16	16	2.25	Kleverwise	100	1	40	1
4041	STD-12	12	2.3	Traditional	50	1	49	1
4052	KW-16	16	2.3	Kleverwise	100	1	49	1
4056	KW-16	16	2.25	Kleverwise	100	1	49	1
4058	STD-12	12	2.3	Traditional	50	1	49	1
4059	KW-16	16	2.25	Kleverwise	100	1	49	1
4060	KW-16	16	2.25	Kleverwise	100	1	49	1
4065	KW-16	16	2.3	Kleverwise	100	1	49	1
4074	KW-16	16	2.25	Kleverwise	100	1	49	1
4075	KW-16	16	2.25	Kleverwise	100	1	49	1
4093	KW-16	16	2.25	Kleverwise	0	0	39	1
4094	STD-12	12	2.3	Traditional	50	1	49	1
4107	KW-16	16	2.25	Kleverwise	0	0	39	1
4110	KW-16	16	2.3	Kleverwise	100	1	49	1
4115	KW-16	16	2.3	Kleverwise	100	1	49	1
4121	KW-16	16	2.25	Kleverwise	100	1	49	1
4122	KW-16	16	2	Kleverwise	100	1	49	1
4123	KW-16	16	2.3	Kleverwise	100	1	49	1
4133	KW-16	16	2.3	Kleverwise	100	1	49	1
4134	KW-16	16	2.25	Kleverwise	100	1	49	1
4143	KW-16	16	2.3	Kleverwise	100	1	49	1
4145	KW-16	16	2.25	Kleverwise	100	1	49	1
4146	STD-12	12	2.3	Traditional	50	1	49	1
4155	STD-12	12	2.3	Traditional	50	1	49	1
4162	KW-16	16	2.3	Kleverwise	100	1	49	1
4169	STD-12	12	2.3	Traditional	50	1	49	1
4177	KW-16	16	2.25	Kleverwise	100	1	49	1
4179	KWC	16	2.3	KWChoice	100	1	49	1
4182	STD-12	12	2	Traditional	50	1	39	1
4183	KW-16	16	2.3	Kleverwise	100	1	49	1
4184	STD-12	12	2	Traditional	50	1	39	1
4186	STD-12	12	2.3	Traditional	50	1	49	1
4188	KW-16	16	2.25	Kleverwise	100	1	49	1
4196	KW-16	16	2.3	Kleverwise	100	1	49	1
4198	STD-12	12	2.3	Traditional	50	1	49	1
4200	KW-16	16	2.25	Kleverwise	100	1	49	1
4202	STD-12	12	2.25	Traditional	0	1	39	1
4211	STD-12	12	2.3	Traditional	50	1	49	1
4212	STD-12	12	2.3	Traditional	50	1	49	1
4237	KW-16	16	2.25	Kleverwise	100	1	49	1
4242	KW-16	16	2.25	Kleverwise	100	1	49	1
4243	KW-16	16	2.25	Kleverwise	100	1	49	1
4256	KWC	16	2.3	KWChoice	100	1	49	1
4259	STD-12	12	2	Traditional	50	1	49	1
4264	KW-16	16	2.25	Kleverwise	100	1	49	1
4267	KW-16	16	2.3	Kleverwise	50	1	40	1
4271	KW-16	16	2.25	Kleverwise	100	1	49	1
4281	KW-16	16	2.3	Kleverwise	100	1	49	1
4356	STD-12	12	2	Traditional	50	1	49	1
4358	STD-12	12	2	Traditional	50	1	49	1
4359	STD-12	12	2	Traditional	50	1	49	1
4362	STD-12	12	2.3	Traditional	50	1	49	1
4365	KW-16	16	2.3	Kleverwise	100	1	49	1
4377	KW-16	16	2.25	Kleverwise	100	1	49	1
4378	KW-16	16	2.25	Kleverwise	100	1	49	1
4387	STD-12	12	2.3	Traditional	50	1	49	1
4389	STD-12	12	2.3	Traditional	50	1	49	1
4392	KW-16	16	2.3	Kleverwise	100	1	49	1
4396	STD-12	12	2.25	Traditional	0	1	39	1
4409	STD-12	12	2.25	Traditional	0	1	39	1
4411	STD-12	12	2.25	Traditional	0	1	39	1
4415	STD-12	12	2.25	Traditional	0	1	39	1
4416	KW-16	16	2.25	Kleverwise	100	1	49	1
4417	KW-16	16	2.25	Kleverwise	100	1	49	1
4432	KW-16	16	2.25	Kleverwise	100	1	49	1
4449	STD-12	12	2.25	Traditional	0	1	39	1
4450	STD-12	12	2.25	Traditional	0	1	39	1
4490	KW-16	16	2.25	Kleverwise	100	1	49	1
4491	KWC	16	2.3	KWChoice	100	1	49	1
4495	STD-12	12	2.25	Traditional	0	1	39	1
4497	KW-16	16	2.3	Kleverwise	100	1	49	1
4524	KWC	16	2.3	KWChoice	100	1	49	1
4535	KW-16	16	2.3	Kleverwise	100	1	49	1
4538	STD-12	12	2.3	Traditional	50	1	49	1
4546	KW-16	16	2.3	Kleverwise	100	1	49	1
4551	KW-16	16	2.25	Kleverwise	0	0	49	1
4555	STD-12	12	2.25	Traditional	0	1	39	1
4557	STD-12	12	2.3	Traditional	50	1	49	1
4558	KW-16	16	2.25	Kleverwise	100	1	49	1
4566	STD-12	12	2	Traditional	50	1	39	1
4578	STD-12	12	2.3	Traditional	50	1	49	1
4582	KWC	16	2.3	KWChoice	100	1	49	1
4583	KW-16	16	2.25	Kleverwise	100	1	49	1
4597	KW-16	16	2	Kleverwise	100	1	49	1
4600	KWC	16	2.3	KWChoice	100	1	49	1
4601	KW-16	16	2	Kleverwise	100	1	49	1
4602	KW-16	16	2.25	Kleverwise	100	1	49	1
4603	KW-16	16	2	Kleverwise	100	1	49	1
4604	KW-16	16	2	Kleverwise	100	1	49	1
4621	KWC	16	2.3	KWChoice	100	1	49	1
4622	KW-16	16	2.25	Kleverwise	100	1	49	1
4623	KWC	16	2.3	KWChoice	100	1	49	1
4624	KW-16	16	2	Kleverwise	100	1	49	1
4626	STD-12	12	2	Traditional	50	1	39	1
4635	KW-16	16	2	Kleverwise	100	1	49	1
4639	KW-16	16	2.3	Kleverwise	100	1	49	1
4643	KW-16	16	2.3	Kleverwise	100	1	49	1
4647	KW-16	16	2.3	Kleverwise	100	1	49	1
4662	STD-12	12	2.3	Traditional	50	1	49	1
4663	STD-12	12	2.25	Traditional	0	1	39	1
4670	KW-16	16	2.3	Kleverwise	100	1	49	1
4673	KW-16	16	2.3	Kleverwise	100	1	49	1
4674	KW-16	16	2	Kleverwise	100	1	49	1
4675	STD-12	12	2.3	Traditional	50	1	49	1
4676	KW-16	16	2.3	Kleverwise	100	1	49	1
4683	KW-16	16	2	Kleverwise	100	1	49	1
4686	STD-12	12	2.25	Traditional	0	1	39	1
4687	KW-16	16	2.3	Kleverwise	100	1	49	1
4695	KW-16	16	2.3	Kleverwise	100	1	49	1
4696	KW-16	16	2.25	Kleverwise	100	1	49	1
4701	STD-12	12	2.3	Traditional	50	1	49	1
4703	KW-16	16	2.3	Kleverwise	100	1	49	1
4704	STD-12	12	2.3	Traditional	50	1	49	1
4708	STD-12	12	2.3	Traditional	50	1	49	1
4714	KW-16	16	2.3	Kleverwise	0	0	9	1
4727	KW-16	16	2.25	Kleverwise	100	1	49	1
4731	STD-12	12	2.3	Traditional	50	1	49	1
4732	KW-16	16	2.3	Kleverwise	100	1	49	1
4733	KW-16	16	2.3	Kleverwise	100	1	49	1
4736	KW-16	16	2.25	Kleverwise	100	1	49	1
4740	STD-12	12	2	Traditional	50	1	49	1
4746	STD-12	12	2	Traditional	50	1	39	1
4747	STD-12	12	2.25	Traditional	10	1	40	1
4754	STD-12	12	2.3	Traditional	50	1	49	1
4772	KW-16	16	2.3	Kleverwise	100	1	49	1
4783	KW-16	16	2.3	Kleverwise	100	1	49	1
4791	STD-12	12	2.25	Traditional	0	1	39	1
4796	KW-16	16	2.3	Kleverwise	100	1	49	1
4800	KW-16	16	2.3	Kleverwise	100	1	49	1
4807	STD-12	12	2.3	Traditional	50	1	49	1
4809	STD-12	12	2.3	Traditional	50	1	49	1
4838	KW-16	16	2.3	Kleverwise	100	1	49	1
4847	KW-16	16	2.3	Kleverwise	100	1	49	1
4852	STD-12	12	2.3	Traditional	50	1	49	1
4857	KW-16	16	2.25	Kleverwise	100	1	49	1
4858	STD-12	12	2.25	Traditional	0	1	39	1
4868	KW-16	16	2.3	Kleverwise	100	1	49	1
4876	KW-16	16	2.25	Kleverwise	100	1	49	1
4884	KW-16	16	2.25	Kleverwise	100	1	49	1
4915	KW-16	16	2.3	Kleverwise	100	1	99	1
4917	KW-16	16	2	Kleverwise	100	1	49	1
4941	STD-12	12	2.25	Traditional	10	1	40	1
4944	KW-16	16	2.3	Kleverwise	100	1	49	1
4945	KW-16	16	2.3	Kleverwise	100	1	49	1
4963	KW-16	16	2.3	Kleverwise	100	1	49	1
4967	STD-12	12	2.3	Traditional	50	1	49	1
4971	KWC	16	2.3	KWChoice	100	1	49	1
4978	KW-16	16	2.25	Kleverwise	0	1	39	1
4980	KW-16	16	2.3	Kleverwise	100	1	49	1
4988	STD-12	12	2.3	Traditional	50	1	49	1
4994	STD-12	12	2.3	Traditional	50	1	49	1
4996	KW-16	16	2.3	Kleverwise	100	1	49	1
4997	STD-12	12	2.3	Traditional	50	1	49	1
5004	KW-16	16	2.3	Kleverwise	100	1	49	1
5007	KW-16	16	2.3	Kleverwise	100	1	49	1
5014	STD-12	12	2.25	Traditional	0	1	39	1
5016	KW-16	16	2.25	Kleverwise	0	0	49	1
5017	STD-12	12	2	Traditional	50	1	49	1
5024	STD-12	12	2.3	Traditional	50	1	49	1
5027	KW-16	16	2.25	Kleverwise	100	1	49	1
5028	KW-16	16	2.25	Kleverwise	100	1	49	1
5029	KW-16	16	2.25	Kleverwise	100	1	49	1
5030	KW-16	16	2.25	Kleverwise	100	1	49	1
5032	KW-16	16	2.25	Kleverwise	100	1	49	1
5033	KW-16	16	2.25	Kleverwise	100	1	49	1
5034	KW-16	16	2.25	Kleverwise	100	1	49	1
5035	KW-16	16	2.25	Kleverwise	100	1	49	1
5036	KW-16	16	2.25	Kleverwise	100	1	49	1
5037	KW-16	16	2.25	Kleverwise	100	1	49	1
5038	KW-16	16	2.25	Kleverwise	100	1	49	1
5039	KW-16	16	2.25	Kleverwise	100	1	49	1
5040	KW-16	16	2.25	Kleverwise	100	1	49	1
5041	KW-16	16	2.25	Kleverwise	100	1	49	1
5042	KW-16	16	2.25	Kleverwise	100	1	49	1
5043	KW-16	16	2.25	Kleverwise	100	1	49	1
5044	KW-16	16	2.25	Kleverwise	100	1	49	1
5045	KW-16	16	2.25	Kleverwise	100	1	49	1
5046	KW-16	16	2.25	Kleverwise	100	1	49	1
5047	KW-16	16	2.25	Kleverwise	100	1	49	1
5048	KW-16	16	2.25	Kleverwise	100	1	49	1
5049	KW-16	16	2.25	Kleverwise	100	1	49	1
5050	KW-16	16	2.25	Kleverwise	100	1	49	1
5051	KW-16	16	2.25	Kleverwise	100	1	49	1
5052	KW-16	16	2.25	Kleverwise	100	1	49	1
5053	KW-16	16	2.25	Kleverwise	100	1	49	1
5054	KW-16	16	2.25	Kleverwise	100	1	49	1
5055	KW-16	16	2.25	Kleverwise	100	1	49	1
5056	KW-16	16	2.25	Kleverwise	100	1	49	1
5057	KW-16	16	2.25	Kleverwise	100	1	49	1
5058	KW-16	16	2.25	Kleverwise	100	1	49	1
5059	KW-16	16	2.25	Kleverwise	100	1	49	1
5060	KW-16	16	2.25	Kleverwise	100	1	49	1
5061	KW-16	16	2.25	Kleverwise	100	1	49	1
5062	KW-16	16	2.25	Kleverwise	100	1	49	1
5063	KW-16	16	2.25	Kleverwise	100	1	49	1
5064	KW-16	16	2.25	Kleverwise	100	1	49	1
5065	KW-16	16	2.25	Kleverwise	100	1	49	1
5066	KW-16	16	2.25	Kleverwise	100	1	49	1
5067	KW-16	16	2.25	Kleverwise	100	1	49	1
5068	KW-16	16	2.25	Kleverwise	100	1	49	1
5069	KW-16	16	2.25	Kleverwise	100	1	49	1
5070	KW-16	16	2.25	Kleverwise	100	1	49	1
5071	KW-16	16	2.25	Kleverwise	100	1	49	1
5072	KW-16	16	2.25	Kleverwise	100	1	49	1
5073	KW-16	16	2.25	Kleverwise	100	1	49	1
5074	KW-16	16	2.25	Kleverwise	100	1	49	1
5075	KW-16	16	2.25	Kleverwise	100	1	49	1
5077	KW-16	16	2.25	Kleverwise	100	1	49	1
5078	KW-16	16	2.25	Kleverwise	100	1	49	1
5079	KW-16	16	2.25	Kleverwise	100	1	49	1
5080	KW-16	16	2.25	Kleverwise	100	1	49	1
5081	KW-16	16	2.25	Kleverwise	100	1	49	1
5082	KW-16	16	2.25	Kleverwise	100	1	49	1
5083	KW-16	16	2.25	Kleverwise	100	1	49	1
5084	KW-16	16	2.25	Kleverwise	100	1	49	1
5085	KW-16	16	2.25	Kleverwise	100	1	49	1
5086	KW-16	16	2.25	Kleverwise	100	1	49	1
5087	KW-16	16	2.25	Kleverwise	100	1	49	1
5088	KW-16	16	2.25	Kleverwise	100	1	49	1
5089	KW-16	16	2.25	Kleverwise	100	1	49	1
5090	KW-16	16	2	Kleverwise	100	1	49	1
5091	KW-16	16	2	Kleverwise	100	1	49	1
5096	KW-16	16	2	Kleverwise	100	1	49	1
5097	KW-16	16	2	Kleverwise	100	1	49	1
5098	KW-16	16	2	Kleverwise	100	1	49	1
5099	KW-16	16	2	Kleverwise	100	1	49	1
5100	KW-16	16	2	Kleverwise	100	1	49	1
5102	KW-16	16	2	Kleverwise	100	1	49	1
5105	KW-16	16	2	Kleverwise	100	1	49	1
5106	KW-16	16	2	Kleverwise	100	1	49	1
5108	KW-16	16	2	Kleverwise	100	1	49	1
5109	KW-16	16	2	Kleverwise	100	1	49	1
5111	KW-16	16	2	Kleverwise	100	1	49	1
5112	KW-16	16	2	Kleverwise	100	1	49	1
5114	KW-16	16	2	Kleverwise	100	1	49	1
5115	KW-16	16	2	Kleverwise	100	1	49	1
5116	KW-16	16	2	Kleverwise	100	1	49	1
5117	KW-16	16	2	Kleverwise	100	1	49	1
5118	KW-16	16	2	Kleverwise	100	1	49	1
5120	KW-16	16	2	Kleverwise	100	1	49	1
5121	KW-16	16	2.3	Kleverwise	100	1	49	1
5122	KW-16	16	2.3	Kleverwise	100	1	49	1
5123	KW-16	16	2.3	Kleverwise	100	1	49	1
5125	KW-16	16	2.3	Kleverwise	100	1	49	1
5126	KW-16	16	2.3	Kleverwise	100	1	49	1
5127	KW-16	16	2.3	Kleverwise	100	1	49	1
5128	KW-16	16	2.3	Kleverwise	100	1	49	1
5129	KW-16	16	2.3	Kleverwise	100	1	49	1
5130	KW-16	16	2.3	Kleverwise	100	1	49	1
5131	KW-16	16	2.3	Kleverwise	100	1	49	1
5132	KW-16	16	2.3	Kleverwise	100	1	49	1
5133	KW-16	16	2.3	Kleverwise	100	1	49	1
5134	KW-16	16	2.3	Kleverwise	100	1	49	1
5135	KW-16	16	2.25	Kleverwise	100	1	49	1
5136	KW-16	16	2.25	Kleverwise	100	1	49	1
5137	KW-16	16	2.25	Kleverwise	100	1	49	1
5138	KW-16	16	2.25	Kleverwise	100	1	49	1
5139	KW-16	16	2.25	Kleverwise	100	1	49	1
5140	KW-16	16	2.25	Kleverwise	100	1	49	1
5141	KW-16	16	2.25	Kleverwise	100	1	49	1
5142	KW-16	16	2.25	Kleverwise	100	1	49	1
5143	KW-16	16	2.25	Kleverwise	100	1	49	1
5145	KW-16	16	2.25	Kleverwise	100	1	49	1
5146	KW-16	16	2.25	Kleverwise	100	1	49	1
5147	KW-16	16	2.25	Kleverwise	100	1	49	1
5148	KW-16	16	2.25	Kleverwise	100	1	49	1
5149	KW-16	16	2.25	Kleverwise	100	1	49	1
5150	KW-16	16	2.25	Kleverwise	100	1	49	1
5151	KW-16	16	2.25	Kleverwise	100	1	49	1
5152	KW-16	16	2.25	Kleverwise	100	1	49	1
5153	KW-16	16	2.25	Kleverwise	100	1	49	1
5154	KW-16	16	2.25	Kleverwise	100	1	49	1
5155	KW-16	16	2.25	Kleverwise	100	1	49	1
5156	KW-16	16	2.25	Kleverwise	100	1	49	1
5157	KW-16	16	2.25	Kleverwise	100	1	49	1
5158	KW-16	16	2.25	Kleverwise	100	1	49	1
5159	KW-16	16	2.25	Kleverwise	100	1	49	1
5160	KW-16	16	2.25	Kleverwise	100	1	49	1
5161	KW-16	16	2.25	Kleverwise	100	1	49	1
5162	KW-16	16	2.25	Kleverwise	100	1	49	1
5163	KW-16	16	2.25	Kleverwise	100	1	49	1
5164	KW-16	16	2.25	Kleverwise	100	1	49	1
5166	KW-16	16	2.25	Kleverwise	100	1	49	1
5167	KW-16	16	2.25	Kleverwise	100	1	49	1
5168	KW-16	16	2.25	Kleverwise	100	1	49	1
5169	KW-16	16	2.25	Kleverwise	100	1	49	1
5171	KW-16	16	2.25	Kleverwise	100	1	49	1
5172	KW-16	16	2.25	Kleverwise	100	1	49	1
5173	KW-16	16	2.25	Kleverwise	100	1	49	1
5174	KW-16	16	2.25	Kleverwise	100	1	49	1
5175	KW-16	16	2.25	Kleverwise	100	1	49	1
5177	KW-16	16	2.25	Kleverwise	100	1	49	1
5178	KW-16	16	2.25	Kleverwise	100	1	49	1
5179	KW-16	16	2.25	Kleverwise	100	1	49	1
5180	KW-16	16	2.25	Kleverwise	100	1	49	1
5181	KW-16	16	2.25	Kleverwise	100	1	49	1
5182	KW-16	16	2.25	Kleverwise	100	1	49	1
5183	KW-16	16	2.25	Kleverwise	100	1	49	1
5184	KW-16	16	2.25	Kleverwise	100	1	49	1
5185	KW-16	16	2.25	Kleverwise	100	1	49	1
5186	KW-16	16	2.25	Kleverwise	100	1	49	1
5187	KW-16	16	2.25	Kleverwise	100	1	49	1
5188	KW-16	16	2.25	Kleverwise	100	1	49	1
5189	KW-16	16	2.25	Kleverwise	100	1	49	1
5190	KW-16	16	2.25	Kleverwise	100	1	49	1
5191	KW-16	16	2.25	Kleverwise	100	1	49	1
5192	KW-16	16	2.25	Kleverwise	100	1	49	1
5194	STD-12	12	2.3	Traditional	50	1	39	1
5200	KW-16	16	2	Kleverwise	100	1	49	1
5202	STD-12	12	2.3	Traditional	50	1	49	1
5207	STD-12	12	2.3	Traditional	50	1	49	1
5214	KW-16	16	2	Kleverwise	100	1	49	1
5226	KW-16	16	2.3	Kleverwise	100	1	39	1
5228	KW-16	16	2.25	Kleverwise	100	1	49	1
5229	STD-12	12	2.25	Traditional	0	1	39	1
5230	STD-12	12	2.25	Traditional	0	1	39	1
5242	STD-12	12	2.3	Traditional	50	1	49	1
5244	STD-12	12	2.25	Traditional	0	1	39	1
5245	KW-16	16	2.25	Kleverwise	100	1	49	1
5247	STD-12	12	2.25	Traditional	10	1	40	1
5258	KW-16	16	2.25	Kleverwise	100	1	49	1
5260	KWC	16	2.3	KWChoice	100	1	49	1
5263	STD-12	12	2.3	Traditional	50	1	49	1
5264	STD-12	12	2.25	Traditional	0	1	49	1
5268	KW-16	16	2.25	Kleverwise	100	1	49	1
5270	KW-16	16	2.3	Kleverwise	100	1	49	1
5278	STD-12	12	2.3	Traditional	50	1	39	1
5280	STD-12	12	2.3	Traditional	50	1	49	1
5285	KW-16	16	2.25	Kleverwise	100	1	49	1
5286	KW-16	16	2.3	Kleverwise	100	1	49	1
5292	STD-12	12	2.25	Traditional	0	1	39	1
5302	KW-16	16	2.3	Kleverwise	100	1	49	1
5307	KW-16	16	2.25	Kleverwise	100	1	49	1
5310	KW-16	16	2.25	Kleverwise	100	1	49	1
5312	STD-12	12	2.25	Traditional	0	1	39	1
5322	STD-12	12	2.3	Traditional	50	1	49	1
5326	KW-16	16	2.25	Kleverwise	100	1	49	1
5332	STD-12	12	2.25	Traditional	10	1	40	1
5337	KW-16	16	2.3	Kleverwise	100	1	49	1
5340	KW-16	16	2.25	Kleverwise	100	1	49	1
5343	KW-16	16	2	Kleverwise	100	1	49	1
5349	STD-12	12	2.25	Traditional	0	1	39	1
5352	KW-16	16	2.3	Kleverwise	100	1	49	1
5360	KW-16	16	2.25	Kleverwise	100	1	49	1
5363	STD-12	12	2.25	Traditional	10	1	40	1
5367	STD-12	12	2.3	Traditional	50	1	49	1
5371	KW-16	16	2.25	Kleverwise	100	1	49	1
5394	KWC	16	2.3	KWChoice	100	1	49	1
5402	STD-12	12	2.3	Traditional	50	1	49	1
5403	KW-16	16	2.25	Kleverwise	100	1	49	1
5410	STD-12	12	2.25	Traditional	0	1	39	1
5411	STD-12	12	2.25	Traditional	0	1	39	1
5421	KW-16	16	2.3	Kleverwise	100	1	49	1
5424	KW-16	16	2	Kleverwise	100	1	49	1
5427	KW-16	16	2	Kleverwise	100	1	49	1
5428	KW-16	16	2.3	Kleverwise	100	1	49	1
5430	STD-12	12	2.3	Traditional	50	1	49	1
5440	STD-12	12	2.25	Traditional	0	1	39	1
5441	KW-16	16	2.3	Kleverwise	100	1	49	1
5444	STD-12	12	2.3	Traditional	50	1	49	1
5447	STD-12	12	2.3	Traditional	50	1	25	1
5455	STD-12	12	2.3	Traditional	50	1	49	1
5456	KW-16	16	2.3	Kleverwise	100	1	49	1
5468	STD-12	12	2.3	Traditional	50	1	39	1
5482	STD-12	12	2.25	Traditional	0	1	39	1
5486	STD-12	12	2.25	Traditional	0	1	39	1
5496	STD-12	12	2.3	Traditional	50	1	39	1
5501	KW-16	16	2.3	Kleverwise	100	1	49	1
5503	STD-12	12	2.25	Traditional	0	1	39	1
5516	STD-12	12	2.3	Traditional	50	1	49	1
5518	STD-12	12	2.3	Traditional	50	1	49	1
5520	STD-12	12	2.3	Traditional	50	1	49	1
5522	KW-16	16	2.25	Kleverwise	100	1	49	1
5531	STD-12	12	2.3	Traditional	50	1	49	1
5538	STD-12	12	2.25	Traditional	0	1	39	1
5544	STD-12	12	2.3	Traditional	0	0	49	1
5548	STD-12	12	2.3	Traditional	50	1	49	1
5550	STD-12	12	2.3	Traditional	50	1	49	1
5576	KW-16	16	2.3	Kleverwise	100	1	49	1
5577	STD-12	12	2.25	Traditional	0	1	49	1
5600	STD-12	12	2.3	Traditional	50	1	39	1
5608	KW-16	16	2.25	Kleverwise	0	0	49	1
5610	KW-16	16	2.3	Kleverwise	100	1	49	1
5612	KW-16	16	2.3	Kleverwise	100	1	49	1
5615	STD-12	12	2.3	Traditional	50	1	49	1
5644	STD-12	12	2.25	Traditional	0	1	25	1
5660	STD-12	12	2	Traditional	50	1	49	1
5662	STD-12	12	2	Traditional	50	1	39	1
5688	KW-16	16	2.25	Kleverwise	100	1	5	1
5690	STD-12	12	2.25	Traditional	0	1	39	1
5692	STD-12	12	2.25	Traditional	0	1	39	1
5696	STD-12	12	2	Traditional	50	1	39	1
5705	KW-16	16	2.3	Kleverwise	100	1	49	1
5706	KW-16	16	2.25	Kleverwise	100	1	49	1
5710	STD-12	12	2.25	Traditional	0	1	39	1
5715	STD-12	12	2.25	Traditional	0	1	39	1
5717	STD-12	12	2	Traditional	50	1	39	1
5733	STD-12	12	2.3	Traditional	50	1	49	1
5734	KW-16	16	2	Kleverwise	100	1	49	1
5737	KW-16	16	2.3	Kleverwise	100	1	49	1
5743	STD-12	12	2	Traditional	50	1	49	1
5753	KW-16	16	2.25	Kleverwise	100	1	49	1
5754	STD-12	12	2.25	Traditional	10	1	40	1
5755	KW-16	16	2.25	Kleverwise	100	1	49	1
5756	KW-16	16	2.25	Kleverwise	100	1	49	1
5757	KW-16	16	2.25	Kleverwise	100	1	49	1
5758	KW-16	16	2.25	Kleverwise	100	1	49	1
5761	KW-16	16	2.25	Kleverwise	100	1	49	1
5762	KW-16	16	2.25	Kleverwise	100	1	49	1
5763	STD-12	12	2.25	Traditional	10	1	40	1
5764	STD-12	12	2.25	Traditional	10	1	40	1
5765	KW-16	16	2.25	Kleverwise	100	1	49	1
5766	STD-12	12	2.25	Traditional	10	1	40	1
5767	STD-12	12	2.25	Traditional	0	1	39	1
5777	KW-16	16	2	Kleverwise	50	1	39	1
5779	KW-16	16	2	Kleverwise	50	1	39	1
5780	KW-16	16	2	Kleverwise	50	1	39	1
5781	KW-16	16	2	Kleverwise	50	1	39	1
5782	KW-16	16	2	Kleverwise	50	1	39	1
5783	KW-16	16	2	Kleverwise	50	1	39	1
5784	KW-16	16	2	Kleverwise	50	1	39	1
5786	KW-16	16	2	Kleverwise	100	1	49	1
5787	KW-16	16	2	Kleverwise	100	1	49	1
5788	KW-16	16	2	Kleverwise	100	1	49	1
5789	KW-16	16	2	Kleverwise	100	1	49	1
5793	KW-16	16	2	Kleverwise	100	1	49	1
5794	KW-16	16	2	Kleverwise	100	1	49	1
5795	KW-16	16	2	Kleverwise	100	1	49	1
5797	KW-16	16	2	Kleverwise	50	1	39	1
5799	KW-16	16	2	Kleverwise	50	1	39	1
5800	KW-16	16	2	Kleverwise	50	1	39	1
5802	KW-16	16	2	Kleverwise	50	1	39	1
5803	KW-16	16	2	Kleverwise	100	1	49	1
5804	KW-16	16	2	Kleverwise	100	1	49	1
5805	KW-16	16	2	Kleverwise	100	1	49	1
5806	KW-16	16	2	Kleverwise	100	1	49	1
5807	KW-16	16	2	Kleverwise	100	1	49	1
5808	KW-16	16	2	Kleverwise	50	1	39	1
5812	KW-16	16	2.25	Kleverwise	100	1	49	1
5814	KW-16	16	2.3	Kleverwise	100	1	49	1
5829	STD-12	12	2	Traditional	50	1	40	1
5832	KW-16	16	2.3	Kleverwise	100	1	49	1
5837	KW-16	16	2.25	Kleverwise	0	1	49	1
5845	KW-16	16	2.25	Kleverwise	100	1	49	1
5846	KW-16	16	2	Kleverwise	50	1	39	1
5848	KW-16	16	2.3	Kleverwise	100	1	49	1
5851	STD-12	12	2.25	Traditional	0	1	39	1
5852	STD-12	12	2.25	Traditional	0	1	39	1
5868	KW-16	16	2.25	Kleverwise	0	1	49	1
5869	KW-16	16	2.3	Kleverwise	100	1	49	1
5872	STD-12	12	2.3	Traditional	50	1	39	1
5880	KW-16	16	2.3	Kleverwise	0	0	49	1
5890	KW-16	16	2.25	Kleverwise	100	1	49	1
5897	KW-16	16	2.3	Kleverwise	100	1	5	1
5906	KW-16	16	2.3	Kleverwise	100	1	5	1
5908	KW-16	16	2.3	Kleverwise	100	1	5	1
5909	KW-16	16	2.3	Kleverwise	100	1	5	1
5910	KW-16	16	2.25	Kleverwise	100	1	5	1
5911	KW-16	16	2.25	Kleverwise	100	1	5	1
5916	KW-16	16	2.25	Kleverwise	100	1	5	1
5917	KW-16	16	2.3	Kleverwise	100	1	5	1
5920	KW-16	16	2.25	Kleverwise	100	1	5	1
5923	KW-16	16	2.3	Kleverwise	100	1	5	1
5925	KW-16	16	2	Kleverwise	100	1	5	1
5927	KW-16	16	2.3	Kleverwise	100	1	49	1
5929	KW-16	16	2.3	Kleverwise	100	1	5	1
5932	KW-16	16	2.25	Kleverwise	100	1	5	1
5935	KW-16	16	2.25	Kleverwise	100	1	5	1
5936	KW-16	16	2.25	Kleverwise	0	0	49	1
5940	STD-12	12	2.25	Traditional	0	1	39	1
5941	STD-12	12	2.25	Traditional	0	1	39	1
5948	STD-12	12	2.25	Traditional	50	1	49	1
5950	STD-12	12	2.25	Traditional	10	1	40	1
5952	KW-16	16	2	Kleverwise	50	1	39	1
5959	KW-16	16	2.25	Kleverwise	100	1	49	1
5960	KW-16	16	2.3	Kleverwise	100	1	49	1
5969	STD-12	12	2.25	Traditional	0	1	39	1
5979	KW-16	16	2.25	Kleverwise	100	1	49	1
5989	KW-16	16	2.25	Kleverwise	100	1	49	1
5990	KW-16	16	2.25	Kleverwise	100	1	49	1
5996	STD-12	12	2.3	Traditional	50	1	39	1
6002	KW-16	16	2.3	Kleverwise	100	1	49	1
6005	KW-16	16	2.25	Kleverwise	100	1	49	1
6013	KW-16	16	2	Kleverwise	100	1	49	1
6028	KW-16	16	2.25	Kleverwise	0	0	49	1
6034	KW-16	16	2.25	Kleverwise	100	1	49	1
6042	KW-16	16	2.25	Kleverwise	100	1	49	1
6043	STD-12	12	2.3	Traditional	50	1	39	1
6050	KW-16	16	2	Kleverwise	100	1	49	1
6051	KW-16	16	2.3	Kleverwise	100	1	49	1
6056	STD-12	12	2.3	Traditional	50	1	49	1
6058	STD-12	12	2.3	Traditional	50	1	49	1
6060	KW-16	16	2	Kleverwise	100	1	49	1
6061	STD-12	12	2	Traditional	50	1	49	1
6065	STD-12	12	2.3	Traditional	50	1	49	1
6073	KW-16	16	2.3	Kleverwise	100	1	49	1
6076	STD-12	12	2.25	Traditional	10	1	40	1
6079	STD-12	12	2.3	Traditional	50	1	49	1
6081	STD-12	12	2.3	Traditional	50	1	49	1
6088	STD-12	12	2.3	Traditional	50	1	39	1
6094	KW-16	16	2.25	Kleverwise	0	0	49	1
6095	KW-16	16	2.3	Kleverwise	100	1	49	1
6100	KW-16	16	2.25	Kleverwise	0	0	49	1
6115	STD-12	12	2.3	Traditional	50	1	39	1
6118	STD-12	12	2.25	Traditional	0	1	39	1
6143	KW-16	16	2.3	Kleverwise	100	1	49	1
6145	STD-12	12	2.25	Traditional	10	1	40	1
6158	STD-12	12	2.3	Traditional	50	1	25	1
6161	KW-16	16	2.25	Kleverwise	100	1	49	1
6169	STD-12	12	2.25	Traditional	0	1	39	1
6170	STD-12	12	2.3	Traditional	0	0	49	1
6191	KW-16	16	2.3	Kleverwise	100	1	25	1
6192	KW-16	16	2.3	Kleverwise	100	1	25	1
6193	KW-16	16	2.3	Kleverwise	100	1	25	1
6203	STD-12	12	2.3	Traditional	50	1	49	1
6208	STD-12	12	2	Traditional	50	1	39	1
6211	KW-16	16	2.25	Kleverwise	0	1	39	1
6216	KW-16	16	2.3	Kleverwise	100	1	49	1
6217	KWC	16	2.3	KWChoice	100	1	49	1
6219	KW-16	16	2.3	Kleverwise	100	1	49	1
6235	STD-12	12	2.25	Traditional	0	1	39	1
6245	KW-16	16	2.25	Kleverwise	100	1	49	1
6250	STD-12	12	2.25	Traditional	10	1	40	1
6262	KW-16	16	2	Kleverwise	100	1	49	1
6271	KW-16	16	2.25	Kleverwise	100	1	49	1
6275	KW-16	16	2	Kleverwise	100	1	49	1
6279	KW-16	16	2.25	Kleverwise	100	1	49	1
6285	KW-16	16	2.25	Kleverwise	100	1	49	1
6291	KW-16	16	2.25	Kleverwise	100	1	49	1
6296	KW-16	16	2.3	Kleverwise	100	1	49	1
6301	KW-16	16	2.3	Kleverwise	100	1	49	1
6320	STD-12	12	2.3	Traditional	50	1	49	1
6327	KW-16	16	2.3	Kleverwise	100	1	49	1
6328	KW-16	16	2.3	Kleverwise	0	0	49	1
6333	STD-12	12	2.3	Traditional	50	1	39	1
6352	KW-16	16	2.25	Kleverwise	100	1	49	1
6362	STD-12	12	2.3	Traditional	50	1	49	1
6364	STD-12	12	2.3	Traditional	50	1	49	1
6389	KW-16	16	2.3	Kleverwise	100	1	49	1
6402	STD-12	12	2.3	Traditional	50	1	49	1
6404	STD-12	12	2.3	Traditional	50	1	49	1
6405	KW-16	16	2.25	Kleverwise	100	1	49	1
6408	STD-12	12	2.3	Traditional	50	1	39	1
6423	KW-16	16	2.3	Kleverwise	100	1	49	1
6424	KW-16	16	2.25	Kleverwise	0	0	49	1
6426	STD-12	12	2.3	Traditional	50	1	49	1
6429	KW-16	16	2.25	Kleverwise	100	1	49	1
6435	STD-12	12	2.25	Traditional	0	1	39	1
6442	STD-12	12	2.25	Traditional	50	1	49	1
6444	KW-16	16	2.25	Kleverwise	100	1	49	1
6454	KW-16	16	2.3	Kleverwise	100	1	49	1
6459	KW-16	16	2.25	Kleverwise	100	1	49	1
6467	STD-12	12	2.3	Traditional	50	1	49	1
6468	STD-12	12	2.3	Traditional	50	1	49	1
6474	KW-16	16	2.25	Kleverwise	0	0	49	1
6478	KW-16	16	2	Kleverwise	100	1	49	1
6487	KW-16	16	2.25	Kleverwise	100	1	49	1
6497	STD-12	12	2.3	Traditional	50	1	49	1
6507	KW-16	16	2.25	Kleverwise	100	1	49	1
6511	KW-16	16	2.3	Kleverwise	100	1	49	1
6513	STD-12	12	2.25	Traditional	0	1	39	1
6520	STD-12	12	2.3	Traditional	50	1	39	1
6524	KW-16	16	2.3	Kleverwise	100	1	49	1
6527	STD-12	12	2.25	Traditional	0	1	25	1
6533	STD-12	12	2.3	Traditional	50	1	39	1
6546	KW-16	16	2.25	Kleverwise	100	1	49	1
6547	KW-16	16	2.3	Kleverwise	100	1	49	1
6551	KW-16	16	2.25	Kleverwise	100	1	49	1
6559	STD-12	12	2.3	Traditional	50	1	49	1
6560	KW-16	16	2	Kleverwise	50	1	39	1
6562	KWC	16	2.3	KWChoice	100	1	49	1
6564	KW-16	16	2.25	Kleverwise	0	0	49	1
6573	KW-16	16	2.25	Kleverwise	0	1	49	1
6575	KW-16	16	2.3	Kleverwise	100	1	49	1
6576	KWC	16	2.3	KWChoice	100	1	49	1
6581	STD-12	12	2.3	Traditional	0	0	49	1
6599	STD-12	12	2.3	Traditional	50	1	39	1
6606	KW-16	16	2.25	Kleverwise	100	1	49	1
6610	STD-12	12	2.3	Traditional	50	1	39	1
6611	STD-12	12	2.3	Traditional	50	1	39	1
6612	STD-12	12	2.3	Traditional	50	1	39	1
6614	KW-16	16	2.3	Kleverwise	100	1	49	1
6619	KW-16	16	2.3	Kleverwise	100	1	49	1
6621	KW-16	16	2.25	Kleverwise	100	1	49	1
6630	STD-12	12	2	Traditional	50	1	25	1
6634	STD-12	12	2.25	Traditional	0	1	49	1
6635	KW-16	16	2.3	Kleverwise	0	0	49	1
6642	KW-16	16	2.3	Kleverwise	100	1	49	1
6657	KW-16	16	2.3	Kleverwise	100	1	49	1
6666	KW-16	16	2.3	Kleverwise	100	1	49	1
6667	KW-16	16	2.3	Kleverwise	100	1	49	1
6668	KW-16	16	2.25	Kleverwise	100	1	49	1
6671	STD-12	12	2.3	Traditional	50	1	39	1
6673	KW-16	16	2.25	Kleverwise	100	1	49	1
6684	KW-16	16	2.3	Kleverwise	100	1	49	1
6695	STD-12	12	2.25	Traditional	0	1	39	1
6713	KW-16	16	2.3	Kleverwise	100	1	49	1
6719	STD-12	12	2.3	Traditional	50	1	49	1
6724	KW-16	16	2	Kleverwise	100	1	49	1
6730	KW-16	16	2.3	Kleverwise	100	1	49	1
6732	STD-12	12	2.3	Traditional	50	1	39	1
6736	KW-16	16	2.3	Kleverwise	100	1	49	1
6738	KW-16	16	2.25	Kleverwise	100	1	49	1
6743	KW-16	16	2.25	Kleverwise	100	1	49	1
6744	KW-16	16	2.25	Kleverwise	100	1	49	1
6752	KW-16	16	2.3	Kleverwise	100	1	49	1
6754	STD-12	12	2.3	Traditional	50	1	39	1
6755	STD-12	12	2.3	Traditional	50	1	25	1
6756	STD-12	12	2.3	Traditional	50	1	25	1
6757	STD-12	12	2.25	Traditional	0	1	39	1
6760	STD-12	12	2.25	Traditional	0	1	39	1
6762	STD-12	12	2.25	Traditional	0	1	39	1
6763	STD-12	12	2.25	Traditional	0	1	39	1
6771	STD-12	12	2	Traditional	50	1	39	1
6779	KW-16	16	2.3	Kleverwise	100	1	49	1
6790	KW-16	16	2.3	Kleverwise	100	1	49	1
6791	STD-12	12	2.3	Traditional	50	1	49	1
6794	STD-12	12	2.3	Traditional	50	1	49	1
6800	STD-12	12	2.3	Traditional	50	1	49	1
6801	STD-12	12	2.3	Traditional	50	1	49	1
6802	STD-12	12	2.3	Traditional	50	1	39	1
6826	STD-12	12	2.3	Traditional	0	0	49	1
6828	STD-12	12	2.3	Traditional	0	0	25	1
6829	STD-12	12	2.3	Traditional	0	0	25	1
6831	STD-12	12	2.25	Traditional	0	1	39	1
6838	KW-16	16	2.3	Kleverwise	100	1	49	1
6853	KW-16	16	2	Kleverwise	100	1	49	1
6861	KW-16	16	2.3	Kleverwise	100	1	49	1
6871	STD-12	12	2.3	Traditional	50	1	39	1
6872	STD-12	12	2.3	Traditional	50	1	49	1
6874	STD-12	12	2.25	Traditional	0	1	49	1
6877	STD-12	12	2.3	Traditional	50	1	49	1
6884	STD-12	12	2.3	Traditional	0	0	49	1
6885	STD-12	12	2.25	Traditional	0	1	39	1
6888	STD-12	12	2.3	Traditional	50	1	39	1
6891	KW-16	16	2.3	Kleverwise	100	1	49	1
6894	STD-12	12	2.25	Traditional	0	1	39	1
6903	STD-12	12	2.25	Traditional	0	1	39	1
6907	KW-16	16	2.25	Kleverwise	100	1	49	1
6910	KW-16	16	2.25	Kleverwise	100	1	49	1
6911	KW-16	16	2.3	Kleverwise	100	1	49	1
6913	KW-16	16	2.25	Kleverwise	100	1	49	1
6931	KW-16	16	2.3	Kleverwise	100	1	49	1
6932	STD-12	12	2.3	Traditional	50	1	40	1
7937	KW-16	16	2.3	Kleverwise	100	1	49	1
7943	STD-12	12	2.25	Traditional	0	1	39	1
7944	STD-12	12	2.25	Traditional	0	1	39	1
7953	STD-12	12	2.3	Traditional	50	1	49	1
7957	STD-12	12	2.25	Traditional	10	1	40	1
7961	STD-12	12	2.3	Traditional	50	1	49	1
7963	KW-16	16	2.25	Kleverwise	0	1	49	1
7965	STD-12	12	2.3	Traditional	50	1	39	1
7970	STD-12	12	2.25	Traditional	0	1	39	1
7972	STD-12	12	2.3	Traditional	50	1	49	1
7983	STD-12	12	2.25	Traditional	0	1	39	1
7987	KW-16	16	2.3	Kleverwise	100	1	49	1
7993	KW-16	16	2.25	Kleverwise	100	1	49	1
7997	KW-16	16	2	Kleverwise	100	1	49	1
8003	STD-12	12	2.3	Traditional	50	1	49	1
8020	KW-16	16	2	Kleverwise	100	1	49	1
8030	STD-12	12	2	Traditional	50	1	39	1
8035	KW-16	16	2.25	Kleverwise	100	1	49	1
8036	KW-16	16	2.3	Kleverwise	100	1	49	1
8038	KW-16	16	2.3	Kleverwise	100	1	49	1
8045	KW-16	16	2.3	Kleverwise	100	1	49	1
8047	STD-12	12	2.3	Traditional	50	1	39	1
8064	KW-16	16	2.25	Kleverwise	100	1	49	1
8075	KW-16	16	2.3	Kleverwise	100	1	49	1
8084	KW-16	16	2	Kleverwise	50	1	39	1
8088	KW-16	16	2.3	Kleverwise	50	1	49	1
8089	KW-16	16	2	Kleverwise	100	1	49	1
8094	KW-16	16	2.3	Kleverwise	100	1	49	1
8095	STD-12	12	2.3	Traditional	50	1	49	1
8099	KWC	16	2.3	KWChoice	100	1	49	1
8104	KW-16	16	2.25	Kleverwise	100	1	49	1
8107	KW-16	16	2.25	Kleverwise	100	1	49	1
8116	KW-16	16	2.25	Kleverwise	100	1	49	1
8123	KW-16	16	2.25	Kleverwise	100	1	49	1
8127	KW-16	16	2.3	Kleverwise	100	1	49	1
8130	STD-12	12	2.3	Traditional	50	1	49	1
8143	KW-16	16	2.3	Kleverwise	100	1	49	1
8160	KWC	16	2.3	KWChoice	100	1	49	1
8162	STD-12	12	2.3	Traditional	50	1	49	1
8177	KW-16	16	2.25	Kleverwise	100	1	49	1
8188	KW-16	16	2.3	Kleverwise	100	1	49	1
8192	STD-12	12	2.3	Traditional	0	0	49	1
8193	KWC	16	2.3	KWChoice	100	1	49	1
8204	KW-16	16	2.25	Kleverwise	0	0	49	1
8215	KW-16	16	2.3	Kleverwise	100	1	49	1
8222	KW-16	16	2.3	Kleverwise	100	1	49	1
8230	KWC	16	2.3	KWChoice	100	1	49	1
8235	STD-12	12	2.25	Traditional	0	1	39	1
8242	KW-16	16	2.25	Kleverwise	100	1	49	1
8243	KW-16	16	2.25	Kleverwise	100	1	49	1
8244	KW-16	16	2.25	Kleverwise	100	1	49	1
8245	KW-16	16	2.25	Kleverwise	100	1	49	1
8246	KW-16	16	2.25	Kleverwise	100	1	49	1
8248	KW-16	16	2.3	Kleverwise	100	1	49	1
8249	STD-12	12	2.3	Traditional	50	1	39	1
8262	KW-16	16	2.25	Kleverwise	100	1	49	1
8268	STD-12	12	2.25	Traditional	0	1	39	1
8271	STD-12	12	2	Traditional	50	1	39	1
8274	KW-16	16	2.3	Kleverwise	100	1	49	1
8277	STD-12	12	2.3	Traditional	50	1	39	1
8286	STD-12	12	2.3	Traditional	50	1	49	1
8287	KW-16	16	2.25	Kleverwise	100	1	49	1
8288	KW-16	16	2.25	Kleverwise	100	1	49	1
8299	KW-16	16	2.25	Kleverwise	100	1	49	1
8300	KW-16	16	2.25	Kleverwise	100	1	49	1
8302	KW-16	16	2.25	Kleverwise	100	1	49	1
8316	STD-12	12	2.3	Traditional	50	1	49	1
8322	KW-16	16	2.25	Kleverwise	100	1	49	1
8323	STD-12	12	2.3	Traditional	50	1	39	1
8324	STD-12	12	2.3	Traditional	50	1	39	1
8325	STD-12	12	2.3	Traditional	50	1	39	1
8326	STD-12	12	2.3	Traditional	50	1	39	1
8327	STD-12	12	2.3	Traditional	50	1	39	1
8328	STD-12	12	2.3	Traditional	50	1	39	1
8329	STD-12	12	2.3	Traditional	50	1	39	1
8330	STD-12	12	2.3	Traditional	50	1	39	1
8331	STD-12	12	2.3	Traditional	50	1	39	1
8333	STD-12	12	2.3	Traditional	50	1	39	1
8335	STD-12	12	2.3	Traditional	50	1	49	1
8336	STD-12	12	2.3	Traditional	50	1	49	1
8337	KW-16	16	2.3	Kleverwise	100	1	49	1
8338	STD-12	12	2.3	Traditional	50	1	49	1
8346	KW-16	16	2	Kleverwise	100	1	49	1
8347	STD-12	12	2.3	Traditional	50	1	39	1
8364	STD-12	12	2.25	Traditional	0	1	39	1
8370	STD-12	12	2.3	Traditional	50	1	39	1
8371	STD-12	12	2.3	Traditional	50	1	39	1
8372	STD-12	12	2.3	Traditional	50	1	39	1
8374	KW-16	16	2.3	Kleverwise	100	1	49	1
8375	STD-12	12	2.3	Traditional	50	1	39	1
8376	KW-16	16	2.3	Kleverwise	100	1	49	1
8377	STD-12	12	2.3	Traditional	50	1	39	1
8382	KW-16	16	2.3	Kleverwise	100	1	49	1
8384	STD-12	12	2.3	Traditional	50	1	49	1
8385	KW-16	16	2.25	Kleverwise	100	1	49	1
8387	STD-12	12	2.25	Traditional	0	1	39	1
8404	STD-12	12	2.3	Traditional	50	1	49	1
8410	KW-16	16	2	Kleverwise	100	1	49	1
8413	STD-12	12	2.25	Traditional	0	1	39	1
8414	KW-16	16	2.25	Kleverwise	100	1	49	1
8416	STD-12	12	2.3	Traditional	50	1	49	1
8424	STD-12	12	2.25	Traditional	0	1	39	1
8432	STD-12	12	2.25	Traditional	0	1	39	1
8434	KW-16	16	2.25	Kleverwise	100	1	49	1
8435	KW-16	16	2.25	Kleverwise	100	1	49	1
8462	KW-16	16	2.3	Kleverwise	100	1	49	1
8476	KW-16	16	2.25	Kleverwise	100	1	49	1
8477	KW-16	16	2.3	Kleverwise	100	1	49	1
8485	STD-12	12	2.3	Traditional	50	1	39	1
8486	STD-12	12	2.3	Traditional	50	1	49	1
8488	STD-12	12	2.3	Traditional	50	1	49	1
8493	STD-12	12	2.25	Traditional	0	1	39	1
8495	KW-16	16	2.25	Kleverwise	100	1	49	1
8506	KW-16	16	2.3	Kleverwise	100	1	49	1
8512	STD-12	12	2.3	Traditional	50	1	49	1
8514	KW-16	16	2	Kleverwise	100	1	49	1
8515	STD-12	12	2.3	Traditional	50	1	49	1
8516	KW-16	16	2.3	Kleverwise	100	1	49	1
8531	KW-16	16	2.25	Kleverwise	100	1	49	1
8533	KW-16	16	2.25	Kleverwise	100	1	49	1
8539	STD-12	12	2.3	Traditional	50	1	39	1
8542	KW-16	16	2.3	Kleverwise	100	1	49	1
8545	KW-16	16	2.3	Kleverwise	100	1	49	1
8550	KW-16	16	2.25	Kleverwise	100	1	49	1
8589	KW-16	16	2.3	Kleverwise	100	1	49	1
8590	STD-12	12	2.25	Traditional	0	1	39	1
8592	KW-16	16	2.25	Kleverwise	100	1	49	1
8593	STD-12	12	2.3	Traditional	50	1	49	1
8594	STD-12	12	2.3	Traditional	50	1	49	1
8602	STD-12	12	2.25	Traditional	0	1	39	1
8607	KW-16	16	2.25	Kleverwise	100	1	49	1
8611	KW-16	16	2.25	Kleverwise	100	1	49	1
8614	STD-12	12	2.3	Traditional	50	1	39	1
8615	KW-16	16	2.25	Kleverwise	100	1	49	1
8621	KW-16	16	2.3	Kleverwise	100	1	49	1
8622	KW-16	16	2.3	Kleverwise	100	1	49	1
8625	STD-12	12	2	Traditional	50	1	39	1
8627	STD-12	12	2.25	Traditional	0	1	39	1
8628	KWC	16	2.3	KWChoice	100	1	50	1
8632	KW-16	16	2.3	Kleverwise	100	1	49	1
8642	KW-16	16	2.25	Kleverwise	100	1	49	1
8650	STD-12	12	2.3	Traditional	50	1	39	1
8656	STD-12	12	2.25	Traditional	0	1	39	1
8662	KW-16	16	2.25	Kleverwise	100	1	49	1
8673	STD-12	12	2.3	Traditional	50	1	49	1
8674	STD-12	12	2.25	Traditional	0	1	39	1
8675	KW-16	16	2	Kleverwise	100	1	49	1
8678	KW-16	16	2.25	Kleverwise	100	1	49	1
8694	KW-16	16	2.25	Kleverwise	100	1	49	1
8700	KW-16	16	2	Kleverwise	100	1	49	1
8702	STD-12	12	2.3	Traditional	50	1	49	1
8713	KW-16	16	2.25	Kleverwise	100	1	49	1
8717	KW-16	16	2	Kleverwise	100	1	49	1
8720	KW-16	16	2.25	Kleverwise	100	1	49	1
8727	KW-16	16	2	Kleverwise	100	1	49	1
8728	STD-12	12	2.3	Traditional	50	1	49	1
8740	KW-16	16	2.25	Kleverwise	100	1	49	1
8751	STD-12	12	2.3	Traditional	50	1	49	1
8753	STD-12	12	2.25	Traditional	0	1	25	1
8756	KW-16	16	2.3	Kleverwise	100	1	49	1
8774	KW-16	16	2.3	Kleverwise	100	1	49	1
8778	STD-12	12	2.25	Traditional	10	1	40	1
8779	STD-12	12	2.25	Traditional	0	1	39	1
8782	STD-12	12	2.3	Traditional	50	1	39	1
8791	STD-12	12	2.3	Traditional	50	1	49	1
8795	STD-12	12	2.25	Traditional	0	1	39	1
8796	STD-12	12	2.3	Traditional	50	1	39	1
8815	STD-12	12	2.3	Traditional	50	1	39	1
8817	STD-12	12	2.3	Traditional	50	1	49	1
8821	STD-12	12	2.3	Traditional	50	1	39	1
8822	KW-16	16	2.25	Kleverwise	100	1	49	1
8824	KW-16	16	2.3	Kleverwise	100	1	49	1
8828	KW-16	16	2.3	Kleverwise	100	1	49	1
8829	KW-16	16	2	Kleverwise	100	1	49	1
8831	KW-16	16	2.25	Kleverwise	100	1	49	1
8839	KWC	16	2.3	KWChoice	100	1	49	1
8843	STD-12	12	2.25	Traditional	0	1	39	1
8850	KW-16	16	2.3	Kleverwise	100	1	49	1
8855	STD-12	12	2.3	Traditional	50	1	49	1
8865	STD-12	12	2.3	Traditional	50	1	39	1
8870	STD-12	12	2.3	Traditional	50	1	39	1
8874	STD-12	12	2.3	Traditional	50	1	39	1
8878	STD-12	12	2.25	Traditional	0	1	39	1
8880	KW-16	16	2.25	Kleverwise	100	1	49	1
8905	KW-16	16	2.25	Kleverwise	100	1	49	1
8906	STD-12	12	2.3	Traditional	50	1	39	1
8916	STD-12	12	2.25	Traditional	0	1	39	1
8927	KW-16	16	2.25	Kleverwise	100	1	49	1
8928	KW-16	16	2.3	Kleverwise	100	1	49	1
8937	KW-16	16	2.25	Kleverwise	100	1	49	1
8948	STD-12	12	2.3	Traditional	50	1	49	1
8967	KW-16	16	2.3	Kleverwise	100	1	49	1
8973	STD-12	12	2.3	Traditional	50	1	49	1
8984	KWC	16	2.3	KWChoice	100	1	49	1
9012	KW-16	16	2.3	Kleverwise	100	1	49	1
9013	KW-16	16	2	Kleverwise	50	1	39	1
9015	KW-16	16	2.3	Kleverwise	100	1	49	1
9020	KW-16	16	2.3	Kleverwise	100	1	49	1
9030	STD-12	12	2.3	Traditional	50	1	39	1
9069	STD-12	12	2.3	Traditional	50	1	49	1
9071	STD-12	12	2.3	Traditional	50	1	39	1
9076	KW-16	16	2.3	Kleverwise	100	1	49	1
9078	STD-12	12	2.3	Traditional	50	1	39	1
9081	KW-16	16	2.25	Kleverwise	100	1	49	1
9082	STD-12	12	2.3	Traditional	50	1	39	1
9084	KW-16	16	2.3	Kleverwise	100	1	49	1
9102	KW-16	16	2.3	Kleverwise	100	1	49	1
9105	KW-16	16	2	Kleverwise	100	1	49	1
9110	KW-16	16	2.25	Kleverwise	100	1	49	1
9111	STD-12	12	2.3	Traditional	50	1	39	1
9121	KW-16	16	2.3	Kleverwise	100	1	49	1
9127	STD-12	12	2.3	Traditional	50	1	49	1
9130	STD-12	12	2.3	Traditional	50	1	39	1
9131	KW-16	16	2.25	Kleverwise	100	1	49	1
9147	KW-16	16	2.3	Kleverwise	100	1	49	1
9154	STD-12	12	2.25	Traditional	0	1	25	1
9157	STD-12	12	2.3	Traditional	50	1	49	1
9160	STD-12	12	2.1	Traditional	50	1	25	1
9161	KW-16	16	2.25	Kleverwise	100	1	49	1
9164	STD-12	12	2.25	Traditional	0	1	39	1
9166	KW-16	16	2.3	Kleverwise	0	0	49	1
9177	STD-12	12	2.3	Traditional	50	1	49	1
9185	STD-12	12	2.3	Traditional	50	1	49	1
9188	STD-12	12	2.3	Traditional	50	1	49	1
9189	KW-16	16	2.3	Kleverwise	100	1	49	1
9193	KW-16	16	2.25	Kleverwise	0	0	49	1
9196	KW-16	16	2.3	Kleverwise	100	1	49	1
9197	KWC	16	2.3	KWChoice	100	1	5	1
9198	KW-16	16	2.25	Kleverwise	100	1	49	1
9199	KW-16	16	2.25	Kleverwise	100	1	49	1
9206	STD-12	12	2.3	Traditional	50	1	39	1
9213	KW-16	16	2.25	Kleverwise	100	1	49	1
9216	STD-12	12	2.3	Traditional	50	1	49	1
9228	KW-16	16	2.25	Kleverwise	100	1	49	1
9234	STD-12	12	2.3	Traditional	50	1	49	1
9239	KW-16	16	2.25	Kleverwise	100	1	49	1
9243	STD-12	12	2.25	Traditional	0	1	39	1
9248	STD-12	12	2.3	Traditional	50	1	49	1
9249	STD-12	12	2.3	Traditional	50	1	25	1
9252	STD-12	12	2.3	Traditional	50	1	49	1
9253	KWC	16	2.3	KWChoice	100	1	49	1
9265	STD-12	12	2.3	Traditional	50	1	49	1
9274	STD-12	12	2.3	Traditional	50	1	49	1
9295	STD-12	12	2.3	Traditional	50	1	49	1
9297	STD-12	12	2.25	Traditional	0	1	39	1
9298	STD-12	12	2.3	Traditional	100	1	39	1
9299	KW-16	16	2.3	Kleverwise	100	1	49	1
9299	KW-16	16	2.3	Kleverwise	50	1	49	1
9300	KW-16	16	2.3	Kleverwise	100	1	49	1
9317	KW-16	16	2.3	Kleverwise	100	1	49	1
9327	KW-16	16	2.3	Kleverwise	100	1	49	1
9330	KW-16	16	2.3	Kleverwise	100	1	49	1
9333	KW-16	16	2.25	Kleverwise	100	1	49	1
9340	STD-12	12	2.3	Traditional	50	1	39	1
9348	STD-12	12	2.3	Traditional	50	1	49	1
9354	KW-16	16	2	Kleverwise	100	1	49	1
9356	STD-12	12	2.3	Traditional	50	1	49	1
9359	STD-12	12	2.3	Traditional	50	1	39	1
9361	STD-12	12	2.3	Traditional	50	1	39	1
9375	KW-16	16	2.3	Kleverwise	100	1	49	1
9382	STD-12	12	2.3	Traditional	50	1	39	1
9391	KW-16	16	2.3	Kleverwise	0	0	49	1
9394	STD-12	12	2.3	Traditional	50	1	49	1
9396	KW-16	16	2.25	Kleverwise	100	1	49	1
9398	STD-12	12	2.25	Traditional	0	1	39	1
9405	STD-12	12	2.3	Traditional	50	1	39	1
9412	KW-16	16	2.25	Kleverwise	100	1	49	1
9415	STD-12	12	2.3	Traditional	50	1	39	1
9440	STD-12	12	2.3	Traditional	50	1	49	1
9442	STD-12	12	2.3	Traditional	50	1	49	1
9444	STD-12	12	2.3	Traditional	50	1	49	1
9446	STD-12	12	2.3	Traditional	50	1	49	1
9453	KW-16	16	2.3	Kleverwise	100	1	49	1
9456	KW-16	16	2.3	Kleverwise	100	1	49	1
9465	KW-16	16	2.25	Kleverwise	100	1	49	1
9469	KW-16	16	2.3	Kleverwise	100	1	49	1
9479	STD-12	12	2.3	Traditional	50	1	39	1
9487	KW-16	16	2.25	Kleverwise	0	1	49	1
9493	STD-12	12	2.3	Traditional	50	1	49	1
9494	STD-12	12	2.3	Traditional	50	1	49	1
9498	KW-16	16	2.3	Kleverwise	100	1	49	1
9499	STD-12	12	2.3	Traditional	50	1	49	1
9500	STD-12	12	2.25	Traditional	10	1	40	1
9512	KWC	16	2.3	KWChoice	100	1	49	1
9515	STD-12	12	2.3	Traditional	50	1	39	1
9516	KW-16	16	2.3	Kleverwise	100	1	49	1
9540	STD-12	12	2.3	Traditional	50	1	49	1
9547	STD-12	12	2.25	Traditional	100	1	49	1
9555	KW-16	16	2.25	Kleverwise	100	1	49	1
9563	STD-12	12	2.3	Traditional	50	1	49	1
9570	KW-16	16	2.25	Kleverwise	100	1	49	1
9576	STD-12	12	2.25	Traditional	0	1	39	1
9581	STD-12	12	2.3	Traditional	50	1	49	1
9583	KW-16	16	2.3	Kleverwise	100	1	49	1
9585	KW-16	16	2.25	Kleverwise	100	1	49	1
9605	KW-16	16	2.3	Kleverwise	100	1	49	1
9611	STD-12	12	2.3	Traditional	50	1	39	1
9633	KW-16	16	2.3	Kleverwise	100	1	49	1
9657	KW-16	16	2.3	Kleverwise	100	1	49	1
9664	KW-16	16	2.3	Kleverwise	100	1	49	1
9669	KW-16	16	2.3	Kleverwise	100	1	49	1
9673	STD-12	12	2.1	Traditional	50	1	25	1
9675	KW-16	16	2.3	Kleverwise	100	1	49	1
9678	STD-12	12	2.3	Traditional	50	1	49	1
9688	KW-16	16	2.3	Kleverwise	100	1	49	1
9699	KW-16	16	2.25	Kleverwise	100	1	49	1
9704	KW-16	16	2.3	Kleverwise	100	1	49	1
9709	STD-12	12	2.3	Traditional	50	1	49	1
9710	KW-16	16	2.3	Kleverwise	100	1	49	1
9724	KW-16	16	2.25	Kleverwise	100	1	49	1
9776	KW-16	16	2.3	Kleverwise	100	1	49	1
9777	STD-12	12	2.3	Traditional	50	1	49	1
9778	KW-16	16	2.3	Kleverwise	100	1	49	1
9782	KWC	16	2.3	KWChoice	100	1	49	1
9796	KW-16	16	2.25	Kleverwise	100	1	49	1
9797	KW-16	16	2.25	Kleverwise	100	1	49	1
9803	KW-16	16	2.3	Kleverwise	100	1	25	1
9817	KW-16	16	2	Kleverwise	100	1	49	1
9826	STD-12	12	2.3	Traditional	50	1	49	1
9832	STD-12	12	2.3	Traditional	50	1	49	1
9834	KW-16	16	2.3	Kleverwise	100	1	49	1
9837	KW-16	16	2.25	Kleverwise	100	1	49	1
9841	KW-16	16	2	Kleverwise	100	1	49	1
9844	STD-12	12	2.3	Traditional	50	1	39	1
9854	KW-16	16	2.3	Kleverwise	100	1	49	1
9861	STD-12	12	2.25	Traditional	10	1	40	1
9883	STD-12	12	2.3	Traditional	50	1	49	1
9890	KW-16	16	2.3	Kleverwise	50	1	25	1
9895	KW-16	16	2.25	Kleverwise	100	1	49	1
9897	KW-16	16	2.3	Kleverwise	100	1	49	1
9911	STD-12	12	2.25	Traditional	50	1	25	1
9913	STD-12	12	2.3	Traditional	50	1	49	1
9914	STD-12	12	2.3	Traditional	50	1	39	1
9915	STD-12	12	2.3	Traditional	50	1	39	1
9926	KW-16	16	2.3	Kleverwise	100	1	49	1
9927	KW-16	16	2.3	Kleverwise	100	1	49	1
9942	STD-12	12	2.3	Traditional	50	1	49	1
9943	KW-16	16	2.3	Kleverwise	100	1	49	1
9961	STD-12	12	2.3	Traditional	50	1	39	1
9963	KW-16	16	2.25	Kleverwise	100	1	49	1
9965	STD-12	12	2.3	Traditional	50	1	49	1
9966	STD-12	12	2.25	Traditional	0	1	25	1
9967	KW-16	16	2	Kleverwise	100	1	49	1
9971	KW-16	16	2.25	Kleverwise	100	1	49	1
9975	STD-12	12	2.3	Traditional	50	1	49	1
9979	STD-12	12	2.3	Traditional	50	1	49	1
9987	KW-16	16	2.25	Kleverwise	100	1	49	1
9997	STD-12	12	2.3	Traditional	50	1	49	1
9999	STD-12	12	2.3	Traditional	50	1	39	1
10012	KW-16	16	2.25	Kleverwise	100	1	49	1
10014	KW-16	16	2.25	Kleverwise	100	1	49	1
10053	STD-12	12	2.3	Traditional	50	1	39	1
10054	KW-16	16	2.25	Kleverwise	100	1	49	1
10055	KW-16	16	2.25	Kleverwise	100	1	49	1
10059	KW-16	16	2.3	Kleverwise	100	1	49	1
10070	KW-16	16	2.25	Kleverwise	100	1	49	1
10071	KW-16	16	2.25	Kleverwise	100	1	49	1
10088	KW-16	16	2.25	Kleverwise	0	0	49	1
10089	KW-16	16	2.25	Kleverwise	100	1	49	1
10093	KW-16	16	2.25	Kleverwise	100	1	49	1
10130	STD-12	12	2.25	Traditional	0	1	39	1
10131	STD-12	12	2.3	Traditional	50	1	39	1
10134	KW-16	16	2.25	Kleverwise	0	0	49	1
10136	STD-12	12	2.3	Traditional	50	1	39	1
10139	KW-16	16	2.25	Kleverwise	100	1	49	1
10143	KWC	16	2.3	KWChoice	100	1	49	1
10150	KW-16	16	2.3	Kleverwise	100	1	49	1
10163	KW-16	16	2.3	Kleverwise	100	1	49	1
10168	KWC	16	2.3	KWChoice	100	1	49	1
10193	STD-12	12	2.3	Traditional	50	1	39	1
10201	KW-16	16	2.25	Kleverwise	100	1	49	1
10206	KWC	16	2.3	KWChoice	100	1	49	1
10208	KW-16	16	2.25	Kleverwise	100	1	49	1
10209	STD-12	12	2.3	Traditional	50	1	49	1
10211	STD-12	12	2.3	Traditional	50	1	39	1
10215	STD-12	12	2.3	Traditional	100	1	49	1
10224	STD-12	12	2.3	Traditional	50	1	49	1
10226	STD-12	12	2.25	Traditional	0	1	39	1
10246	KW-16	16	2.25	Kleverwise	100	1	49	1
10259	STD-12	12	2.25	Traditional	0	1	25	1
10262	STD-12	12	2.3	Traditional	50	1	49	1
10264	STD-12	12	2.3	Traditional	50	1	49	1
10265	STD-12	12	2.3	Traditional	50	1	49	1
10272	STD-12	12	2.3	Traditional	50	1	39	1
10275	STD-12	12	2.3	Traditional	50	1	39	1
10279	STD-12	12	2.25	Traditional	0	1	39	1
10287	KW-16	16	2.25	Kleverwise	100	1	49	1
10291	KW-16	16	2.25	Kleverwise	100	1	49	1
10292	KW-16	16	2.25	Kleverwise	100	1	49	1
10295	KW-16	16	2.25	Kleverwise	100	1	49	1
10297	KW-16	16	2.25	Kleverwise	100	1	49	1
10311	KW-16	16	2.3	Kleverwise	100	1	49	1
10312	KW-16	16	2.25	Kleverwise	100	1	49	1
10317	STD-12	12	2.3	Traditional	50	1	49	1
10319	KW-16	16	2.25	Kleverwise	100	1	49	1
10324	KW-16	16	2.3	Kleverwise	100	1	49	1
10328	KW-16	16	2.3	Kleverwise	100	1	25	1
10329	STD-12	12	2.3	Traditional	50	1	39	1
10335	KW-16	16	2.3	Kleverwise	100	1	49	1
10337	KW-16	16	2.25	Kleverwise	100	1	49	1
10341	STD-12	12	2.25	Traditional	0	1	39	1
10342	KW-16	16	2.3	Kleverwise	100	1	49	1
10345	STD-12	12	2.25	Traditional	0	1	39	1
10347	KW-16	16	2.3	Kleverwise	100	1	49	1
10355	KW-16	16	2.3	Kleverwise	100	1	49	1
10365	STD-12	12	2.3	Traditional	50	1	39	1
10369	KW-16	16	2.3	Kleverwise	100	1	49	1
10375	STD-12	12	2.3	Traditional	50	1	39	1
10379	KW-16	16	2.3	Kleverwise	100	1	49	1
10401	STD-12	12	2.3	Traditional	50	1	49	1
10407	STD-12	12	2.25	Traditional	0	1	25	1
10408	STD-12	12	2.3	Traditional	50	1	49	1
10417	KW-16	16	2	Kleverwise	100	1	49	1
10418	STD-12	12	2.25	Traditional	50	1	49	1
10421	KW-16	16	2.3	Kleverwise	100	1	49	1
10424	KW-16	16	2.3	Kleverwise	100	1	49	1
10425	STD-12	12	2.3	Traditional	50	1	25	1
10427	KW-16	16	2.3	Kleverwise	100	1	49	1
10428	STD-12	12	2.3	Traditional	50	1	25	1
10430	STD-12	12	2.3	Traditional	50	1	25	1
10432	STD-12	12	2.3	Traditional	50	1	39	1
10441	STD-12	12	2.3	Traditional	50	1	49	1
10442	KW-16	16	2.25	Kleverwise	100	1	49	1
10446	KW-16	16	2.3	Kleverwise	100	1	49	1
10447	STD-12	12	2.3	Traditional	50	1	39	1
10451	KW-16	16	2.3	Kleverwise	100	1	49	1
10454	KW-16	16	2.25	Kleverwise	100	1	49	1
10462	STD-12	12	2.3	Traditional	50	1	49	1
10467	KW-16	16	2.3	Kleverwise	100	1	49	1
10468	STD-12	12	2.3	Traditional	50	1	49	1
10473	STD-12	12	2.3	Traditional	50	1	49	1
10479	KW-16	16	2.3	Kleverwise	100	1	49	1
10484	KW-16	16	2.3	Kleverwise	100	1	49	1
10485	STD-12	12	2.3	Traditional	50	1	39	1
10497	STD-12	12	2.3	Traditional	50	1	49	1
10500	KW-16	16	2.25	Kleverwise	100	1	49	1
10530	STD-12	12	2.3	Traditional	50	1	49	1
10534	STD-12	12	2.3	Traditional	50	1	49	1
10535	KW-16	16	2.25	Kleverwise	100	1	49	1
10553	KW-16	16	2.25	Kleverwise	100	1	49	1
10554	STD-12	12	2.3	Traditional	50	1	49	1
10556	STD-12	12	2.25	Traditional	0	1	39	1
10560	KW-16	16	2.25	Kleverwise	100	1	49	1
10561	KW-16	16	2.25	Kleverwise	100	1	49	1
10566	STD-12	12	2.25	Traditional	50	1	49	1
10575	STD-12	12	2.25	Traditional	0	1	49	1
10581	STD-12	12	2.3	Traditional	50	1	49	1
10582	STD-12	12	2.3	Traditional	50	1	49	1
10586	STD-12	12	2.3	Traditional	50	1	39	1
10597	STD-12	12	2.3	Traditional	0	0	49	1
10598	KW-16	16	2.3	Kleverwise	100	1	49	1
10603	KW-16	16	2	Kleverwise	100	1	49	1
10604	KW-16	16	2	Kleverwise	100	1	49	1
10634	KW-16	16	2.25	Kleverwise	100	1	99	1
10643	KW-16	16	2.25	Kleverwise	0	0	49	1
10648	KW-16	16	2.3	Kleverwise	100	1	49	1
10653	STD-12	12	2	Traditional	50	1	49	1
10667	STD-12	12	2.3	Traditional	50	1	39	1
10668	STD-12	12	2.25	Traditional	50	1	25	1
10674	KWC	16	2.3	KWChoice	100	1	5	1
10686	STD-12	12	2.3	Traditional	50	1	39	1
10695	KW-16	16	2.3	Kleverwise	100	1	49	1
10702	STD-12	12	2.25	Traditional	0	1	39	1
10710	STD-12	12	2.3	Traditional	50	1	49	1
10716	KW-16	16	2.3	Kleverwise	100	1	49	1
10720	KW-16	16	2.3	Kleverwise	100	1	49	1
10742	KW-16	16	2.25	Kleverwise	100	1	49	1
10746	STD-12	12	2.25	Traditional	0	1	49	1
10749	KWC	16	2.3	KWChoice	100	1	49	1
10762	KW-16	16	2.25	Kleverwise	100	1	49	1
10791	KW-16	16	2	Kleverwise	100	1	49	1
10794	STD-12	12	2.3	Traditional	50	1	49	1
10798	STD-12	12	2.3	Traditional	50	1	49	1
10808	STD-12	12	2.25	Traditional	0	1	49	1
10809	STD-12	12	2.25	Traditional	0	1	49	1
10840	KW-16	16	2.3	Kleverwise	100	1	49	1
10845	KW-16	16	2.3	Kleverwise	100	1	49	1
10846	KW-16	16	2.3	Kleverwise	100	1	49	1
10851	KW-16	16	2.3	Kleverwise	100	1	49	1
10866	KW-16	16	2.3	Kleverwise	100	1	49	1
10874	KW-16	16	2	Kleverwise	50	1	49	1
10876	STD-12	12	2.3	Traditional	50	1	49	1
10878	KWC	16	2.3	KWChoice	100	1	49	1
10885	KW-16	16	2.3	Kleverwise	100	1	49	1
10891	STD-12	12	2.25	Traditional	0	1	49	1
10900	KWC	16	2.3	KWChoice	100	1	49	1
10902	STD-12	12	2	Traditional	50	1	49	1
10903	STD-12	12	2	Traditional	50	1	49	1
10904	STD-12	12	2	Traditional	50	1	49	1
10905	STD-12	12	2	Traditional	50	1	49	1
10907	STD-12	12	2	Traditional	50	1	49	1
10915	STD-12	12	2.25	Traditional	0	1	49	1
10917	STD-12	12	2.25	Traditional	0	1	49	1
10940	STD-12	12	2	Traditional	50	1	49	1
10946	STD-12	12	2.25	Traditional	0	1	49	1
10971	STD-12	12	2.3	Traditional	50	1	49	1
10979	STD-12	12	2.3	Traditional	50	1	49	1
10982	STD-12	12	2.25	Traditional	50	1	49	1
10984	STD-12	12	2.3	Traditional	50	1	49	1
10985	KW-16	16	2.3	Kleverwise	100	1	49	1
10987	KW-16	16	2.3	Kleverwise	100	1	49	1
10988	STD-12	12	2.25	Traditional	0	1	49	1
11006	STD-12	12	2.3	Traditional	50	1	49	1
11026	KW-16	16	2	Kleverwise	100	1	49	1
11032	STD-12	12	2.3	Traditional	50	1	39	1
11034	KW-16	16	2.25	Kleverwise	100	1	49	1
11039	STD-12	12	2.3	Traditional	50	1	49	1
11046	STD-12	12	2.25	Traditional	0	1	49	1
11053	STD-12	12	2.3	Traditional	50	1	49	1
11055	KW-16	16	2.3	Kleverwise	100	1	49	1
11061	KW-16	16	2.25	Kleverwise	100	1	49	1
11062	KW-16	16	2.3	Kleverwise	100	1	49	1
11068	STD-12	12	2.25	Traditional	0	1	49	1
11069	STD-12	12	2.25	Traditional	50	1	49	1
11078	STD-12	12	2.3	Traditional	50	1	49	1
11085	STD-12	12	2.3	Traditional	50	1	49	1
11086	KW-16	16	2.25	Kleverwise	100	1	49	1
11089	STD-12	12	2.25	Traditional	0	1	49	1
11090	STD-12	12	2.3	Traditional	50	1	25	1
11091	KW-16	16	2.25	Kleverwise	100	1	49	1
11092	STD-12	12	2.3	Traditional	50	1	25	1
11095	STD-12	12	2.3	Traditional	50	1	49	1
11098	STD-12	12	2.3	Traditional	50	1	49	1
11101	KW-16	16	2.25	Kleverwise	0	0	49	1
11105	STD-12	12	2.25	Traditional	100	1	49	1
11109	STD-12	12	2.25	Traditional	100	1	49	1
11110	KW-16	16	2	Kleverwise	100	1	49	1
11126	STD-12	12	2.25	Traditional	0	1	49	1
11146	KW-16	16	2	Kleverwise	50	1	49	1
11149	STD-12	12	2.3	Traditional	100	1	49	1
11152	STD-12	12	2.3	Traditional	50	1	25	1
11154	STD-12	12	2.3	Traditional	50	1	25	1
11157	STD-12	12	2.25	Traditional	0	1	25	1
11160	STD-12	12	2.25	Traditional	0	1	49	1
11161	STD-12	12	2.25	Traditional	0	1	49	1
11169	STD-12	12	2.25	Traditional	0	1	49	1
11174	STD-12	12	2.25	Traditional	0	1	49	1
11180	STD-12	12	2.3	Traditional	50	1	49	1
11181	KW-16	16	2.3	Kleverwise	100	1	49	1
11182	STD-12	12	2.25	Traditional	0	1	49	1
11184	STD-12	12	2.25	Traditional	0	1	49	1
11185	STD-12	12	2.3	Traditional	50	1	25	1
11186	STD-12	12	2.3	Traditional	50	1	49	1
11187	KW-16	16	2.25	Kleverwise	100	1	49	1
11189	KW-16	16	2.3	Kleverwise	100	1	49	1
11206	STD-12	12	2.3	Traditional	50	1	49	1
11212	KW-16	16	2.25	Kleverwise	100	1	49	1
11215	STD-12	12	2.3	Traditional	50	1	49	1
11226	KW-16	16	2.25	Kleverwise	100	1	49	1
11233	KW-16	16	2.3	Kleverwise	50	1	49	1
11244	STD-12	12	2.25	Traditional	0	1	49	1
11248	STD-12	12	2.25	Traditional	0	1	49	1
11251	STD-12	12	2.3	Traditional	50	1	49	1
11254	KW-16	16	2.3	Kleverwise	100	1	49	1
11257	STD-12	12	2	Traditional	50	1	49	1
11260	KW-16	16	2.3	Kleverwise	100	1	49	1
11277	STD-12	12	2.3	Traditional	50	1	49	1
11280	KW-16	16	2.25	Kleverwise	100	1	49	1
11285	KW-16	16	2.25	Kleverwise	100	1	49	1
11288	KW-16	16	2.3	Kleverwise	100	1	49	1
11293	KW-16	16	2.25	Kleverwise	100	1	49	1
11300	KW-16	16	2.25	Kleverwise	100	1	49	1
11316	STD-12	12	2.3	Traditional	50	1	49	1
11321	STD-12	12	2.3	Traditional	0	0	49	1
11324	STD-12	12	2.3	Traditional	50	1	49	1
11325	STD-12	12	2.3	Traditional	50	1	49	1
11331	KW-16	16	2.25	Kleverwise	100	1	49	1
11332	KW-16	16	2.25	Kleverwise	100	1	49	1
11336	STD-12	12	2.3	Traditional	50	1	49	1
11339	STD-12	12	2.3	Traditional	50	1	49	1
11345	STD-12	12	2.25	Traditional	10	1	40	1
11346	STD-12	12	2.25	Traditional	10	1	40	1
11347	STD-12	12	2.25	Traditional	10	1	40	1
11349	STD-12	12	2.25	Traditional	10	1	40	1
11350	STD-12	12	2.3	Traditional	50	1	39	1
11353	STD-12	12	2.3	Traditional	50	1	49	1
11354	STD-12	12	2.3	Traditional	50	1	49	1
11363	STD-12	12	2.25	Traditional	0	1	39	1
11368	KW-16	16	2.3	Kleverwise	100	1	49	1
11375	STD-12	12	2.3	Traditional	50	1	49	1
11376	STD-12	12	2.3	Traditional	50	1	49	1
11382	KW-16	16	2.3	Kleverwise	100	1	49	1
11387	KW-16	16	2.3	Kleverwise	100	1	49	1
11388	STD-12	12	2.3	Traditional	50	1	49	1
11395	STD-12	12	2.3	Traditional	50	1	49	1
11396	STD-12	12	2.25	Traditional	0	1	49	1
11398	KW-16	16	2.3	Kleverwise	100	1	49	1
11410	STD-12	12	2.3	Traditional	50	1	49	1
11413	STD-12	12	2.25	Traditional	0	1	49	1
11415	KW-16	16	2.3	Kleverwise	100	1	49	1
11427	KW-16	16	2.25	Kleverwise	100	1	49	1
11428	STD-12	12	2.3	Traditional	50	1	39	1
11431	STD-12	12	2.3	Traditional	50	1	49	1
11434	STD-12	12	2.3	Traditional	50	1	49	1
11435	KW-16	16	2.3	Kleverwise	100	1	49	1
11438	STD-12	12	2.3	Traditional	50	1	49	1
11447	STD-12	12	2.3	Traditional	50	1	49	1
11481	KW-16	16	2.3	Kleverwise	100	1	49	1
11486	KW-16	16	2.3	Kleverwise	100	1	49	1
11487	STD-12	12	2.3	Traditional	50	1	49	1
11489	STD-12	12	2.3	Traditional	50	1	49	1
11490	KW-16	16	2.3	Kleverwise	100	1	49	1
11498	STD-12	12	2.3	Traditional	50	1	49	1
11499	STD-12	12	2.3	Traditional	50	1	49	1
11502	KW-16	16	2.3	Kleverwise	100	1	49	1
11527	STD-12	12	2.3	Traditional	50	1	49	1
11529	KW-16	16	2.3	Kleverwise	100	1	49	1
11531	STD-12	12	2.3	Traditional	50	1	25	1
11532	STD-12	12	2.3	Traditional	50	1	49	1
11543	STD-12	12	2.25	Traditional	0	1	49	1
11547	KW-16	16	2.25	Kleverwise	0	1	39	1
11549	STD-12	12	2.3	Traditional	50	1	49	1
11551	KW-16	16	2.25	Kleverwise	100	1	49	1
11552	KW-16	16	2.25	Kleverwise	100	1	49	1
11562	KW-16	16	2.3	Kleverwise	100	1	49	1
11570	STD-12	12	2.3	Traditional	50	1	49	1
11587	KW-16	16	2.25	Kleverwise	100	1	49	1
11589	KW-16	16	2.25	Kleverwise	100	1	49	1
11592	STD-12	12	2.3	Traditional	50	1	49	1
11593	STD-12	12	2.3	Traditional	50	1	49	1
11603	STD-12	12	2.3	Traditional	50	1	49	1
11607	STD-12	12	2.25	Traditional	0	1	49	1
11610	KW-16	16	2.25	Kleverwise	100	1	49	1
11615	KW-16	16	2.3	Kleverwise	100	1	49	1
11620	KW-16	16	2.25	Kleverwise	100	1	49	1
11621	STD-12	12	2.25	Traditional	0	1	49	1
11626	KW-16	16	2.3	Kleverwise	100	1	49	1
11636	STD-12	12	2.3	Traditional	50	1	49	1
11643	KW-16	16	2	Kleverwise	100	1	49	1
11646	KW-16	16	2	Kleverwise	100	1	49	1
11648	STD-12	12	2	Traditional	50	1	49	1
11656	STD-12	12	2.3	Traditional	50	1	49	1
11660	KW-16	16	2.3	Kleverwise	100	1	49	1
11661	STD-12	12	2.3	Traditional	50	1	49	1
11668	KW-16	16	2.25	Kleverwise	100	1	49	1
11680	KW-16	16	2.3	Kleverwise	100	1	49	1
11681	STD-12	12	2.3	Traditional	50	1	49	1
11690	STD-12	12	2.3	Traditional	50	1	49	1
11694	STD-12	12	2.3	Traditional	50	1	49	1
11698	KW-16	16	2.25	Kleverwise	100	1	49	1
11699	STD-12	12	2.3	Traditional	50	1	49	1
11707	STD-12	12	2.25	Traditional	0	1	49	1
11718	KW-16	16	2.25	Kleverwise	100	1	49	1
11719	KW-16	16	2.25	Kleverwise	100	1	49	1
11729	KWC	16	2.3	KWChoice	100	1	49	1
11730	KWC	16	2.3	KWChoice	100	1	49	1
11731	KW-16	16	2.3	Kleverwise	100	1	49	1
11732	KWC	16	2.3	KWChoice	100	1	49	1
11733	KWC	16	2.3	KWChoice	100	1	49	1
11734	KW-16	16	2.3	Kleverwise	100	1	49	1
11735	KWC	16	2.3	KWChoice	100	1	49	1
11736	KW-16	16	2.3	Kleverwise	100	1	49	1
11738	KW-16	16	2.3	Kleverwise	100	1	49	1
11764	STD-12	12	2.25	Traditional	50	1	49	1
11767	KW-16	16	2.3	Kleverwise	100	1	49	1
11772	KW-16	16	2	Kleverwise	100	1	49	1
11787	STD-12	12	2.25	Traditional	0	1	39	1
11794	STD-12	12	2.3	Traditional	0	0	49	1
11815	STD-12	12	2.3	Traditional	50	1	49	1
11816	KW-16	16	2.3	Kleverwise	100	1	49	1
11821	KW-16	16	2.3	Kleverwise	100	1	49	1
11822	STD-12	12	2.3	Traditional	50	1	39	1
11830	KW-16	16	2.25	Kleverwise	100	1	49	1
11832	KW-16	16	2.3	Kleverwise	100	1	49	1
11835	KW-16	16	2	Kleverwise	100	1	49	1
11836	STD-12	12	2.3	Traditional	0	0	49	1
11837	KW-16	16	2.3	Kleverwise	100	1	49	1
11847	STD-12	12	2.25	Traditional	50	1	49	1
11849	KW-16	16	2	Kleverwise	100	1	49	1
11857	STD-12	12	2.3	Traditional	50	1	49	1
11858	STD-12	12	2.3	Traditional	50	1	49	1
11879	STD-12	12	2.3	Traditional	50	1	49	1
11898	KW-16	16	2.25	Kleverwise	100	1	49	1
11900	KW-16	16	2.25	Kleverwise	100	1	49	1
11901	KW-16	16	2.25	Kleverwise	100	1	49	1
11918	KW-16	16	2.3	Kleverwise	100	1	49	1
11922	KW-16	16	2.3	Kleverwise	100	1	49	1
11923	KW-16	16	2.3	Kleverwise	100	1	49	1
11927	STD-12	12	2.3	Traditional	50	1	39	1
11932	STD-12	12	2.3	Traditional	50	1	49	1
11942	STD-12	12	2.3	Traditional	50	1	39	1
11946	STD-12	12	2.3	Traditional	50	1	39	1
11949	KW-16	16	2.25	Kleverwise	100	1	49	1
11951	KW-16	16	2.25	Kleverwise	100	1	49	1
11961	KW-16	16	2.3	Kleverwise	100	1	49	1
11968	STD-12	12	2.3	Traditional	50	1	49	1
11994	KW-16	16	2.3	Kleverwise	100	1	49	1
11995	KW-16	16	2.3	Kleverwise	100	1	49	1
12000	STD-12	12	2.3	Traditional	50	1	49	1
12016	KW-16	16	2.3	Kleverwise	100	1	49	1
12017	STD-12	12	2.3	Traditional	50	1	49	1
12021	STD-12	12	2.25	Traditional	50	1	49	1
12024	STD-12	12	2.3	Traditional	50	1	49	1
12027	KW-16	16	2.3	Kleverwise	100	1	49	1
12030	STD-12	12	2.3	Traditional	50	1	49	1
12031	STD-12	12	2.3	Traditional	50	1	39	1
12036	STD-12	12	2.1	Traditional	50	1	25	1
12038	KW-16	16	2.25	Kleverwise	100	1	49	1
12045	STD-12	12	2.3	Traditional	100	1	49	1
12052	KW-16	16	2.3	Kleverwise	100	1	25	1
12057	STD-12	12	2.25	Traditional	50	1	49	1
12058	KW-16	16	2.25	Kleverwise	100	1	49	1
12061	STD-12	12	2.3	Traditional	50	1	49	1
12070	STD-12	12	2	Traditional	50	1	49	1
12075	KW-16	16	2.3	Kleverwise	100	1	49	1
12076	KW-16	16	2.3	Kleverwise	100	1	49	1
12080	STD-12	12	2.3	Traditional	50	1	49	1
12087	STD-12	12	2.3	Traditional	50	1	49	1
12089	STD-12	12	2.3	Traditional	50	1	49	1
12090	STD-12	12	2.3	Traditional	50	1	49	1
12094	KW-16	16	2.25	Kleverwise	100	1	49	1
12098	KW-16	16	2	Kleverwise	50	1	49	1
12109	STD-12	12	2.3	Traditional	50	1	49	1
12114	KW-16	16	2.25	Kleverwise	100	1	49	1
12115	STD-12	12	2.3	Traditional	50	1	49	1
12116	KW-16	16	2.25	Kleverwise	100	1	49	1
12121	KW-16	16	2.3	Kleverwise	100	1	49	1
12122	STD-12	12	2	Traditional	50	1	49	1
12123	STD-12	12	2.3	Traditional	50	1	49	1
12129	KW-16	16	2.25	Kleverwise	100	1	49	1
12134	STD-12	12	2.3	Traditional	50	1	49	1
12137	STD-12	12	2.3	Traditional	50	1	49	1
12144	KW-16	16	2.25	Kleverwise	100	1	49	1
12148	STD-12	12	2.3	Traditional	50	1	49	1
12152	STD-12	12	2.3	Traditional	50	1	49	1
12154	KW-16	16	2.3	Kleverwise	100	1	49	1
12156	STD-12	12	2.3	Traditional	50	1	49	1
12163	KW-16	16	2.25	Kleverwise	100	1	49	1
12165	STD-12	12	2.3	Traditional	50	1	49	1
12166	STD-12	12	2.3	Traditional	50	1	49	1
12169	STD-12	12	2.3	Traditional	50	1	49	1
12171	KW-16	16	2.25	Kleverwise	100	1	49	1
12174	STD-12	12	2.25	Traditional	0	1	39	1
12176	STD-12	12	2.3	Traditional	50	1	49	1
12177	KW-16	16	2.3	Kleverwise	100	1	49	1
12179	KW-16	16	2.3	Kleverwise	100	1	49	1
12180	KW-16	16	2.3	Kleverwise	100	1	49	1
12181	KW-16	16	2.25	Kleverwise	100	1	49	1
12187	STD-12	12	2.3	Traditional	50	1	49	1
12195	KW-16	16	2.3	Kleverwise	100	1	49	1
12232	STD-12	12	2.3	Traditional	50	1	49	1
12234	KW-16	16	2.3	Kleverwise	100	1	49	1
12235	KW-16	16	2.25	Kleverwise	100	1	49	1
12250	KW-16	16	2.25	Kleverwise	100	1	49	1
12254	KW-16	16	2.25	Kleverwise	100	1	49	1
12266	KW-16	16	2.3	Kleverwise	100	1	49	1
12269	KW-16	16	2.25	Kleverwise	100	1	49	1
12273	STD-12	12	2.3	Traditional	50	1	39	1
12275	STD-12	12	2.25	Traditional	0	1	49	1
12277	STD-12	12	2.3	Traditional	50	1	49	1
12292	STD-12	12	2.3	Traditional	50	1	49	1
12297	KW-16	16	2	Kleverwise	100	1	49	1
12303	STD-12	12	2.3	Traditional	50	1	49	1
12305	KW-16	16	2	Kleverwise	50	1	25	1
12306	STD-12	12	2.3	Traditional	50	1	49	1
12307	STD-12	12	2	Traditional	50	1	49	1
12309	STD-12	12	2.3	Traditional	50	1	49	1
12311	STD-12	12	2.25	Traditional	0	1	49	1
12314	STD-12	12	2.3	Traditional	50	1	49	1
12320	STD-12	12	2.3	Traditional	50	1	49	1
12328	STD-12	12	2.3	Traditional	50	1	49	1
12333	STD-12	12	2.3	Traditional	50	1	49	1
12337	STD-12	12	2.3	Traditional	50	1	39	1
12339	STD-12	12	2.3	Traditional	0	0	49	1
12343	STD-12	12	2.3	Traditional	50	1	49	1
12344	KW-16	16	2.3	Kleverwise	100	1	49	1
12351	STD-12	12	2.3	Traditional	50	1	49	1
12353	KW-16	16	2.3	Kleverwise	100	1	49	1
12356	KW-16	16	2.3	Kleverwise	100	1	49	1
12366	KW-16	16	2.3	Kleverwise	100	1	49	1
12370	KW-16	16	2.25	Kleverwise	100	1	49	1
12371	STD-12	12	2.3	Traditional	50	1	49	1
12378	STD-12	12	2.3	Traditional	50	1	49	1
12387	KW-16	16	2.3	Kleverwise	100	1	49	1
12392	KW-16	16	2.3	Kleverwise	100	1	49	1
12394	KW-16	16	2.3	Kleverwise	100	1	49	1
12395	KW-16	16	2.25	Kleverwise	0	1	49	1
12395	KW-16	16	2.25	Kleverwise	100	1	49	1
12396	KW-16	16	2.3	Kleverwise	100	1	49	1
12408	KW-16	16	2.3	Kleverwise	100	1	49	1
12417	STD-12	12	2.3	Traditional	50	1	49	1
12427	KW-16	16	2	Kleverwise	100	1	49	1
12430	KW-16	16	2.25	Kleverwise	100	1	49	1
12433	STD-12	12	2.3	Traditional	50	1	49	1
12440	KWC	16	2.3	KWChoice	100	1	49	1
12445	KW-16	16	2.3	Kleverwise	100	1	49	1
12455	STD-12	12	2.3	Traditional	50	1	39	1
12463	KW-16	16	2.3	Kleverwise	100	1	49	1
12465	KW-16	16	2.25	Kleverwise	100	1	49	1
12467	STD-12	12	2.3	Traditional	50	1	49	1
12469	STD-12	12	2.3	Traditional	50	1	49	1
12477	STD-12	12	2.3	Traditional	50	1	49	1
12481	STD-12	12	2.3	Traditional	50	1	25	1
12482	KW-16	16	2.25	Kleverwise	100	1	49	1
12484	KW-16	16	2.3	Kleverwise	100	1	25	1
12492	KW-16	16	2.3	Kleverwise	100	1	49	1
12496	KW-16	16	2.3	Kleverwise	100	1	49	1
12498	STD-12	12	2.3	Traditional	50	1	49	1
12499	KW-16	16	2.3	Kleverwise	100	1	49	1
12500	KW-16	16	2.3	Kleverwise	100	1	49	1
12516	STD-12	12	2.3	Traditional	50	1	49	1
12518	STD-12	12	2.3	Traditional	50	1	49	1
12521	STD-12	12	2.3	Traditional	0	0	49	1
12522	KW-16	16	2.3	Kleverwise	100	1	49	1
12525	KW-16	16	2.3	Kleverwise	100	1	49	1
12536	STD-12	12	2.3	Traditional	50	1	49	1
12544	KW-16	16	2.3	Kleverwise	100	1	49	1
12549	KW-16	16	2.3	Kleverwise	50	1	40	1
12550	KW-16	16	2.25	Kleverwise	0	0	49	1
12553	KW-16	16	2.3	Kleverwise	100	1	49	1
12554	KW-16	16	2.3	Kleverwise	100	1	49	1
12555	STD-12	12	2.3	Traditional	50	1	49	1
12558	KW-16	16	2.25	Kleverwise	100	1	49	1
12564	STD-12	12	2.3	Traditional	50	1	49	1
12569	STD-12	12	2.3	Traditional	50	1	49	1
12572	STD-12	12	2.3	Traditional	50	1	49	1
12573	KW-16	16	2.3	Kleverwise	100	1	49	1
12577	KW-16	16	2.25	Kleverwise	100	1	49	1
12579	KW-16	16	2.3	Kleverwise	100	1	49	1
12582	KW-16	16	2.3	Kleverwise	100	1	49	1
12592	KW-16	16	2.3	Kleverwise	100	1	49	1
12594	STD-12	12	2.3	Traditional	50	1	49	1
12595	KW-16	16	2.3	Kleverwise	100	1	49	1
12596	KW-16	16	2.3	Kleverwise	100	1	49	1
12604	KW-16	16	2.25	Kleverwise	100	1	49	1
12617	STD-12	12	2.25	Traditional	0	1	49	1
12619	KW-16	16	2.3	Kleverwise	100	1	49	1
12623	KW-16	16	2.3	Kleverwise	100	1	49	1
12624	KW-16	16	2.3	Kleverwise	100	1	49	1
12625	KW-16	16	2.3	Kleverwise	100	1	49	1
12626	KW-16	16	2.3	Kleverwise	100	1	49	1
12633	KW-16	16	2.3	Kleverwise	100	1	49	1
12650	STD-12	12	2.3	Traditional	50	1	49	1
12654	KW-16	16	2.3	Kleverwise	100	1	49	1
12665	KW-16	16	2.3	Kleverwise	100	1	49	1
12668	STD-12	12	2.3	Traditional	50	1	49	1
12670	STD-12	12	2.3	Traditional	50	1	49	1
12672	STD-12	12	2.25	Traditional	0	1	39	1
12673	KW-16	16	2.3	Kleverwise	100	1	49	1
12676	KW-16	16	2.25	Kleverwise	100	1	49	1
12677	KW-16	16	2.25	Kleverwise	100	1	49	1
12679	KW-16	16	2.25	Kleverwise	100	1	49	1
12681	KW-16	16	2.25	Kleverwise	100	1	49	1
12682	KW-16	16	2	Kleverwise	100	1	49	1
12685	KW-16	16	2.3	Kleverwise	100	1	49	1
12686	STD-12	12	2.3	Traditional	50	1	39	1
12693	KW-16	16	2.3	Kleverwise	100	1	49	1
12694	STD-12	12	2	Traditional	50	1	39	1
12695	STD-12	12	2.3	Traditional	50	1	49	1
12699	KW-16	16	2.25	Kleverwise	100	1	49	1
12701	KW-16	16	2.25	Kleverwise	100	1	49	1
12706	STD-12	12	2.3	Traditional	50	1	49	1
12730	KW-16	16	2.3	Kleverwise	100	1	5	1
12735	KW-16	16	2.3	Kleverwise	100	1	49	1
12736	STD-12	12	2.3	Traditional	50	1	39	1
12745	KW-16	16	2.3	Kleverwise	100	1	49	1
12746	KW-16	16	2.3	Kleverwise	100	1	49	1
12749	KW-16	16	2.3	Kleverwise	100	1	49	1
12754	KW-16	16	2.25	Kleverwise	0	0	49	1
12766	STD-12	12	2.3	Traditional	50	1	49	1
12770	KW-16	16	2.3	Kleverwise	100	1	49	1
12774	STD-12	12	2.3	Traditional	0	0	49	1
12776	STD-12	12	2.3	Traditional	50	1	49	1
12777	STD-12	12	2.3	Traditional	50	1	49	1
12779	STD-12	12	2.3	Traditional	50	1	49	1
12780	KW-16	16	2.25	Kleverwise	100	1	49	1
12782	KW-16	16	2.25	Kleverwise	0	0	49	1
12783	STD-12	12	2.3	Traditional	50	1	49	1
12789	KW-16	16	2.3	Kleverwise	100	1	49	1
12794	STD-12	12	2.3	Traditional	50	1	25	1
12812	STD-12	12	2.3	Traditional	50	1	25	1
12815	STD-12	12	2.3	Traditional	50	1	49	1
12829	STD-12	12	2	Traditional	50	1	39	1
12833	STD-12	12	2.3	Traditional	50	1	25	1
12846	KW-16	16	2.3	Kleverwise	100	1	49	1
12853	STD-12	12	2.3	Traditional	50	1	39	1
12867	KW-16	16	2.25	Kleverwise	100	1	49	1
12873	STD-12	12	2.25	Traditional	0	1	39	1
12874	KW-16	16	2.3	Kleverwise	100	1	49	1
12879	KW-16	16	2.3	Kleverwise	100	1	49	1
12882	KW-16	16	2.3	Kleverwise	100	1	49	1
12883	KW-16	16	2.3	Kleverwise	100	1	49	1
12895	KW-16	16	2.25	Kleverwise	100	1	49	1
12896	STD-12	12	2.25	Traditional	0	1	39	1
12897	STD-12	12	2	Traditional	50	1	49	1
12901	KW-16	16	2.25	Kleverwise	100	1	49	1
12902	KW-16	16	2.3	Kleverwise	100	1	49	1
12903	KW-16	16	2.3	Kleverwise	100	1	49	1
12904	KW-16	16	2.3	Kleverwise	0	0	49	1
12905	KW-16	16	2.3	Kleverwise	100	1	49	1
12907	KW-16	16	2.3	Kleverwise	100	1	49	1
12908	KW-16	16	2.3	Kleverwise	100	1	49	1
12909	KW-16	16	2.3	Kleverwise	100	1	49	1
12910	KW-16	16	2.3	Kleverwise	100	1	49	1
12911	KW-16	16	2.3	Kleverwise	100	1	49	1
12912	KW-16	16	2.3	Kleverwise	100	1	49	1
12913	KW-16	16	2.3	Kleverwise	100	1	49	1
12914	KW-16	16	2.3	Kleverwise	0	0	49	1
12915	KWC	16	2.3	KWChoice	100	1	49	1
12916	KW-16	16	2.3	Kleverwise	0	0	49	1
12917	KW-16	16	2.3	Kleverwise	100	1	49	1
12918	KW-16	16	2.3	Kleverwise	0	0	49	1
12919	KW-16	16	2.3	Kleverwise	0	0	49	1
12920	KW-16	16	2.3	Kleverwise	100	1	49	1
12921	KW-16	16	2.3	Kleverwise	100	1	49	1
12922	KWC	16	2.3	KWChoice	100	1	49	1
12923	KWC	16	2.3	KWChoice	100	1	49	1
12924	KW-16	16	2.3	Kleverwise	100	1	49	1
12925	KW-16	16	2.3	Kleverwise	0	0	49	1
12927	KW-16	16	2.3	Kleverwise	100	1	49	1
12929	KW-16	16	2.3	Kleverwise	0	0	49	1
12930	STD-12	12	2.3	Traditional	50	1	39	1
12933	KW-16	16	2	Kleverwise	100	1	49	1
12943	KW-16	16	2.3	Kleverwise	100	1	49	1
12956	KW-16	16	2.3	Kleverwise	100	1	49	1
12959	KW-16	16	2.3	Kleverwise	100	1	49	1
12978	STD-12	12	2.3	Traditional	50	1	39	1
12987	STD-12	12	2.25	Traditional	0	1	39	1
12993	KW-16	16	2.25	Kleverwise	100	1	49	1
13001	KW-16	16	2.3	Kleverwise	100	1	39	1
13002	KW-16	16	2.25	Kleverwise	0	0	49	1
13009	STD-12	12	2.3	Traditional	50	1	49	1
13012	KWC	16	2.3	KWChoice	100	1	49	1
13020	STD-12	12	2.25	Traditional	100	1	49	1
13022	KW-16	16	2.25	Kleverwise	0	0	49	1
13026	KW-16	16	2.3	Kleverwise	100	1	49	1
13027	KW-16	16	2.3	Kleverwise	100	1	49	1
13038	STD-12	12	2.3	Traditional	50	1	49	1
13040	KWC	16	2.3	KWChoice	100	1	49	1
13043	STD-12	12	2.3	Traditional	50	1	49	1
13045	STD-12	12	2.3	Traditional	50	1	49	1
13046	STD-12	12	2.3	Traditional	50	1	25	1
13051	KW-16	16	2.25	Kleverwise	100	1	49	1
13057	KW-16	16	2.25	Kleverwise	100	1	49	1
13060	KW-16	16	2.25	Kleverwise	100	1	49	1
13065	KW-16	16	2.3	Kleverwise	100	1	49	1
13066	KW-16	16	2.3	Kleverwise	100	1	49	1
13069	KW-16	16	2.25	Kleverwise	100	1	49	1
13074	STD-12	12	2.3	Traditional	50	1	49	1
13080	KW-16	16	2.3	Kleverwise	100	1	49	1
13087	KWC	16	2.3	KWChoice	100	1	49	1
13092	KW-16	16	2.3	Kleverwise	100	1	49	1
13093	KW-16	16	2.3	Kleverwise	100	1	49	1
13094	KW-16	16	2.25	Kleverwise	100	1	49	1
13095	KW-16	16	2.3	Kleverwise	100	1	49	1
13097	KW-16	16	2.3	Kleverwise	100	1	49	1
13098	KW-16	16	2.3	Kleverwise	100	1	49	1
13099	KW-16	16	2	Kleverwise	100	1	49	1
13107	KW-16	16	2.3	Kleverwise	100	1	49	1
13109	KW-16	16	2.25	Kleverwise	0	0	49	1
13122	KW-16	16	2.3	Kleverwise	100	1	49	1
13139	STD-12	12	2.1	Traditional	50	1	25	1
13140	STD-12	12	2.1	Traditional	50	1	25	1
13160	KWC	16	2.3	KWChoice	100	1	49	1
13161	KWC	16	2.3	KWChoice	100	1	49	1
13162	KWC	16	2.3	KWChoice	100	1	49	1
13164	KW-16	16	2.25	Kleverwise	100	1	49	1
13172	STD-12	12	2.3	Traditional	50	1	39	1
13189	KW-16	16	2.25	Kleverwise	100	1	49	1
13194	KW-16	16	2.3	Kleverwise	100	1	49	1
13202	KW-16	16	2.3	Kleverwise	100	1	49	1
13214	KW-16	16	2	Kleverwise	50	1	25	1
13230	KWC	16	2.3	KWChoice	100	1	49	1
13233	STD-12	12	2.25	Traditional	0	1	49	1
13237	KW-16	16	2.3	Kleverwise	100	1	49	1
13238	STD-12	12	2.3	Traditional	50	1	25	1
13241	KW-16	16	2.3	Kleverwise	100	1	49	1
13248	KWC	16	2.3	KWChoice	100	1	49	1
13252	KW-16	16	2	Kleverwise	100	1	49	1
13253	STD-12	12	2	Traditional	50	1	49	1
13254	STD-12	12	2	Traditional	50	1	39	1
13255	STD-12	12	2.3	Traditional	50	1	49	1
13259	STD-12	12	2.3	Traditional	50	1	39	1
13261	STD-12	12	2.3	Traditional	50	1	39	1
13264	KW-16	16	2.25	Kleverwise	100	1	49	1
13266	KW-16	16	2.25	Kleverwise	0	1	49	1
13271	STD-12	12	2.3	Traditional	50	1	49	1
13272	KW-16	16	2.3	Kleverwise	100	1	49	1
13280	KWC	16	2.3	KWChoice	100	1	49	1
13281	KW-16	16	2.3	Kleverwise	100	1	49	1
13291	STD-12	12	2.3	Traditional	100	1	49	1
13293	STD-12	12	2.3	Traditional	50	1	49	1
13299	KW-16	16	2.25	Kleverwise	100	1	49	1
13306	STD-12	12	2.3	Traditional	50	1	49	1
13309	KW-16	16	2.3	Kleverwise	100	1	49	1
13314	KW-16	16	2.3	Kleverwise	0	0	25	1
13315	KW-16	16	2.25	Kleverwise	100	1	49	1
13332	KW-16	16	2.25	Kleverwise	100	1	49	1
13333	STD-12	12	2.3	Traditional	50	1	49	1
13335	KW-16	16	2.3	Kleverwise	100	1	49	1
13337	KW-16	16	2.3	Kleverwise	100	1	49	1
13338	STD-12	12	2.3	Traditional	0	0	49	1
13339	STD-12	12	2.3	Traditional	50	1	49	1
13342	STD-12	12	2.3	Traditional	50	1	49	1
13349	STD-12	12	2.3	Traditional	50	1	49	1
13350	KW-16	16	2.3	Kleverwise	100	1	49	1
13351	STD-12	12	2.3	Traditional	50	1	49	1
13353	STD-12	12	2.3	Traditional	50	1	49	1
13355	STD-12	12	2.3	Traditional	50	1	49	1
13362	KW-16	16	2.25	Kleverwise	100	1	49	1
13364	KW-16	16	2.3	Kleverwise	100	1	49	1
13366	KW-16	16	2.3	Kleverwise	100	1	49	1
13377	STD-12	12	2.3	Traditional	50	1	25	1
13386	KWC	16	2.3	KWChoice	100	1	49	1
13392	STD-12	12	2.25	Traditional	100	1	49	1
13396	KW-16	16	2.3	Kleverwise	100	1	49	1
13402	KW-16	16	2.25	Kleverwise	100	1	49	1
13405	STD-12	12	2.3	Traditional	50	1	49	1
13406	KW-16	16	2.25	Kleverwise	100	1	49	1
13408	STD-12	12	2.3	Traditional	50	1	49	1
13409	KW-16	16	2.3	Kleverwise	100	1	49	1
13415	STD-12	12	2.3	Traditional	50	1	49	1
13418	KW-16	16	2.25	Kleverwise	100	1	49	1
13425	KW-16	16	2.3	Kleverwise	100	1	49	1
13426	KW-16	16	2.3	Kleverwise	100	1	25	1
13427	STD-12	12	2.1	Traditional	50	1	25	1
13433	KW-16	16	2	Kleverwise	100	1	49	1
13435	KWC	16	2.3	KWChoice	100	1	49	1
13438	KW-16	16	2.25	Kleverwise	0	0	49	1
13439	KW-16	16	2.25	Kleverwise	100	1	49	1
13443	STD-12	12	2.3	Traditional	50	1	49	1
13454	KW-16	16	2	Kleverwise	100	1	49	1
13466	KW-16	16	2.25	Kleverwise	100	1	49	1
13467	KW-16	16	2.3	Kleverwise	100	1	49	1
13472	KW-16	16	2.25	Kleverwise	100	1	49	1
13473	STD-12	12	2.3	Traditional	50	1	49	1
13475	STD-12	12	2.3	Traditional	50	1	39	1
13476	KW-16	16	2.25	Kleverwise	100	1	49	1
13478	KW-16	16	2.3	Kleverwise	100	1	49	1
13481	KW-16	16	2.3	Kleverwise	0	0	49	1
13483	STD-12	12	2.3	Traditional	50	1	49	1
13484	STD-12	12	2.3	Traditional	100	1	49	1
13486	STD-12	12	2.3	Traditional	50	1	49	1
13487	KW-16	16	2.25	Kleverwise	100	1	49	1
13495	KW-16	16	2.3	Kleverwise	100	1	49	1
13496	STD-12	12	2.3	Traditional	50	1	49	1
13497	KW-16	16	2.3	Kleverwise	100	1	49	1
13499	KW-16	16	2.25	Kleverwise	0	0	49	1
13502	STD-12	12	2.3	Traditional	50	1	49	1
13503	KW-16	16	2.25	Kleverwise	100	1	49	1
13505	KW-16	16	2.3	Kleverwise	0	0	49	1
13506	KW-16	16	2.3	Kleverwise	100	1	49	1
13507	KW-16	16	2.3	Kleverwise	0	0	49	1
13508	KW-16	16	2.3	Kleverwise	0	0	49	1
13509	KW-16	16	2.3	Kleverwise	100	1	49	1
13510	KW-16	16	2.3	Kleverwise	100	1	49	1
13511	KW-16	16	2.3	Kleverwise	0	0	49	1
13512	KW-16	16	2.3	Kleverwise	0	0	49	1
13513	KW-16	16	2.3	Kleverwise	0	0	49	1
13514	KW-16	16	2.3	Kleverwise	100	1	49	1
13515	KW-16	16	2.3	Kleverwise	100	1	49	1
13516	KW-16	16	2.3	Kleverwise	0	0	49	1
13517	KW-16	16	2.3	Kleverwise	0	0	49	1
13518	KWC	16	2.3	KWChoice	100	1	49	1
13519	KWC	16	2.3	KWChoice	100	1	49	1
13520	KWC	16	2.3	KWChoice	100	1	49	1
13521	KW-16	16	2.3	Kleverwise	0	0	49	1
13522	KW-16	16	2.3	Kleverwise	100	1	49	1
13523	KW-16	16	2.3	Kleverwise	100	1	49	1
13524	KW-16	16	2.3	Kleverwise	0	0	49	1
13525	KWC	16	2.3	KWChoice	100	1	49	1
13526	KW-16	16	2.3	Kleverwise	0	0	49	1
13527	KW-16	16	2.3	Kleverwise	0	0	49	1
13528	KW-16	16	2.3	Kleverwise	0	0	49	1
13529	KW-16	16	2.3	Kleverwise	100	1	49	1
13530	KWC	16	2.3	KWChoice	100	1	49	1
13531	KW-16	16	2.3	Kleverwise	100	1	49	1
13532	KW-16	16	2.3	Kleverwise	0	0	49	1
13533	KW-16	16	2.3	Kleverwise	0	0	49	1
13534	KW-16	16	2.3	Kleverwise	0	0	49	1
13535	KWC	16	2.3	KWChoice	100	1	49	1
13536	KWC	16	2.3	KWChoice	100	1	49	1
13537	STD-12	12	2.3	Traditional	50	1	49	1
13538	KW-16	16	2.3	Kleverwise	100	1	49	1
13539	KW-16	16	2.3	Kleverwise	100	1	49	1
13540	KW-16	16	2.3	Kleverwise	0	0	49	1
13541	KW-16	16	2.3	Kleverwise	100	1	49	1
13542	KWC	16	2.3	KWChoice	100	1	49	1
13543	KW-16	16	2.3	Kleverwise	0	0	49	1
13544	KWC	16	2.3	KWChoice	100	1	49	1
13545	KW-16	16	2.3	Kleverwise	100	1	49	1
13546	KW-16	16	2.3	Kleverwise	100	1	49	1
13547	KWC	16	2.3	KWChoice	100	1	49	1
13548	KW-16	16	2.3	Kleverwise	100	1	49	1
13549	KW-16	16	2.3	Kleverwise	100	1	49	1
13550	KW-16	16	2.3	Kleverwise	100	1	49	1
13551	KW-16	16	2.3	Kleverwise	100	1	49	1
13552	KW-16	16	2.3	Kleverwise	0	0	49	1
13553	KW-16	16	2.3	Kleverwise	100	1	49	1
13554	KW-16	16	2.3	Kleverwise	100	1	49	1
13556	KW-16	16	2.3	Kleverwise	100	1	49	1
13557	KW-16	16	2.3	Kleverwise	100	1	49	1
13558	KW-16	16	2.3	Kleverwise	100	1	49	1
13559	KW-16	16	2.3	Kleverwise	100	1	49	1
13560	KW-16	16	2.3	Kleverwise	0	0	49	1
13561	KW-16	16	2.3	Kleverwise	100	1	49	1
13562	KW-16	16	2.3	Kleverwise	0	0	49	1
13563	KW-16	16	2.3	Kleverwise	0	0	49	1
13564	KW-16	16	2.3	Kleverwise	0	0	49	1
13565	KW-16	16	2.3	Kleverwise	100	1	49	1
13566	KW-16	16	2.3	Kleverwise	0	0	49	1
13567	KW-16	16	2.3	Kleverwise	0	0	49	1
13568	KW-16	16	2.3	Kleverwise	0	0	49	1
13569	KW-16	16	2.3	Kleverwise	0	0	49	1
13570	KW-16	16	2.3	Kleverwise	100	1	49	1
13571	KW-16	16	2.3	Kleverwise	100	1	49	1
13572	KW-16	16	2.3	Kleverwise	100	1	49	1
13573	KW-16	16	2.3	Kleverwise	0	0	49	1
13574	KW-16	16	2.3	Kleverwise	0	0	49	1
13576	KW-16	16	2.3	Kleverwise	100	1	49	1
13577	KW-16	16	2.3	Kleverwise	100	1	49	1
13578	KW-16	16	2.3	Kleverwise	0	0	49	1
13579	KW-16	16	2.3	Kleverwise	100	1	49	1
13580	KW-16	16	2.3	Kleverwise	0	0	49	1
13581	KW-16	16	2.3	Kleverwise	0	0	49	1
13582	KW-16	16	2.3	Kleverwise	100	1	49	1
13584	KW-16	16	2.3	Kleverwise	0	0	49	1
13585	KW-16	16	2.3	Kleverwise	100	1	49	1
13588	KW-16	16	2.3	Kleverwise	100	1	49	1
13590	KW-16	16	2.3	Kleverwise	100	1	49	1
13592	KW-16	16	2.25	Kleverwise	100	1	49	1
13593	KW-16	16	2.3	Kleverwise	100	1	49	1
13594	KW-16	16	2.3	Kleverwise	100	1	49	1
13595	STD-12	12	2.3	Traditional	50	1	49	1
13597	STD-12	12	2.3	Traditional	50	1	49	1
13600	STD-12	12	2.3	Traditional	50	1	49	1
13601	KW-16	16	2.3	Kleverwise	100	1	49	1
13605	KW-16	16	2.25	Kleverwise	100	1	49	1
13610	KW-16	16	2.25	Kleverwise	100	1	49	1
13611	KW-16	16	2.3	Kleverwise	100	1	49	1
13616	STD-12	12	2.3	Traditional	50	1	49	1
13618	KW-16	16	2.3	Kleverwise	100	1	49	1
13619	STD-12	12	2.3	Traditional	50	1	49	1
13620	KW-16	16	2.3	Kleverwise	100	1	49	1
13621	KW-16	16	2.25	Kleverwise	100	1	49	1
13623	KW-16	16	2.25	Kleverwise	100	1	49	1
13624	KW-16	16	2.25	Kleverwise	100	1	49	1
13625	KW-16	16	2.25	Kleverwise	100	1	49	1
13628	KW-16	16	2.25	Kleverwise	25	1	25	1
13629	KW-16	16	2	Kleverwise	100	1	49	1
13635	STD-12	12	2.3	Traditional	50	1	49	1
13636	KW-16	16	2.3	Kleverwise	0	0	49	1
13637	KW-16	16	2.25	Kleverwise	100	1	49	1
13638	KW-16	16	2.25	Kleverwise	100	1	49	1
13639	KW-16	16	2.25	Kleverwise	100	1	49	1
13640	KW-16	16	2.25	Kleverwise	100	1	49	1
13641	KW-16	16	2.25	Kleverwise	100	1	49	1
13642	KW-16	16	2.25	Kleverwise	100	1	49	1
13647	STD-12	12	2.25	Traditional	10	1	49	1
13653	KW-16	16	2.25	Kleverwise	0	0	49	1
13655	KW-16	16	2.25	Kleverwise	0	0	49	1
13657	KW-16	16	2.25	Kleverwise	100	1	49	1
13663	KW-16	16	2	Kleverwise	50	1	49	1
13665	STD-12	12	2.3	Traditional	50	1	49	1
13666	STD-12	12	2.3	Traditional	50	1	49	1
13667	KW-16	16	2.3	Kleverwise	100	1	49	1
13668	STD-12	12	2.3	Traditional	50	1	49	1
13669	STD-12	12	2.3	Traditional	50	1	49	1
13670	STD-12	12	2.3	Traditional	50	1	49	1
13671	STD-12	12	2.3	Traditional	50	1	49	1
13672	STD-12	12	2.3	Traditional	50	1	49	1
13673	STD-12	12	2.3	Traditional	50	1	49	1
13674	STD-12	12	2.3	Traditional	50	1	49	1
13675	STD-12	12	2.3	Traditional	50	1	49	1
13676	STD-12	12	2.3	Traditional	50	1	49	1
13677	STD-12	12	2.3	Traditional	50	1	49	1
13688	KW-16	16	2.3	Kleverwise	0	0	49	1
13696	KWC	16	2.3	KWChoice	100	1	49	1
13698	STD-12	12	2.3	Traditional	50	1	49	1
13703	KW-16	16	2.3	Kleverwise	100	1	49	1
13713	KW-16	16	2.3	Kleverwise	0	0	49	1
13715	STD-12	12	2.3	Traditional	50	1	49	1
13718	KW-16	16	2.25	Kleverwise	100	1	49	1
13719	KW-16	16	2.25	Kleverwise	100	1	49	1
13723	KW-16	16	2.25	Kleverwise	0	0	49	1
13734	KWC	16	2.3	KWChoice	100	1	49	1
13736	KW-16	16	2.25	Kleverwise	100	1	49	1
13741	KW-16	16	2.25	Kleverwise	0	0	49	1
13742	KW-16	16	2.25	Kleverwise	100	1	49	1
13753	KW-16	16	2.25	Kleverwise	100	1	49	1
13761	STD-12	12	2.3	Traditional	50	1	49	1
13768	KW-16	16	2.25	Kleverwise	100	1	49	1
13770	KW-16	16	2.25	Kleverwise	100	1	49	1
13799	KW-16	16	2.3	Kleverwise	100	1	49	1
13804	KW-16	16	2.3	Kleverwise	100	1	49	1
13807	KW-16	16	2.25	Kleverwise	100	1	49	1
13814	KW-16	16	2	Kleverwise	100	1	49	1
13815	KW-16	16	2.25	Kleverwise	100	1	49	1
13816	KW-16	16	2.3	Kleverwise	100	1	49	1
13818	STD-12	12	2.25	Traditional	100	1	49	1
13837	KW-16	16	2.3	Kleverwise	100	1	49	1
13838	STD-12	12	2.3	Traditional	50	1	39	1
13839	STD-12	12	2.25	Traditional	100	1	49	1
13842	KW-16	16	2	Kleverwise	50	1	49	1
13845	KW-16	16	2.25	Kleverwise	0	1	49	1
13856	KW-16	16	2	Kleverwise	100	1	49	1
13861	STD-12	12	2.3	Traditional	50	1	25	1
13872	STD-12	12	2.3	Traditional	50	1	39	1
13882	KW-16	16	2	Kleverwise	50	1	49	1
13883	KW-16	16	2.25	Kleverwise	100	1	49	1
13886	KW-16	16	2.25	Kleverwise	100	1	49	1
13887	KW-16	16	2.3	Kleverwise	100	1	49	1
13888	KW-16	16	2.25	Kleverwise	100	1	49	1
13892	STD-12	12	2.3	Traditional	0	0	49	1
13902	STD-12	12	2	Traditional	50	1	49	1
13910	KW-16	16	2.3	Kleverwise	50	1	49	1
13919	KW-16	16	2.25	Kleverwise	0	1	49	1
13923	KW-16	16	2.3	Kleverwise	100	1	49	1
13924	STD-12	12	2.3	Traditional	0	0	25	1
13925	KW-16	16	2.25	Kleverwise	100	1	49	1
13927	KW-16	16	2.25	Kleverwise	0	1	49	1
13929	STD-12	12	2.3	Traditional	50	1	25	1
13931	STD-12	12	2.3	Traditional	50	1	25	1
13932	KW-16	16	2.3	Kleverwise	100	1	49	1
13933	KW-16	16	2.25	Kleverwise	0	0	49	1
13937	STD-12	12	2.3	Traditional	0	0	49	1
13939	KW-16	16	2.25	Kleverwise	100	1	49	1
13942	STD-12	12	2	Traditional	50	1	39	1
13943	STD-12	12	2.3	Traditional	50	1	49	1
13945	KW-16	16	2.3	Kleverwise	100	1	49	1
13946	KW-16	16	2.25	Kleverwise	0	0	49	1
13947	STD-12	12	2.3	Traditional	50	1	25	1
13955	STD-12	12	2	Traditional	50	1	25	1
13956	STD-12	12	2	Traditional	50	1	25	1
13957	STD-12	12	2	Traditional	50	1	25	1
13964	STD-12	12	2.3	Traditional	50	1	49	1
13971	STD-12	12	2.3	Traditional	50	1	25	1
13973	STD-12	12	2.3	Traditional	50	1	49	1
13977	KW-16	16	2.25	Kleverwise	100	1	49	1
13986	STD-12	12	2.3	Traditional	50	1	39	1
13987	KW-16	16	2.25	Kleverwise	100	1	49	1
13988	KW-16	16	2.25	Kleverwise	100	1	49	1
13994	KW-16	16	2.25	Kleverwise	100	1	49	1
14003	KW-16	16	2	Kleverwise	50	1	25	1
14005	STD-12	12	2	Traditional	50	1	25	1
14007	STD-12	12	2.25	Traditional	0	1	49	1
14016	KW-16	16	2.25	Kleverwise	100	1	49	1
14017	KW-16	16	2.25	Kleverwise	100	1	49	1
14018	KW-16	16	2	Kleverwise	100	1	49	1
14032	KWC	16	2.3	KWChoice	100	1	49	1
14033	KWC	16	2.3	KWChoice	100	1	49	1
14034	KW-16	16	2.3	Kleverwise	100	1	49	1
14035	KW-16	16	2.3	Kleverwise	100	1	49	1
14041	KW-16	16	2.3	Kleverwise	100	1	49	1
14042	KW-16	16	2.3	Kleverwise	100	1	49	1
14047	KW-16	16	2.3	Kleverwise	0	0	49	1
14048	KW-16	16	2.3	Kleverwise	0	0	49	1
14049	KW-16	16	2.3	Kleverwise	0	0	49	1
14051	STD-12	12	2.3	Traditional	50	1	49	1
14055	STD-12	12	2.3	Traditional	50	1	49	1
14056	KW-16	16	2.3	Kleverwise	100	1	49	1
14057	STD-12	12	2.3	Traditional	50	1	49	1
14058	STD-12	12	2.3	Traditional	50	1	49	1
14060	STD-12	12	2.3	Traditional	50	1	49	1
14065	STD-12	12	2.25	Traditional	0	1	49	1
14067	STD-12	12	2.25	Traditional	50	1	49	1
14068	STD-12	12	2.25	Traditional	50	1	49	1
14069	STD-12	12	2.3	Traditional	50	1	49	1
14070	STD-12	12	2.3	Traditional	50	1	49	1
14071	STD-12	12	2.3	Traditional	50	1	49	1
14072	STD-12	12	2.25	Traditional	50	1	49	1
14073	KW-16	16	2.25	Kleverwise	0	0	49	1
14075	STD-12	12	2.3	Traditional	50	1	49	1
14076	STD-12	12	2.3	Traditional	50	1	49	1
14078	KWC	16	2.3	KWChoice	100	1	49	1
14080	STD-12	12	2	Traditional	50	1	25	1
14081	KW-16	16	2.3	Kleverwise	100	1	49	1
14086	STD-12	12	2.3	Traditional	50	1	25	1
14090	KW-16	16	2.25	Kleverwise	0	1	49	1
14097	STD-12	12	2.3	Traditional	50	1	49	1
14098	KW-16	16	2.25	Kleverwise	100	1	49	1
14101	KW-16	16	2.3	Kleverwise	100	1	49	1
14104	KW-16	16	2.3	Kleverwise	100	1	49	1
14110	KWC	16	1.75	KWChoice	0	0	49	1
14112	KW-16	16	2.3	Kleverwise	100	1	49	1
14115	KW-16	16	2.3	Kleverwise	100	1	49	1
14117	KW-16	16	2.25	Kleverwise	100	1	49	1
14118	KW-16	16	2.3	Kleverwise	0	0	49	1
14120	KW-16	16	2.25	Kleverwise	100	1	49	1
14128	KWC	16	2.3	KWChoice	100	1	49	1
14131	STD-12	12	2.3	Traditional	50	1	25	1
14132	KW-16	16	2.25	Kleverwise	0	1	49	1
14134	KWC	16	2.3	KWChoice	100	1	49	1
14135	KWC	16	2.3	KWChoice	100	1	49	1
14136	KW-16	16	2.25	Kleverwise	0	0	49	1
14137	KW-16	16	2.25	Kleverwise	100	1	49	1
14138	KW-16	16	2.25	Kleverwise	100	1	49	1
14139	KW-16	16	2.25	Kleverwise	0	0	49	1
14140	KW-16	16	2.25	Kleverwise	100	1	49	1
14143	KW-16	16	2.25	Kleverwise	100	1	49	1
14146	STD-12	12	2.3	Traditional	50	1	40	1
14148	STD-12	12	2.3	Traditional	50	1	25	1
14149	KW-16	16	2.25	Kleverwise	0	1	49	1
14152	KW-16	16	2.3	Kleverwise	100	1	49	1
14153	KW-16	16	2.25	Kleverwise	100	1	49	1
14154	STD-12	12	2	Traditional	50	1	25	1
14155	STD-12	12	2	Traditional	50	1	25	1
14156	KW-16	16	2.3	Kleverwise	100	1	49	1
14158	KW-16	16	2.3	Kleverwise	100	1	49	1
14159	STD-12	12	2.3	Traditional	50	1	25	1
14160	STD-12	12	2.3	Traditional	50	1	25	1
14162	STD-12	12	2.3	Traditional	50	1	25	1
14163	STD-12	12	2.3	Traditional	50	1	25	1
14174	KWC	16	2.3	KWChoice	100	1	49	1
14178	KW-16	16	2.25	Kleverwise	100	1	49	1
14180	KW-16	16	2.25	Kleverwise	0	0	49	1
14183	KW-16	16	2.25	Kleverwise	100	1	49	1
14184	STD-12	12	2.3	Traditional	0	0	49	1
14188	KW-16	16	2.25	Kleverwise	100	1	49	1
14190	KW-16	16	2.25	Kleverwise	100	1	49	1
14191	KW-16	16	2.3	Kleverwise	100	1	49	1
14196	KW-16	16	2.25	Kleverwise	0	0	49	1
14206	KW-16	16	2.25	Kleverwise	100	1	49	1
14212	STD-12	12	2.1	Traditional	50	1	25	1
14213	STD-12	12	2.25	Traditional	0	1	25	1
14217	STD-12	12	2.25	Traditional	100	1	49	1
14219	KW-16	16	2.3	Kleverwise	100	1	49	1
14222	STD-12	12	2.25	Traditional	50	1	25	1
14223	KW-16	16	2.25	Kleverwise	100	1	49	1
14226	KW-16	16	2.25	Kleverwise	100	1	49	1
14227	KW-16	16	2.25	Kleverwise	100	1	49	1
14230	KW-16	16	2.25	Kleverwise	100	1	49	1
14231	KW-16	16	2.25	Kleverwise	0	0	49	1
14232	STD-12	12	2.1	Traditional	50	1	25	1
14234	KW-16	16	2.25	Kleverwise	100	1	49	1
14237	KW-16	16	2	Kleverwise	100	1	49	1
14243	KW-16	16	2	Kleverwise	100	1	49	1
14244	KW-16	16	2.25	Kleverwise	100	1	49	1
14250	KW-16	16	2.25	Kleverwise	0	0	49	1
14251	KW-16	16	2	Kleverwise	100	1	49	1
14253	KW-16	16	2.25	Kleverwise	100	1	49	1
14262	KW-16	16	2.3	Kleverwise	100	1	49	1
14263	KW-16	16	2.3	Kleverwise	100	1	49	1
14264	KW-16	16	2	Kleverwise	100	1	49	1
14265	STD-12	12	2.3	Traditional	50	1	49	1
14268	KW-16	16	2.3	Kleverwise	100	1	49	1
14269	KW-16	16	2.3	Kleverwise	100	1	49	1
14271	KW-16	16	2.3	Kleverwise	100	1	49	1
14275	KW-16	16	2.25	Kleverwise	0	0	49	1
14276	KW-16	16	2.25	Kleverwise	0	1	49	1
14279	STD-12	12	2.25	Traditional	0	1	25	1
14280	KW-16	16	2.25	Kleverwise	100	1	49	1
14283	KW-16	16	2.25	Kleverwise	0	1	49	1
14285	STD-12	12	2.25	Traditional	0	1	49	1
14287	KW-16	16	2.25	Kleverwise	0	1	49	1
14288	KW-16	16	2.25	Kleverwise	100	1	49	1
14292	KW-16	16	2.3	Kleverwise	100	1	49	1
14295	KW-16	16	2.25	Kleverwise	100	1	49	1
14297	STD-12	12	2	Traditional	50	1	49	1
14299	STD-12	12	2.3	Traditional	50	1	49	1
14302	KW-16	16	2.25	Kleverwise	100	1	49	1
14303	KW-16	16	2.25	Kleverwise	100	1	49	1
14305	KW-16	16	2.25	Kleverwise	100	1	49	1
14316	KW-16	16	2.25	Kleverwise	100	1	49	1
14317	KW-16	16	2.25	Kleverwise	100	1	49	1
14323	STD-12	12	2.25	Traditional	0	1	49	1
14329	KW-16	16	2	Kleverwise	100	1	49	1
14330	KW-16	16	2.25	Kleverwise	100	1	49	1
14335	STD-12	12	2.3	Traditional	50	1	49	1
14343	KW-16	16	2.25	Kleverwise	100	1	49	1
14345	KW-16	16	2.25	Kleverwise	100	1	49	1
14347	KW-16	16	2.3	Kleverwise	50	1	49	1
14350	KWC	16	2.3	KWChoice	100	1	49	1
14353	KW-16	16	2	Kleverwise	100	1	49	1
14354	KWC	16	2.3	KWChoice	100	1	49	1
14359	STD-12	12	2.3	Traditional	50	1	49	1
14360	KW-16	16	2.3	Kleverwise	100	1	49	1
14364	KW-16	16	2.25	Kleverwise	100	1	49	1
14365	KW-16	16	2.25	Kleverwise	100	1	49	1
14366	KW-16	16	2.3	Kleverwise	100	1	49	1
14367	KW-16	16	2.25	Kleverwise	100	1	49	1
14374	KW-16	16	2.3	Kleverwise	50	1	25	1
14385	KW-16	16	2.25	Kleverwise	0	0	49	1
14390	KW-16	16	2.25	Kleverwise	100	1	49	1
14392	KW-16	16	2.25	Kleverwise	0	0	49	1
14394	KW-16	16	2	Kleverwise	100	1	49	1
14399	KW-16	16	2.25	Kleverwise	100	1	49	1
14403	KW-16	16	2.25	Kleverwise	100	1	49	1
14404	KW-16	16	2	Kleverwise	50	1	49	1
14406	KW-16	16	2.25	Kleverwise	0	0	49	1
14407	KW-16	16	2.3	Kleverwise	100	1	49	1
14408	STD-12	12	2.3	Traditional	50	1	25	1
14418	KW-16	16	2.25	Kleverwise	100	1	49	1
14419	KW-16	16	2.3	Kleverwise	100	1	49	1
14420	KW-16	16	2.3	Kleverwise	100	1	49	1
14421	KW-16	16	2.25	Kleverwise	100	1	49	1
14424	KW-16	16	2.3	Kleverwise	100	1	25	1
14427	KW-16	16	2.3	Kleverwise	100	1	49	1
14431	KW-16	16	2.25	Kleverwise	100	1	49	1
14433	KW-16	16	2.25	Kleverwise	100	1	49	1
14439	KW-16	16	2.25	Kleverwise	0	0	49	1
14445	KW-16	16	2	Kleverwise	100	1	49	1
14446	KW-16	16	2.3	Kleverwise	100	1	49	1
14447	KW-16	16	2.25	Kleverwise	100	1	49	1
14448	KW-16	16	2.3	Kleverwise	100	1	25	1
14449	KW-16	16	2.25	Kleverwise	100	1	49	1
14450	KW-16	16	2.25	Kleverwise	100	1	49	1
14451	KW-16	16	2.25	Kleverwise	100	1	49	1
14452	KW-16	16	2.25	Kleverwise	100	1	49	1
14455	STD-12	12	2.3	Traditional	50	1	25	1
14457	STD-12	12	2.3	Traditional	50	1	25	1
14460	KW-16	16	2.25	Kleverwise	100	1	49	1
14462	STD-12	12	2.3	Traditional	50	1	25	1
14466	KW-16	16	2.25	Kleverwise	100	1	49	1
14467	KW-16	16	2.25	Kleverwise	100	1	49	1
14469	KW-16	16	2.25	Kleverwise	100	1	49	1
14472	KW-16	16	2.25	Kleverwise	100	1	49	1
14475	STD-12	12	2.3	Traditional	50	1	25	1
14476	KW-16	16	2.25	Kleverwise	100	1	49	1
14477	STD-12	12	2.3	Traditional	50	1	25	1
14480	KW-16	16	2.3	Kleverwise	100	1	49	1
14481	KW-16	16	2.25	Kleverwise	0	0	49	1
14482	STD-12	12	2.3	Traditional	50	1	25	1
14484	KW-16	16	2	Kleverwise	50	1	25	1
14485	STD-12	12	2.3	Traditional	50	1	49	1
14490	KW-16	16	2	Kleverwise	0	1	40	1
14492	STD-12	12	2.1	Traditional	50	1	25	1
14495	STD-12	12	2.3	Traditional	50	1	25	1
14500	KW-16	16	2.25	Kleverwise	0	0	49	1
14501	KW-16	16	2.25	Kleverwise	100	1	49	1
14503	KW-16	16	2.25	Kleverwise	100	1	49	1
14504	KWC	16	2.3	KWChoice	100	1	49	1
14506	KW-16	16	2.25	Kleverwise	100	1	49	1
14508	STD-12	12	2.1	Traditional	50	1	25	1
14509	KW-16	16	2.1	Kleverwise	50	1	25	1
14510	KW-16	16	2.25	Kleverwise	100	1	25	1
14513	KW-16	16	2.3	Kleverwise	100	1	49	1
14515	KW-16	16	2.3	Kleverwise	100	1	49	1
14516	KW-16	16	2.25	Kleverwise	100	1	49	1
14521	KW-16	16	2.3	Kleverwise	100	1	49	1
14524	STD-12	12	2.3	Traditional	50	1	49	1
14530	STD-12	12	2.25	Traditional	0	1	49	1
14531	KW-16	16	2.25	Kleverwise	100	1	49	1
14532	KW-16	16	2.25	Kleverwise	100	1	49	1
14533	KW-16	16	2.1	Kleverwise	50	1	25	1
14534	KW-16	16	2.25	Kleverwise	100	1	49	1
14542	KW-16	16	2.25	Kleverwise	100	1	49	1
14549	KW-16	16	2.3	Kleverwise	50	1	25	1
14551	KW-16	16	2.3	Kleverwise	100	1	49	1
14552	KW-16	16	2.25	Kleverwise	100	1	49	1
14553	KW-16	16	2.25	Kleverwise	100	1	49	1
14560	KW-16	16	2.3	Kleverwise	100	1	49	1
14562	KW-16	16	2.25	Kleverwise	100	1	49	1
14563	KW-16	16	2.25	Kleverwise	100	1	49	1
14564	KW-16	16	2.25	Kleverwise	100	1	49	1
14570	STD-12	12	2.25	Traditional	0	1	49	1
14571	STD-12	12	2.3	Traditional	50	1	49	1
14575	KW-16	16	2.25	Kleverwise	100	1	49	1
14577	KW-16	16	2.25	Kleverwise	100	1	49	1
14578	KW-16	16	2.25	Kleverwise	100	1	49	1
14583	KW-16	16	2	Kleverwise	100	1	49	1
14585	STD-12	12	2.3	Traditional	50	1	25	1
14586	STD-12	12	2.3	Traditional	50	1	25	1
14588	KW-16	16	2.25	Kleverwise	100	1	49	1
14589	STD-12	12	2.1	Traditional	50	1	25	1
14591	KW-16	16	2.25	Kleverwise	0	0	49	1
14595	KW-16	16	2.3	Kleverwise	0	0	49	1
14597	KW-16	16	2.25	Kleverwise	100	1	49	1
14601	KW-16	16	2.3	Kleverwise	100	1	49	1
14603	STD-12	12	2.3	Traditional	50	1	49	1
14606	KW-16	16	2.25	Kleverwise	100	1	49	1
14613	KW-16	16	2.3	Kleverwise	100	1	49	1
14615	KWC	16	2.3	KWChoice	100	1	49	1
14621	KW-16	16	2.3	Kleverwise	100	1	49	1
14622	KW-16	16	2.25	Kleverwise	100	1	49	1
14624	KW-16	16	2.25	Kleverwise	100	1	49	1
14626	KW-16	16	2.25	Kleverwise	100	1	49	1
14627	STD-12	12	2.3	Traditional	100	1	49	1
14629	KW-16	16	2.3	Kleverwise	100	1	49	1
14630	STD-12	12	2.3	Traditional	50	1	49	1
14633	KW-16	16	2.3	Kleverwise	100	1	49	1
14634	KW-16	16	2.25	Kleverwise	100	1	49	1
14637	KW-16	16	2.25	Kleverwise	100	1	49	1
14639	KW-16	16	2.25	Kleverwise	100	1	49	1
14641	STD-12	12	2.25	Traditional	0	1	49	1
14643	KW-16	16	2.25	Kleverwise	100	1	49	1
14648	KW-16	16	2.25	Kleverwise	100	1	49	1
14649	KW-16	16	2.25	Kleverwise	100	1	49	1
14650	KW-16	16	2.3	Kleverwise	100	1	49	1
14651	STD-12	12	2.1	Traditional	50	1	25	1
14656	KW-16	16	2.25	Kleverwise	100	1	49	1
14657	KWC	16	2.3	KWChoice	100	1	49	1
14658	STD-12	12	2.25	Traditional	50	1	25	1
14660	KW-16	16	2.3	Kleverwise	100	1	49	1
14661	KW-16	16	2.3	Kleverwise	100	1	49	1
14662	KW-16	16	2.25	Kleverwise	0	0	49	1
14664	KW-16	16	2.3	Kleverwise	100	1	49	1
14665	KW-16	16	2.25	Kleverwise	100	1	49	1
14670	KWC	16	2.3	KWChoice	100	1	49	1
14673	KW-16	16	2.25	Kleverwise	100	1	49	1
14674	KW-16	16	2.3	Kleverwise	100	1	49	1
14684	STD-12	12	2.1	Traditional	50	1	25	1
14687	KW-16	16	2.3	Kleverwise	100	1	49	1
14693	KW-16	16	2	Kleverwise	50	1	25	1
14695	KW-16	16	2.3	Kleverwise	100	1	49	1
14696	STD-12	12	2.25	Traditional	50	1	25	1
14697	KW-16	16	2.3	Kleverwise	100	1	49	1
14698	STD-12	12	2.25	Traditional	0	1	25	1
14701	STD-12	12	2.1	Traditional	50	1	25	1
14702	P10	10	1.75	Prime10	0	0	49	1
14703	P10	10	1.75	Prime10	0	0	49	1
14704	KW-16	16	2.3	Kleverwise	100	1	49	1
14705	KW-16	16	2.3	Kleverwise	100	1	49	1
14708	KW-16	16	2.25	Kleverwise	100	1	49	1
14709	KW-16	16	2	Kleverwise	100	1	49	1
14712	KW-16	16	2.3	Kleverwise	100	1	49	1
14713	KW-16	16	2.25	Kleverwise	0	0	49	1
14716	KW-16	16	2.25	Kleverwise	100	1	49	1
14717	KW-16	16	2.25	Kleverwise	0	0	49	1
14718	KW-16	16	2.3	Kleverwise	100	1	49	1
14719	KW-16	16	2.3	Kleverwise	100	1	25	1
14723	KW-16	16	2.3	Kleverwise	100	1	49	1
14728	KW-16	16	2.3	Kleverwise	100	1	49	1
14729	KW-16	16	2.3	Kleverwise	100	1	49	1
14731	KW-16	16	2.3	Kleverwise	100	1	49	1
14732	KW-16	16	2.3	Kleverwise	100	1	49	1
14738	KW-16	16	2.3	Kleverwise	100	1	49	1
14741	KW-16	16	2.25	Kleverwise	100	1	49	1
14746	KW-16	16	2.3	Kleverwise	100	1	49	1
14752	KW-16	16	2.3	Kleverwise	100	1	49	1
14753	KW-16	16	2.25	Kleverwise	100	1	49	1
14754	KW-16	16	2.25	Kleverwise	100	1	49	1
14756	STD-12	12	2.1	Traditional	50	1	25	1
14757	KW-16	16	2.3	Kleverwise	100	1	49	1
14758	KW-16	16	2.3	Kleverwise	100	1	49	1
14759	KW-16	16	2.3	Kleverwise	100	1	49	1
14760	KW-16	16	2.3	Kleverwise	100	1	49	1
14761	STD-12	12	2.25	Traditional	50	1	25	1
14762	STD-12	12	2.3	Traditional	50	1	49	1
14767	KW-16	16	2.25	Kleverwise	100	1	49	1
14772	KW-16	16	2.3	Kleverwise	100	1	49	1
14781	STD-12	12	2.3	Traditional	50	1	49	1
14782	STD-12	12	2.3	Traditional	50	1	49	1
14785	STD-12	12	2.3	Traditional	50	1	49	1
14787	KW-16	16	2.25	Kleverwise	100	1	49	1
14788	STD-12	12	2.25	Traditional	50	1	25	1
14790	KWC	16	2.3	KWChoice	100	1	49	1
14792	KW-16	16	2.25	Kleverwise	100	1	49	1
14793	KW-16	16	2.3	Kleverwise	100	1	49	1
14794	KW-16	16	2.3	Kleverwise	100	1	49	1
14797	KW-16	16	2.3	Kleverwise	100	1	49	1
14798	KW-16	16	2.3	Kleverwise	100	1	49	1
14803	KW-16	16	2.25	Kleverwise	0	0	49	1
14805	KW-16	16	2.25	Kleverwise	100	1	49	1
14809	STD-12	12	2.3	Traditional	50	1	49	1
14812	KW-16	16	2.25	Kleverwise	100	1	49	1
14815	KW-16	16	2	Kleverwise	100	1	49	1
14817	KW-16	16	2.3	Kleverwise	100	1	49	1
14820	KW-16	16	2.3	Kleverwise	100	1	49	1
14821	KW-16	16	2.3	Kleverwise	100	1	49	1
14826	KW-16	16	2.1	Kleverwise	50	1	25	1
14827	KW-16	16	2.1	Kleverwise	50	1	25	1
14828	KW-16	16	2.1	Kleverwise	50	1	25	1
14831	KW-16	16	2.25	Kleverwise	100	1	49	1
14833	STD-12	12	2.1	Traditional	50	1	25	1
14835	KW-16	16	2.3	Kleverwise	100	1	49	1
14839	KW-16	16	2.3	Kleverwise	100	1	49	1
14842	STD-12	12	2.1	Traditional	50	1	25	1
14843	STD-12	12	2	Traditional	50	1	49	1
14844	KW-16	16	2.25	Kleverwise	0	1	49	1
14850	KW-16	16	2.25	Kleverwise	0	0	49	1
14854	KW-16	16	2.3	Kleverwise	100	1	49	1
14856	KW-16	16	2.25	Kleverwise	100	1	49	1
14857	KW-16	16	2.3	Kleverwise	100	1	49	1
14858	KW-16	16	2.3	Kleverwise	100	1	49	1
14863	KW-16	16	2.3	Kleverwise	100	1	49	1
14867	STD-12	12	2.3	Traditional	50	1	25	1
14869	STD-12	12	2.3	Traditional	50	1	49	1
14879	KW-16	16	2.3	Kleverwise	100	1	49	1
14882	KW-16	16	2.3	Kleverwise	100	1	49	1
14884	STD-12	12	2.3	Traditional	50	1	25	1
14887	STD-12	12	2.1	Traditional	50	1	25	1
14890	KW-16	16	2.3	Kleverwise	100	1	49	1
14891	KW-16	16	2.3	Kleverwise	100	1	49	1
14892	KW-16	16	2.3	Kleverwise	100	1	49	1
14896	STD-12	12	2.3	Traditional	50	1	49	1
14903	KW-16	16	2.3	Kleverwise	100	1	49	1
14907	STD-12	12	2.3	Traditional	50	1	49	1
14908	STD-12	12	2.3	Traditional	50	1	49	1
14911	KW-16	16	2.25	Kleverwise	100	1	49	1
14927	STD-12	12	2.1	Traditional	50	1	25	1
14928	STD-12	12	2.1	Traditional	50	1	25	1
14929	STD-12	12	2.1	Traditional	50	1	25	1
14931	KW-16	16	2.25	Kleverwise	100	1	49	1
14932	KW-16	16	2.25	Kleverwise	100	1	49	1
14935	KW-16	16	2.3	Kleverwise	0	0	49	1
14937	KW-16	16	2.3	Kleverwise	100	1	49	1
14938	KW-16	16	2.25	Kleverwise	100	1	49	1
14939	KW-16	16	2.25	Kleverwise	100	1	49	1
14951	KW-16	16	2.3	Kleverwise	100	1	49	1
14953	STD-12	12	2	Traditional	50	1	49	1
14954	KWC	16	2.3	KWChoice	100	1	49	1
14960	STD-12	12	2.3	Traditional	50	1	25	1
14961	STD-12	12	2.3	Traditional	50	1	49	1
14971	STD-12	12	2.3	Traditional	50	1	49	1
14984	STD-12	12	2.3	Traditional	50	1	25	1
14986	STD-12	12	2.1	Traditional	50	1	25	1
14987	STD-12	12	2.1	Traditional	50	1	25	1
14988	STD-12	12	2.25	Traditional	50	1	5	1
14996	KW-16	16	2.3	Kleverwise	100	1	5	1
15002	KW-16	16	2	Kleverwise	100	1	49	1
15004	STD-12	12	2.1	Traditional	50	1	25	1
15005	STD-12	12	2.1	Traditional	50	1	49	1
15007	KW-16	16	2.3	Kleverwise	100	1	49	1
15008	STD-12	12	2.1	Traditional	50	1	5	1
15009	KW-16	16	2.3	Kleverwise	100	1	49	1
15010	STD-12	12	2.1	Traditional	50	1	5	1
15011	STD-12	12	2.1	Traditional	50	1	49	1
15014	KW-16	16	2.3	Kleverwise	100	1	49	1
15015	KW-16	16	2.3	Kleverwise	100	1	49	1
15023	STD-12	12	2.3	Traditional	50	1	49	1
15024	KW-16	16	2.25	Kleverwise	100	1	49	1
15025	KW-16	16	2.25	Kleverwise	100	1	49	1
15028	KWC	16	2.3	KWChoice	100	1	49	1
15030	STD-12	12	2.1	Traditional	50	1	25	1
15031	STD-12	12	2.3	Traditional	0	0	49	1
15032	KW-16	16	2.3	Kleverwise	100	1	49	1
15033	KW-16	16	2	Kleverwise	100	1	49	1
15036	KW-16	16	2.25	Kleverwise	100	1	49	1
15043	KW-16	16	2.3	Kleverwise	100	1	49	1
15047	STD-12	12	2.25	Traditional	50	1	25	1
15049	STD-12	12	2	Traditional	50	1	49	1
15052	KW-16	16	2.25	Kleverwise	0	0	49	1
15055	KWC	16	2.3	KWChoice	100	1	49	1
15058	KW-16	16	2.25	Kleverwise	100	1	49	1
15059	STD-12	12	2.1	Traditional	50	1	25	1
15061	KW-16	16	2.25	Kleverwise	100	1	49	1
15063	KW-16	16	2.25	Kleverwise	100	1	49	1
15064	STD-12	12	2.1	Traditional	50	1	25	1
15065	STD-12	12	2.3	Traditional	50	1	49	1
15068	KW-16	16	2.25	Kleverwise	100	1	49	1
15069	KW-16	16	2.3	Kleverwise	100	1	49	1
15074	KW-16	16	2.3	Kleverwise	100	1	49	1
15076	KW-16	16	2	Kleverwise	100	1	25	1
15084	KW-16	16	2.3	Kleverwise	100	1	49	1
15099	STD-12	12	2.3	Traditional	50	1	49	1
15100	STD-12	12	2.3	Traditional	50	1	49	1
15101	STD-12	12	2.3	Traditional	50	1	49	1
15112	KW-16	16	2.3	Kleverwise	100	1	49	1
15114	KW-16	16	2	Kleverwise	100	1	49	1
15120	KW-16	16	2.25	Kleverwise	100	1	49	1
15123	STD-12	12	2.3	Traditional	50	1	49	1
15127	KW-16	16	2.25	Kleverwise	100	1	49	1
15131	STD-12	12	2.3	Traditional	50	1	49	1
15132	KW-16	16	2	Kleverwise	100	1	49	1
15133	KW-16	16	2	Kleverwise	100	1	49	1
15139	STD-12	12	2.3	Traditional	50	1	49	1
15143	KW-16	16	2.3	Kleverwise	100	1	49	1
15147	STD-12	12	2.3	Traditional	50	1	49	1
15148	KW-16	16	2.3	Kleverwise	100	1	49	1
15149	KW-16	16	2.3	Kleverwise	100	1	49	1
15150	STD-12	12	2.3	Traditional	50	1	49	1
15151	KW-16	16	2.25	Kleverwise	100	1	49	1
15153	STD-12	12	2.1	Traditional	50	1	25	1
15159	KW-16	16	2.3	Kleverwise	0	0	49	1
15164	KWC	16	2.3	KWChoice	100	1	49	1
15165	STD-12	12	2.1	Traditional	50	1	25	1
15168	KW-16	16	2.3	Kleverwise	100	1	49	1
15169	KW-16	16	2.3	Kleverwise	100	1	49	1
15170	STD-12	12	2.1	Traditional	50	1	25	1
15171	KW-16	16	2.3	Kleverwise	100	1	49	1
15173	KW-16	16	2	Kleverwise	100	1	49	1
15174	KW-16	16	2.3	Kleverwise	100	1	49	1
15175	KW-16	16	2.25	Kleverwise	100	1	49	1
15176	KW-16	16	2.3	Kleverwise	0	0	49	1
15177	KW-16	16	2	Kleverwise	100	1	49	1
15178	STD-12	12	2.1	Traditional	50	1	25	1
15179	STD-12	12	2.25	Traditional	50	1	25	1
15180	KW-16	16	2.25	Kleverwise	100	1	49	1
15183	KWC	16	2.3	KWChoice	100	1	49	1
15184	STD-12	12	2.3	Traditional	50	1	49	1
15187	KW-16	16	2	Kleverwise	100	1	49	1
15189	KW-16	16	2.25	Kleverwise	100	1	49	1
15191	KW-16	16	2	Kleverwise	100	1	49	1
15192	KW-16	16	2.3	Kleverwise	50	1	49	1
15199	STD-12	12	2.1	Traditional	50	1	25	1
15200	KW-16	16	2.25	Kleverwise	100	1	49	1
15201	STD-12	12	2.1	Traditional	50	1	25	1
15209	KW-16	16	2.3	Kleverwise	100	1	49	1
15212	KW-16	16	2.3	Kleverwise	100	1	49	1
15215	KW-16	16	2	Kleverwise	100	1	25	1
15218	STD-12	12	2.1	Traditional	50	1	25	1
15219	KW-16	16	2.3	Kleverwise	100	1	49	1
15220	KW-16	16	2.25	Kleverwise	100	1	49	1
15221	KW-16	16	2.25	Kleverwise	100	1	49	1
15223	KW-16	16	2.25	Kleverwise	100	1	49	1
15224	KW-16	16	2.25	Kleverwise	100	1	49	1
15229	KW-16	16	2.25	Kleverwise	100	1	49	1
15230	KW-16	16	2.3	Kleverwise	100	1	49	1
15231	KW-16	16	2.3	Kleverwise	0	0	49	1
15232	KWC	16	2.3	KWChoice	100	1	49	1
15233	STD-12	12	2.1	Traditional	50	1	25	1
15235	STD-12	12	2.1	Traditional	50	1	25	1
15236	STD-12	12	2.1	Traditional	50	1	25	1
15237	STD-12	12	2.1	Traditional	50	1	25	1
15238	STD-12	12	2.1	Traditional	50	1	25	1
15239	STD-12	12	2.1	Traditional	50	1	25	1
15240	STD-12	12	2.1	Traditional	50	1	25	1
15241	STD-12	12	2.1	Traditional	50	1	25	1
15242	STD-12	12	2.1	Traditional	50	1	25	1
15243	KW-16	16	2.25	Kleverwise	100	1	49	1
15244	KW-16	16	2.3	Kleverwise	0	0	49	1
15245	KW-16	16	2.3	Kleverwise	0	0	49	1
15246	KW-16	16	2.3	Kleverwise	0	0	49	1
15247	KW-16	16	2.3	Kleverwise	100	1	49	1
15248	KW-16	16	2.3	Kleverwise	0	0	49	1
15249	STD-12	12	2.1	Traditional	50	1	25	1
15250	STD-12	12	2.1	Traditional	50	1	25	1
15251	KW-16	16	2.3	Kleverwise	0	0	49	1
15252	KW-16	16	2.3	Kleverwise	0	0	49	1
15253	KW-16	16	2.3	Kleverwise	0	0	49	1
15254	KWC	16	2.3	KWChoice	100	1	49	1
15255	KWC	16	2.3	KWChoice	100	1	49	1
15256	KW-16	16	2.3	Kleverwise	0	0	49	1
15257	KW-16	16	2.3	Kleverwise	0	0	49	1
15258	KW-16	16	2.3	Kleverwise	0	0	49	1
15259	KW-16	16	2.3	Kleverwise	100	1	49	1
15260	KW-16	16	2.3	Kleverwise	0	0	49	1
15261	KW-16	16	2.3	Kleverwise	0	0	49	1
15262	KW-16	16	2.3	Kleverwise	0	0	49	1
15263	KW-16	16	2.3	Kleverwise	0	0	49	1
15264	KW-16	16	2.3	Kleverwise	0	0	49	1
15265	KW-16	16	2.3	Kleverwise	0	0	49	1
15266	KW-16	16	2.3	Kleverwise	0	0	49	1
15267	KW-16	16	2.3	Kleverwise	0	0	49	1
15268	KW-16	16	2.3	Kleverwise	0	0	49	1
15270	KW-16	16	2.3	Kleverwise	0	0	49	1
15271	KW-16	16	2.3	Kleverwise	0	0	49	1
15272	KW-16	16	2.3	Kleverwise	0	0	49	1
15273	KW-16	16	2.3	Kleverwise	100	1	49	1
15274	KW-16	16	2.3	Kleverwise	0	0	49	1
15275	KW-16	16	2.3	Kleverwise	0	0	49	1
15276	KW-16	16	2.3	Kleverwise	0	0	49	1
15277	KW-16	16	2.3	Kleverwise	100	1	49	1
15278	KW-16	16	2.3	Kleverwise	0	0	49	1
15279	KWC	16	2.3	KWChoice	100	1	49	1
15280	KW-16	16	2.3	Kleverwise	100	1	49	1
15281	KWC	16	2.3	KWChoice	100	1	49	1
15282	KW-16	16	2.3	Kleverwise	0	0	49	1
15283	KW-16	16	2.3	Kleverwise	0	0	49	1
15284	KW-16	16	2.3	Kleverwise	0	0	49	1
15285	KW-16	16	2.3	Kleverwise	0	0	49	1
15286	KW-16	16	2.3	Kleverwise	0	0	49	1
15287	KW-16	16	2.3	Kleverwise	100	1	49	1
15289	KW-16	16	2.25	Kleverwise	100	1	49	1
15290	STD-12	12	2.1	Traditional	50	1	25	1
15295	KW-16	16	2.3	Kleverwise	0	0	49	1
15296	KW-16	16	2.3	Kleverwise	0	0	49	1
15297	KW-16	16	2.3	Kleverwise	100	1	49	1
15298	KWC	16	2.3	KWChoice	100	1	49	1
15299	KWC	16	2.3	KWChoice	100	1	49	1
15300	KW-16	16	2.3	Kleverwise	100	1	49	1
15301	KWC	16	2.3	KWChoice	100	1	49	1
15302	KWC	16	2.3	KWChoice	100	1	49	1
15303	KW-16	16	2.3	Kleverwise	0	0	49	1
15304	KW-16	16	2.3	Kleverwise	0	0	49	1
15305	KW-16	16	2.3	Kleverwise	0	0	49	1
15306	KW-16	16	2.3	Kleverwise	0	0	49	1
15307	KWC	16	2.3	KWChoice	100	1	49	1
15308	KW-16	16	2.3	Kleverwise	0	0	49	1
15309	KW-16	16	2.3	Kleverwise	0	0	49	1
15310	KW-16	16	2.3	Kleverwise	0	0	49	1
15311	KWC	16	2.3	KWChoice	100	1	49	1
15312	KW-16	16	2.3	Kleverwise	0	0	49	1
15313	KWC	16	2.3	KWChoice	100	1	49	1
15314	KW-16	16	2.3	Kleverwise	0	0	49	1
15315	KW-16	16	2.3	Kleverwise	0	0	49	1
15316	KW-16	16	2.3	Kleverwise	100	1	49	1
15317	KW-16	16	2.3	Kleverwise	0	0	49	1
15318	KW-16	16	2.3	Kleverwise	0	0	49	1
15319	KW-16	16	2.3	Kleverwise	100	1	49	1
15320	KW-16	16	2.3	Kleverwise	0	0	49	1
15321	KW-16	16	2.3	Kleverwise	0	0	49	1
15322	KW-16	16	2.3	Kleverwise	100	1	49	1
15323	KW-16	16	2.3	Kleverwise	0	0	49	1
15324	KW-16	16	2.3	Kleverwise	0	0	49	1
15325	KW-16	16	2.3	Kleverwise	0	0	49	1
15326	KWC	16	2.3	KWChoice	100	1	49	1
15327	KW-16	16	2.3	Kleverwise	0	0	49	1
15328	KW-16	16	2.3	Kleverwise	0	0	49	1
15329	KW-16	16	2.3	Kleverwise	0	0	49	1
15330	KW-16	16	2.3	Kleverwise	0	0	49	1
15331	KW-16	16	2.3	Kleverwise	100	1	49	1
15332	KW-16	16	2.3	Kleverwise	0	0	49	1
15333	KW-16	16	2.3	Kleverwise	0	0	49	1
15334	KW-16	16	2.3	Kleverwise	100	1	49	1
15335	KW-16	16	2.3	Kleverwise	100	1	49	1
15336	KW-16	16	2.3	Kleverwise	100	1	49	1
15337	KW-16	16	2.3	Kleverwise	0	0	49	1
15338	KW-16	16	2.3	Kleverwise	0	0	49	1
15339	KW-16	16	2.3	Kleverwise	0	0	49	1
15340	KW-16	16	2.3	Kleverwise	0	0	49	1
15341	KW-16	16	2.3	Kleverwise	0	0	49	1
15342	KW-16	16	2.3	Kleverwise	0	0	49	1
15343	KW-16	16	2.3	Kleverwise	0	0	49	1
15344	KW-16	16	2.3	Kleverwise	0	0	49	1
15345	KW-16	16	2.3	Kleverwise	0	0	49	1
15346	KW-16	16	2.3	Kleverwise	0	0	49	1
15347	KW-16	16	2.3	Kleverwise	0	0	49	1
15348	KW-16	16	2.3	Kleverwise	0	0	49	1
15349	KW-16	16	2.3	Kleverwise	0	0	49	1
15350	KWC	16	2.3	KWChoice	100	1	49	1
15351	KW-16	16	2.3	Kleverwise	0	0	49	1
15352	KW-16	16	2.3	Kleverwise	0	0	49	1
15353	KW-16	16	2.3	Kleverwise	100	1	49	1
15354	KW-16	16	2.3	Kleverwise	0	0	49	1
15355	KW-16	16	2.3	Kleverwise	100	1	49	1
15356	KW-16	16	2.3	Kleverwise	0	0	49	1
15357	KW-16	16	2.3	Kleverwise	0	0	49	1
15358	KW-16	16	2.3	Kleverwise	0	0	49	1
15359	KW-16	16	2.3	Kleverwise	100	1	49	1
15360	KW-16	16	2.3	Kleverwise	0	0	49	1
15361	KW-16	16	2.3	Kleverwise	0	0	49	1
15362	KW-16	16	2.3	Kleverwise	100	1	49	1
15363	KW-16	16	2.3	Kleverwise	0	0	49	1
15364	KW-16	16	2.3	Kleverwise	100	1	49	1
15365	KW-16	16	2.3	Kleverwise	0	0	49	1
15366	KW-16	16	2.3	Kleverwise	0	0	49	1
15367	KW-16	16	2.3	Kleverwise	0	0	49	1
15368	KW-16	16	2.3	Kleverwise	0	0	49	1
15369	KW-16	16	2.3	Kleverwise	0	0	49	1
15370	KW-16	16	2.3	Kleverwise	100	1	49	1
15371	KW-16	16	2.3	Kleverwise	100	1	49	1
15372	KW-16	16	2.3	Kleverwise	0	0	49	1
15373	KW-16	16	2.3	Kleverwise	0	0	49	1
15374	KW-16	16	2.3	Kleverwise	0	0	49	1
15375	KW-16	16	2.3	Kleverwise	0	0	49	1
15376	KW-16	16	2.3	Kleverwise	100	1	49	1
15377	KW-16	16	2.3	Kleverwise	0	0	49	1
15378	KW-16	16	2.3	Kleverwise	0	0	49	1
15379	KW-16	16	2.3	Kleverwise	0	0	49	1
15380	KW-16	16	2.3	Kleverwise	0	0	49	1
15382	KW-16	16	2.3	Kleverwise	100	1	49	1
15385	KW-16	16	2.25	Kleverwise	100	1	25	1
15388	STD-12	12	2.1	Traditional	50	1	25	1
15389	KW-16	16	2.3	Kleverwise	100	1	49	1
15392	KW-16	16	2.3	Kleverwise	100	1	49	1
15393	KW-16	16	2.3	Kleverwise	100	1	49	1
15401	KW-16	16	2.25	Kleverwise	0	0	49	1
15404	KW-16	16	2.3	Kleverwise	100	1	49	1
15431	KW-16	16	2.25	Kleverwise	100	1	49	1
15434	KW-16	16	2.3	Kleverwise	100	1	49	1
15437	KW-16	16	2.3	Kleverwise	100	1	49	1
15442	STD-12	12	2.3	Traditional	50	1	49	1
15454	KW-16	16	2.3	Kleverwise	100	1	49	1
15456	STD-12	12	2.3	Traditional	100	1	49	1
15458	STD-12	12	2.25	Traditional	50	1	25	1
15462	KW-16	16	2.3	Kleverwise	100	1	49	1
15466	KWC	16	2.3	KWChoice	100	1	49	1
15470	STD-12	12	2.25	Traditional	50	1	25	1
15472	STD-12	12	2.3	Traditional	50	1	49	1
15483	KW-16	16	2.3	Kleverwise	100	1	49	1
15494	KW-16	16	2.25	Kleverwise	0	0	49	1
15496	KW-16	16	2.25	Kleverwise	100	1	49	1
15498	STD-12	12	2.25	Traditional	50	1	25	1
15499	KW-16	16	2.3	Kleverwise	100	1	49	1
15500	KW-16	16	2.3	Kleverwise	100	1	49	1
15503	KW-16	16	2.25	Kleverwise	100	1	49	1
15505	KW-16	16	2.3	Kleverwise	100	1	49	1
15508	KW-16	16	2	Kleverwise	100	1	49	1
15511	STD-12	12	2.3	Traditional	50	1	49	1
15516	KW-16	16	2.3	Kleverwise	100	1	49	1
15519	KW-16	16	2.3	Kleverwise	100	1	49	1
15522	KW-16	16	2.3	Kleverwise	100	1	49	1
15524	KW-16	16	2.25	Kleverwise	0	1	49	1
15527	KW-16	16	2.25	Kleverwise	0	0	49	1
15528	KW-16	16	2	Kleverwise	0	1	49	0
15533	KW-16	16	2.25	Kleverwise	100	1	49	1
15542	KW-16	16	2.25	Kleverwise	100	1	49	1
15543	STD-12	12	2.3	Traditional	50	1	49	1
15549	KW-16	16	2.3	Kleverwise	100	1	49	1
15550	KW-16	16	2	Kleverwise	100	1	49	1
15551	KW-16	16	2	Kleverwise	100	1	49	1
15554	KWC	16	2.3	KWChoice	100	1	49	1
15556	KW-16	16	2.3	Kleverwise	0	0	49	1
15558	KW-16	16	2.3	Kleverwise	100	1	49	1
15561	KW-16	16	2.25	Kleverwise	100	1	49	1
15563	KWC	16	2.3	KWChoice	100	1	49	1
15564	KWC	16	2.3	KWChoice	50	1	49	1
15565	KW-16	16	2.3	Kleverwise	100	1	49	1
15568	KW-16	16	2.3	Kleverwise	100	1	49	1
15570	KW-16	16	2.3	Kleverwise	100	1	49	1
15572	KW-16	16	2.25	Kleverwise	100	1	49	1
15576	KW-16	16	2.25	Kleverwise	100	1	49	1
15577	KW-16	16	2.25	Kleverwise	100	1	49	1
15584	KW-16	16	2	Kleverwise	100	1	49	1
15590	KW-16	16	2.25	Kleverwise	100	1	49	1
15591	KW-16	16	2.3	Kleverwise	100	1	49	1
15592	KW-16	16	2.3	Kleverwise	100	1	49	1
15597	KW-16	16	2.25	Kleverwise	100	1	49	1
15603	KW-16	16	2.3	Kleverwise	100	1	49	1
15605	STD-12	12	2.3	Traditional	50	1	49	1
15606	KW-16	16	2.25	Kleverwise	100	1	49	1
15607	STD-12	12	2	Traditional	50	1	49	1
15608	KW-16	16	2.3	Kleverwise	100	1	49	1
15610	KW-16	16	2.3	Kleverwise	100	1	49	1
15612	KW-16	16	2.3	Kleverwise	100	1	49	1
15617	KWC	16	2.3	KWChoice	100	1	49	1
15618	KW-16	16	2.25	Kleverwise	100	1	49	1
15629	KW-16	16	2.25	Kleverwise	100	1	49	1
15630	KW-16	16	2.3	Kleverwise	100	1	49	1
15631	KWC	16	2.3	KWChoice	100	1	49	1
15634	KW-16	16	2.25	Kleverwise	0	0	49	1
15642	KW-16	16	2.1	Kleverwise	50	1	25	1
15646	STD-12	12	2.3	Traditional	50	1	49	1
15649	KW-16	16	2.25	Kleverwise	100	1	49	1
15650	KW-16	16	2.25	Kleverwise	100	1	49	1
15651	STD-12	12	2.3	Traditional	50	1	49	1
15655	STD-12	12	2.3	Traditional	50	1	49	1
15657	KWC	16	2.3	KWChoice	100	1	49	1
15661	STD-12	12	2.3	Traditional	50	1	49	1
15662	STD-12	12	2.3	Traditional	50	1	49	1
15663	STD-12	12	2.3	Traditional	50	1	49	1
15665	KW-16	16	2.25	Kleverwise	100	1	49	1
15677	STD-12	12	2.3	Traditional	50	1	25	1
15678	KW-16	16	2.3	Kleverwise	50	1	49	1
15680	KW-16	16	2.3	Kleverwise	100	1	49	1
15681	KW-16	16	2.3	Kleverwise	100	1	49	1
15682	KW-16	16	2.3	Kleverwise	50	1	49	1
15684	KW-16	16	2.3	Kleverwise	100	1	49	1
15685	STD-12	12	2.25	Traditional	0	1	49	1
15688	KW-16	16	2.25	Kleverwise	100	1	49	1
15689	KW-16	16	2.3	Kleverwise	100	1	49	1
15692	KW-16	16	2.3	Kleverwise	100	1	49	1
15694	STD-12	12	2	Traditional	0	1	49	1
15699	KW-16	16	2.25	Kleverwise	100	1	49	1
15705	KW-16	16	2.3	Kleverwise	100	1	49	1
15712	KW-16	16	2.25	Kleverwise	0	0	49	1
15714	KW-16	16	2.1	Kleverwise	50	1	49	1
15715	KW-16	16	2.3	Kleverwise	100	1	49	1
15716	KW-16	16	2.25	Kleverwise	100	1	49	1
15718	STD-12	12	2.1	Traditional	50	1	25	1
15722	KW-16	16	2.25	Kleverwise	100	1	49	1
15723	KW-16	16	2.3	Kleverwise	100	1	49	1
15733	KW-16	16	2	Kleverwise	100	1	49	1
15735	KW-16	16	2.3	Kleverwise	0	0	49	1
15744	STD-12	12	2.3	Traditional	50	1	49	1
15752	KW-16	16	2.25	Kleverwise	100	1	49	1
15754	STD-12	12	2.3	Traditional	50	1	49	1
15755	KW-16	16	2.3	Kleverwise	100	1	49	1
15757	KW-16	16	2.3	Kleverwise	100	1	49	1
15758	STD-12	12	2.25	Traditional	50	1	25	1
15765	KW-16	16	2.3	Kleverwise	0	0	49	1
15766	KW-16	16	2.3	Kleverwise	100	1	49	1
15769	KW-16	16	2.3	Kleverwise	100	1	49	1
15775	KW-16	16	2.3	Kleverwise	100	1	49	1
15778	KWC	16	2.3	KWChoice	100	1	49	1
15780	KW-16	16	2.3	Kleverwise	100	1	49	1
15781	KWC	16	2.3	KWChoice	100	1	49	1
15784	KW-16	16	2.25	Kleverwise	100	1	49	1
15786	KW-16	16	2.25	Kleverwise	100	1	49	1
15794	STD-12	12	2.3	Traditional	50	1	49	1
15795	KW-16	16	2	Kleverwise	100	1	49	1
15800	KW-16	16	2.3	Kleverwise	100	1	49	1
15803	STD-12	12	2.3	Traditional	50	1	49	1
15817	KW-16	16	2.25	Kleverwise	100	1	49	1
15819	KW-16	16	2.3	Kleverwise	100	1	49	1
15820	KW-16	16	2.3	Kleverwise	100	1	49	1
15821	KWC	16	2.3	KWChoice	100	1	49	1
15835	KW-16	16	2.25	Kleverwise	100	1	49	1
15840	KW-16	16	2.25	Kleverwise	100	1	49	1
15843	KW-16	16	2.25	Kleverwise	100	1	49	1
15844	KW-16	16	2.25	Kleverwise	100	1	49	1
15847	STD-12	12	2.25	Traditional	10	1	40	1
15851	STD-12	12	2.3	Traditional	50	1	49	1
15852	KW-16	16	2.3	Kleverwise	100	1	49	1
15854	KW-16	16	2.3	Kleverwise	100	1	49	1
15855	KW-16	16	2.25	Kleverwise	0	0	49	1
15856	KW-16	16	2	Kleverwise	100	1	49	1
15858	KW-16	16	2.3	Kleverwise	100	1	49	1
15859	KW-16	16	2.3	Kleverwise	100	1	49	1
15860	KW-16	16	2.3	Kleverwise	100	1	49	1
15861	KWC	16	2.3	KWChoice	100	1	49	1
15862	KW-16	16	2.25	Kleverwise	100	1	49	1
15863	KW-16	16	2.3	Kleverwise	100	1	49	1
15870	KW-16	16	2.3	Kleverwise	100	1	49	1
15872	STD-12	12	2.3	Traditional	50	1	49	1
15875	KW-16	16	2.3	Kleverwise	100	1	49	1
15876	KW-16	16	2.25	Kleverwise	100	1	49	1
15878	STD-12	12	2.3	Traditional	0	0	49	1
15881	KW-16	16	2.3	Kleverwise	100	1	49	1
15885	KWC	16	2.3	KWChoice	100	1	49	1
15887	KW-16	16	2.3	Kleverwise	0	0	49	1
15888	KW-16	16	2.3	Kleverwise	100	1	49	1
15889	KW-16	16	2.25	Kleverwise	100	1	49	1
15894	KW-16	16	2.25	Kleverwise	100	1	49	1
15896	KW-16	16	2.25	Kleverwise	100	1	49	1
15897	KW-16	16	2.3	Kleverwise	100	1	49	1
15898	KW-16	16	2.25	Kleverwise	100	1	49	1
15900	KW-16	16	2.3	Kleverwise	100	1	49	1
15901	KWC	16	2.3	KWChoice	100	1	49	1
15905	KW-16	16	2.3	Kleverwise	100	1	49	1
15908	KW-16	16	2.25	Kleverwise	0	0	49	1
15909	STD-12	12	2.1	Traditional	50	1	25	1
15910	KW-16	16	2.3	Kleverwise	100	1	49	1
15912	KW-16	16	2.3	Kleverwise	100	1	49	1
15913	KW-16	16	2.25	Kleverwise	100	1	49	1
15914	KW-16	16	2.3	Kleverwise	100	1	49	1
15920	KW-16	16	2.25	Kleverwise	100	1	49	1
15922	KW-16	16	2.25	Kleverwise	100	1	49	1
15923	KW-16	16	2.3	Kleverwise	100	1	49	1
15924	KW-16	16	2.3	Kleverwise	100	1	49	1
15928	KW-16	16	2.25	Kleverwise	100	1	49	1
15933	KW-16	16	2.3	Kleverwise	100	1	49	1
15934	KW-16	16	2.3	Kleverwise	100	1	49	1
15937	KW-16	16	2.3	Kleverwise	100	1	49	1
15938	KW-16	16	2.3	Kleverwise	100	1	49	1
15940	KW-16	16	2.3	Kleverwise	100	1	49	1
15942	KW-16	16	2.25	Kleverwise	0	0	50	1
15943	KW-16	16	2.1	Kleverwise	0	0	50	1
15944	KW-16	16	2.25	Kleverwise	0	0	50	1
15945	KW-16	16	2.25	Kleverwise	0	0	49	1
15946	KW-16	16	2	Kleverwise	100	1	49	1
15947	KW-16	16	2.3	Kleverwise	100	1	49	1
15949	KW-16	16	2.25	Kleverwise	100	1	49	1
15950	STD-12	12	2.3	Traditional	0	0	49	1
15951	STD-12	12	2.3	Traditional	50	1	49	1
15952	KW-16	16	2.3	Kleverwise	100	1	49	1
15953	STD-12	12	2.3	Traditional	50	1	49	1
15954	KW-16	16	2.25	Kleverwise	0	0	49	1
15955	KW-16	16	2.25	Kleverwise	100	1	49	1
15958	KW-16	16	2.25	Kleverwise	100	1	49	1
15962	STD-12	12	2.3	Traditional	50	1	49	1
15964	STD-12	12	2.3	Traditional	50	1	49	1
15965	KW-16	16	2.3	Kleverwise	100	1	49	1
15972	KW-16	16	2.3	Kleverwise	100	1	49	1
15973	KW-16	16	2.3	Kleverwise	100	1	49	1
15974	KWC	16	2.3	KWChoice	100	1	49	1
15975	KW-16	16	2.3	Kleverwise	100	1	49	1
15977	KW-16	16	2.25	Kleverwise	100	1	49	1
15979	KW-16	16	2.25	Kleverwise	100	1	49	1
15980	KW-16	16	2	Kleverwise	100	1	49	1
15984	KW-16	16	2.25	Kleverwise	100	1	49	1
15985	KW-16	16	2.25	Kleverwise	100	1	49	1
15987	STD-12	12	2.3	Traditional	50	1	49	1
15991	KW-16	16	2.25	Kleverwise	100	1	49	1
15992	KW-16	16	2.25	Kleverwise	100	1	49	1
15996	STD-12	12	2.3	Traditional	50	1	39	1
15997	KW-16	16	2.3	Kleverwise	100	1	49	1
15998	KW-16	16	2.25	Kleverwise	10	1	40	1
15999	KW-16	16	2.3	Kleverwise	100	1	49	1
16003	KW-16	16	2.3	Kleverwise	100	1	49	1
16004	KW-16	16	2.25	Kleverwise	100	1	49	1
16006	KW-16	16	2.3	Kleverwise	100	1	49	1
16008	KW-16	16	2.3	Kleverwise	100	1	49	1
16009	KW-16	16	2.3	Kleverwise	100	1	49	1
16011	KW-16	16	2.3	Kleverwise	100	1	49	1
16012	KW-16	16	2.3	Kleverwise	100	1	49	1
16013	KW-16	16	2.25	Kleverwise	100	1	49	1
16016	KW-16	16	2.25	Kleverwise	100	1	49	1
16025	KW-16	16	2.3	Kleverwise	100	1	49	1
16026	KW-16	16	2.3	Kleverwise	100	1	49	1
16027	KW-16	16	2.25	Kleverwise	0	0	49	1
16029	STD-12	12	2.3	Traditional	50	1	25	1
16030	KW-16	16	2.3	Kleverwise	100	1	49	1
16039	KW-16	16	2.25	Kleverwise	100	1	49	1
16040	KWC	16	2.3	KWChoice	100	1	49	1
16041	KW-16	16	2.25	Kleverwise	100	1	49	1
16042	KW-16	16	2.25	Kleverwise	0	0	49	1
16046	KW-16	16	2.3	Kleverwise	100	1	49	1
16049	KW-16	16	2.3	Kleverwise	100	1	49	1
16051	KW-16	16	2.3	Kleverwise	100	1	49	1
16053	KW-16	16	2.25	Kleverwise	100	1	49	1
16059	KW-16	16	2.3	Kleverwise	100	1	49	1
16062	KW-16	16	2	Kleverwise	100	1	49	1
16063	KW-16	16	2	Kleverwise	100	1	49	1
16064	KW-16	16	2	Kleverwise	100	1	49	1
16070	KW-16	16	2.3	Kleverwise	100	1	49	1
16071	STD-12	12	2.1	Traditional	50	1	25	1
16075	KWC	16	2.3	KWChoice	100	1	49	1
16076	STD-12	12	2.3	Traditional	50	1	49	1
16077	KW-16	16	2.1	Kleverwise	50	1	25	1
16078	KW-16	16	2.3	Kleverwise	100	1	49	1
16079	KW-16	16	2.3	Kleverwise	100	1	49	1
16080	KW-16	16	2.25	Kleverwise	0	0	50	1
16081	KW-16	16	2.25	Kleverwise	0	0	50	1
16082	KW-16	16	2.25	Kleverwise	0	0	50	1
16083	KW-16	16	2.1	Kleverwise	0	0	50	1
16085	KW-16	16	2.25	Kleverwise	0	0	50	1
16086	KW-16	16	2.25	Kleverwise	0	0	50	1
16087	KW-16	16	2.25	Kleverwise	100	1	50	1
16088	KW-16	16	2.1	Kleverwise	0	0	50	1
16089	KW-16	16	2.25	Kleverwise	0	0	50	1
16090	KW-16	16	2.25	Kleverwise	0	0	50	1
16092	KW-16	16	2.25	Kleverwise	0	0	50	1
16093	KW-16	16	2.25	Kleverwise	0	0	50	1
16094	KW-16	16	2.25	Kleverwise	100	1	50	1
16095	KW-16	16	2.25	Kleverwise	0	0	50	1
16096	KW-16	16	2.25	Kleverwise	0	0	50	1
16097	KW-16	16	2.25	Kleverwise	0	0	50	1
16098	KW-16	16	2.25	Kleverwise	0	0	50	1
16099	KW-16	16	2.25	Kleverwise	100	1	50	1
16100	KW-16	16	2.25	Kleverwise	0	0	50	1
16101	KW-16	16	2.25	Kleverwise	0	0	50	1
16103	KW-16	16	2.25	Kleverwise	0	0	50	1
16104	KW-16	16	2.1	Kleverwise	0	0	50	1
16105	KW-16	16	2.25	Kleverwise	0	0	50	1
16106	KW-16	16	2.25	Kleverwise	0	0	50	1
16107	KW-16	16	2.25	Kleverwise	0	0	50	1
16108	KW-16	16	2.25	Kleverwise	0	0	50	1
16109	KW-16	16	2.25	Kleverwise	0	0	50	1
16110	KW-16	16	2.25	Kleverwise	0	0	50	1
16111	KW-16	16	2.25	Kleverwise	0	0	50	1
16112	KW-16	16	2.1	Kleverwise	0	0	50	1
16113	KW-16	16	2.25	Kleverwise	0	0	50	1
16114	KW-16	16	2.25	Kleverwise	0	0	50	1
16115	KW-16	16	2.1	Kleverwise	0	0	50	1
16116	KW-16	16	2.25	Kleverwise	0	0	50	1
16117	KW-16	16	2.25	Kleverwise	0	0	50	1
16118	KW-16	16	2.25	Kleverwise	0	0	50	1
16119	KW-16	16	2.25	Kleverwise	0	0	50	1
16120	KW-16	16	2.25	Kleverwise	0	0	50	1
16121	KW-16	16	2.25	Kleverwise	0	0	50	1
16122	KW-16	16	2.1	Kleverwise	0	0	50	1
16124	KW-16	16	2.25	Kleverwise	0	0	50	1
16126	KW-16	16	2.25	Kleverwise	0	0	50	1
16127	KW-16	16	2.1	Kleverwise	0	0	50	1
16130	KW-16	16	2.1	Kleverwise	0	0	50	1
16131	KW-16	16	2.25	Kleverwise	0	0	50	1
16134	KW-16	16	2.25	Kleverwise	100	1	49	1
16137	KW-16	16	2.3	Kleverwise	100	1	49	1
16140	KW-16	16	2.25	Kleverwise	100	1	49	1
16143	KW-16	16	2.25	Kleverwise	100	1	49	1
16145	KW-16	16	2.25	Kleverwise	0	0	50	1
16147	KW-16	16	2.25	Kleverwise	0	0	50	1
16148	KW-16	16	2.25	Kleverwise	0	0	50	1
16150	KW-16	16	2.25	Kleverwise	0	0	50	1
16151	KW-16	16	2.1	Kleverwise	0	0	50	1
16152	KW-16	16	2.25	Kleverwise	0	0	50	1
16153	KW-16	16	2.25	Kleverwise	0	0	50	1
16154	KW-16	16	2.25	Kleverwise	0	0	50	1
16156	KW-16	16	2.25	Kleverwise	0	0	50	1
16157	KW-16	16	2.25	Kleverwise	0	0	50	1
16158	KW-16	16	2.25	Kleverwise	0	0	50	1
16159	KW-16	16	2.25	Kleverwise	0	0	50	1
16161	KW-16	16	2.25	Kleverwise	0	0	50	1
16162	KW-16	16	2.25	Kleverwise	0	0	50	1
16163	KW-16	16	2.1	Kleverwise	0	0	50	1
16164	KW-16	16	2.25	Kleverwise	0	0	50	1
16166	KW-16	16	2.25	Kleverwise	0	0	50	1
16167	KW-16	16	2.1	Kleverwise	0	0	50	1
16168	KW-16	16	2.25	Kleverwise	0	0	50	1
16169	KW-16	16	2.25	Kleverwise	0	0	50	1
16170	KW-16	16	2.25	Kleverwise	0	0	50	1
16171	KW-16	16	2.25	Kleverwise	0	0	50	1
16172	KW-16	16	2.25	Kleverwise	0	0	50	1
16173	KW-16	16	2.1	Kleverwise	0	0	50	1
16174	KW-16	16	2.1	Kleverwise	0	0	50	1
16175	KW-16	16	2.25	Kleverwise	100	1	50	1
16176	KW-16	16	2.25	Kleverwise	0	0	50	1
16177	KW-16	16	2.1	Kleverwise	0	0	50	1
16178	KW-16	16	2.25	Kleverwise	100	1	50	1
16179	KW-16	16	2.1	Kleverwise	0	0	50	1
16180	KW-16	16	2.25	Kleverwise	100	1	49	1
16181	KW-16	16	2.25	Kleverwise	100	1	50	1
16182	KW-16	16	2.1	Kleverwise	0	0	50	1
16183	KW-16	16	2.25	Kleverwise	0	0	50	1
16184	KW-16	16	2.25	Kleverwise	0	0	50	1
16185	KW-16	16	2.25	Kleverwise	100	1	50	1
16186	KW-16	16	2.25	Kleverwise	100	1	50	1
16187	KW-16	16	2.25	Kleverwise	0	0	50	1
16188	KW-16	16	2.25	Kleverwise	100	1	50	1
16189	KW-16	16	2.25	Kleverwise	100	1	50	1
16190	KW-16	16	2.25	Kleverwise	100	1	50	1
16191	KW-16	16	2.3	Kleverwise	100	1	50	1
16193	KW-16	16	2.25	Kleverwise	100	1	49	1
16194	STD-12	12	2.3	Traditional	50	1	49	1
16195	KW-16	16	2.3	Kleverwise	100	1	49	1
16196	KW-16	16	2.25	Kleverwise	100	1	49	1
16197	KW-16	16	2.3	Kleverwise	100	1	49	1
16199	KW-16	16	2.25	Kleverwise	100	1	49	1
16200	STD-12	12	2.3	Traditional	50	1	49	1
16202	KW-16	16	2.3	Kleverwise	100	1	49	1
16203	STD-12	12	2.3	Traditional	50	1	25	1
16207	KW-16	16	2.3	Kleverwise	100	1	49	1
16208	KW-16	16	2.25	Kleverwise	100	1	49	1
16209	STD-12	12	2.3	Traditional	50	1	49	1
16211	KW-16	16	2.25	Kleverwise	0	0	49	1
16213	KW-16	16	2.3	Kleverwise	100	1	49	1
16214	STD-12	12	2.3	Traditional	50	1	49	1
16217	KW-16	16	2.3	Kleverwise	100	1	49	1
16220	KW-16	16	2.3	Kleverwise	100	1	49	1
16225	KW-16	16	2.3	Kleverwise	100	1	49	1
16226	KW-16	16	2.3	Kleverwise	100	1	49	1
16227	KW-16	16	2.25	Kleverwise	100	1	49	1
16230	KW-16	16	2.25	Kleverwise	100	1	49	1
16231	KW-16	16	2.25	Kleverwise	100	1	25	1
16234	KW-16	16	2.3	Kleverwise	100	1	49	1
16235	KW-16	16	2.3	Kleverwise	100	1	49	1
16236	KW-16	16	2.25	Kleverwise	100	1	49	1
16238	KW-16	16	2.3	Kleverwise	100	1	49	1
16241	STD-12	12	2.3	Traditional	50	1	49	1
16248	KW-16	16	2.25	Kleverwise	100	1	49	1
16253	KW-16	16	2.3	Kleverwise	100	1	49	1
16258	KW-16	16	2.25	Kleverwise	100	1	49	1
16263	KWC	16	2.3	KWChoice	100	1	49	1
16265	KWC	16	2.3	KWChoice	100	1	49	1
16266	KW-16	16	2.25	Kleverwise	100	1	49	1
16268	KW-16	16	2.3	Kleverwise	100	1	49	1
16270	KWC	16	2.3	KWChoice	100	1	49	1
16273	KW-16	16	2.3	Kleverwise	100	1	49	1
16281	KW-16	16	2.3	Kleverwise	100	1	49	1
16285	KW-16	16	2.3	Kleverwise	100	1	49	1
16286	KW-16	16	2.3	Kleverwise	100	1	49	1
16289	KW-16	16	2.3	Kleverwise	100	1	49	1
16290	STD-12	12	2.3	Traditional	100	1	49	1
16295	KW-16	16	2.3	Kleverwise	100	1	49	1
16300	KW-16	16	2.3	Kleverwise	100	1	49	1
16317	KW-16	16	2.3	Kleverwise	100	1	49	1
16321	KW-16	16	2.3	Kleverwise	100	1	49	1
16325	KW-16	16	2.3	Kleverwise	100	1	49	1
16326	KW-16	16	2.3	Kleverwise	100	1	49	1
16327	KW-16	16	2.3	Kleverwise	100	1	49	1
16336	KW-16	16	2.3	Kleverwise	100	1	49	1
16337	KW-16	16	2.3	Kleverwise	100	1	49	1
16342	KW-16	16	2.3	Kleverwise	100	1	49	1
16348	KW-16	16	2.3	Kleverwise	100	1	49	1
16349	KW-16	16	2.3	Kleverwise	100	1	49	1
16352	KW-16	16	2.3	Kleverwise	100	1	49	1
16354	KW-16	16	2.3	Kleverwise	100	1	49	1
16355	KW-16	16	2.25	Kleverwise	0	0	49	1
16356	KW-16	16	2.3	Kleverwise	100	1	49	1
16359	KW-16	16	2.3	Kleverwise	100	1	49	1
16360	KW-16	16	2.25	Kleverwise	0	0	49	1
16363	KW-16	16	2.3	Kleverwise	100	1	49	1
16366	KW-16	16	2.3	Kleverwise	100	1	49	1
16367	KW-16	16	2.3	Kleverwise	100	1	49	1
16371	KW-16	16	2.25	Kleverwise	0	0	49	1
16373	KW-16	16	2.25	Kleverwise	100	1	49	1
16374	KW-16	16	2.3	Kleverwise	100	1	49	1
16376	STD-12	12	2.3	Traditional	50	1	49	1
16377	KW-16	16	2.25	Kleverwise	100	1	49	1
16378	KW-16	16	2.3	Kleverwise	100	1	49	1
16379	KW-16	16	2.3	Kleverwise	100	1	49	1
16381	KW-16	16	2.25	Kleverwise	100	1	49	1
16382	KW-16	16	2.25	Kleverwise	100	1	49	1
16386	KW-16	16	2.3	Kleverwise	100	1	49	1
16389	KW-16	16	2.3	Kleverwise	100	1	49	1
16391	KW-16	16	2.3	Kleverwise	100	1	49	1
16392	KW-16	16	2	Kleverwise	100	1	49	1
16394	STD-12	12	2.3	Traditional	50	1	49	1
16397	KW-16	16	2.25	Kleverwise	100	1	49	1
16400	KW-16	16	2.3	Kleverwise	100	1	49	1
16404	STD-12	12	2.3	Traditional	50	1	49	1
16414	KW-16	16	2	Kleverwise	100	1	49	1
16416	KW-16	16	2.3	Kleverwise	100	1	49	1
16418	KW-16	16	2.3	Kleverwise	100	1	49	1
16421	KW-16	16	2.3	Kleverwise	100	1	25	1
16427	KW-16	16	2.25	Kleverwise	100	1	49	1
16430	KW-16	16	2.25	Kleverwise	0	0	49	1
16433	KW-16	16	2.25	Kleverwise	100	1	49	1
16434	KW-16	16	2.3	Kleverwise	100	1	49	1
16442	KW-16	16	2.3	Kleverwise	100	1	49	1
16443	KW-16	16	2.3	Kleverwise	100	1	49	1
16447	KW-16	16	2.25	Kleverwise	100	1	49	1
16448	KW-16	16	2	Kleverwise	100	1	49	1
16449	KW-16	16	2.25	Kleverwise	100	1	49	1
16450	KW-16	16	2	Kleverwise	100	1	49	1
16452	KW-16	16	2.25	Kleverwise	100	1	49	1
16456	KW-16	16	2.3	Kleverwise	100	1	49	1
16457	KW-16	16	2.3	Kleverwise	100	1	49	1
16458	KW-16	16	2.3	Kleverwise	100	1	49	1
16467	KW-16	16	2.25	Kleverwise	100	1	49	1
16468	KW-16	16	2.3	Kleverwise	100	1	49	1
16472	KW-16	16	2.3	Kleverwise	100	1	49	1
16475	KW-16	16	2	Kleverwise	100	1	49	1
16479	KW-16	16	2.3	Kleverwise	100	1	49	1
16487	KW-16	16	2.25	Kleverwise	100	1	49	1
16492	KW-16	16	2.25	Kleverwise	0	0	49	1
16493	KW-16	16	2.3	Kleverwise	100	1	49	1
16494	KW-16	16	2.3	Kleverwise	100	1	49	1
16495	KW-16	16	2.3	Kleverwise	100	1	49	1
16502	KW-16	16	2.3	Kleverwise	100	1	49	1
16506	KW-16	16	2.25	Kleverwise	100	1	49	1
16507	KW-16	16	2.25	Kleverwise	100	1	49	1
16508	KW-16	16	2.3	Kleverwise	100	1	49	1
16509	KW-16	16	2.3	Kleverwise	50	1	49	1
16511	KW-16	16	2.25	Kleverwise	0	0	49	1
16512	KW-16	16	2.3	Kleverwise	100	1	49	1
16513	KW-16	16	2.3	Kleverwise	50	1	49	1
16516	KW-16	16	2.3	Kleverwise	100	1	49	1
16517	KW-16	16	2.3	Kleverwise	100	1	49	1
16520	KW-16	16	2.3	Kleverwise	100	1	49	1
16523	KW-16	16	2.3	Kleverwise	0	0	49	1
16524	KW-16	16	2.3	Kleverwise	100	1	49	1
16529	KW-16	16	2.3	Kleverwise	100	1	49	1
16540	KW-16	16	2.3	Kleverwise	100	1	49	1
16541	KW-16	16	2.25	Kleverwise	100	1	49	1
16542	KW-16	16	2.25	Kleverwise	100	1	49	1
16544	KW-16	16	2.25	Kleverwise	100	1	49	1
16545	KW-16	16	2.3	Kleverwise	100	1	49	1
16546	KW-16	16	2.25	Kleverwise	100	1	49	1
16547	KW-16	16	2.3	Kleverwise	100	1	49	1
16548	KW-16	16	2.3	Kleverwise	100	1	49	1
16551	KW-16	16	2.3	Kleverwise	100	1	49	1
16552	KW-16	16	2.3	Kleverwise	100	1	49	1
16555	KW-16	16	2.3	Kleverwise	100	1	49	1
16559	KW-16	16	2.25	Kleverwise	50	1	9	1
16560	KW-16	16	2.3	Kleverwise	100	1	49	1
16563	KW-16	16	2.25	Kleverwise	0	1	49	1
16566	KW-16	16	2.25	Kleverwise	100	1	49	1
16568	KW-16	16	2.3	Kleverwise	100	1	49	1
16569	KW-16	16	2.25	Kleverwise	100	1	49	1
16570	KW-16	16	2.25	Kleverwise	100	1	49	1
16571	KW-16	16	2.3	Kleverwise	100	1	49	1
16573	KW-16	16	2	Kleverwise	100	1	49	1
16576	KW-16	16	2	Kleverwise	100	1	49	1
16579	KW-16	16	2.3	Kleverwise	0	0	49	1
16581	KW-16	16	2	Kleverwise	100	1	49	1
16586	KW-16	16	2.25	Kleverwise	100	1	49	1
16588	KW-16	16	2.25	Kleverwise	0	1	49	1
16591	KW-16	16	2.25	Kleverwise	100	1	49	1
16593	KW-16	16	2.3	Kleverwise	100	1	49	1
16596	KW-16	16	2	Kleverwise	100	1	49	1
16598	KWC	16	2.3	KWChoice	100	1	49	1
16600	KW-16	16	2.25	Kleverwise	100	1	49	1
16601	KWC	16	2.3	KWChoice	100	1	49	1
16605	KW-16	16	2.3	Kleverwise	100	1	49	1
16608	KW-16	16	2	Kleverwise	100	1	49	1
16609	KW-16	16	2.3	Kleverwise	100	1	49	1
16610	KW-16	16	2.3	Kleverwise	100	1	49	1
16611	KW-16	16	2.3	Kleverwise	100	1	49	1
16617	KWC	16	2.3	KWChoice	100	1	49	1
16619	STD-12	12	2.3	Traditional	50	1	49	1
16624	KW-16	16	2.3	Kleverwise	100	1	49	1
16625	KW-16	16	2.3	Kleverwise	100	1	49	1
16626	KW-16	16	2.3	Kleverwise	100	1	49	1
16627	KWC	16	2.3	KWChoice	100	1	49	1
16630	KW-16	16	2.25	Kleverwise	100	1	49	1
16632	KW-16	16	2.25	Kleverwise	100	1	49	1
16633	KW-16	16	2.25	Kleverwise	100	1	49	1
16636	KW-16	16	2.3	Kleverwise	100	1	49	1
16640	KW-16	16	2.3	Kleverwise	100	1	49	1
16641	KW-16	16	2.25	Kleverwise	100	1	49	1
16643	KW-16	16	2.25	Kleverwise	100	1	49	1
16649	KW-16	16	2.25	Kleverwise	0	0	49	1
16650	KW-16	16	2.25	Kleverwise	100	1	49	1
16652	KW-16	16	2.25	Kleverwise	100	1	49	1
16656	KW-16	16	2.3	Kleverwise	100	1	49	1
16658	KW-16	16	2.25	Kleverwise	100	1	49	1
16660	KW-16	16	2.3	Kleverwise	100	1	49	1
16665	KWC	16	2.3	KWChoice	100	1	49	1
16667	KW-16	16	2.25	Kleverwise	100	1	49	1
16670	KW-16	16	2.3	Kleverwise	100	1	49	1
16671	KW-16	16	2.25	Kleverwise	100	1	49	1
16673	KW-16	16	2.25	Kleverwise	100	1	49	1
16674	KW-16	16	2.3	Kleverwise	0	0	49	1
16675	KW-16	16	2.3	Kleverwise	100	1	49	1
16678	KW-16	16	2.3	Kleverwise	100	1	49	1
16680	KWC	16	2.3	KWChoice	100	1	49	1
16683	KW-16	16	2.3	Kleverwise	100	1	49	1
16688	KW-16	16	2	Kleverwise	100	1	49	1
16691	KW-16	16	2.3	Kleverwise	100	1	49	1
16695	KW-16	16	2.25	Kleverwise	100	1	49	1
16703	KW-16	16	2.3	Kleverwise	100	1	49	1
16706	KW-16	16	2.3	Kleverwise	100	1	49	1
16709	KW-16	16	2.3	Kleverwise	100	1	49	1
16716	KW-16	16	2.3	Kleverwise	100	1	49	1
16717	KW-16	16	2.3	Kleverwise	100	1	50	1
16719	KW-16	16	2.3	Kleverwise	100	1	49	1
16720	KWC	16	2.3	KWChoice	100	1	49	1
16721	KW-16	16	2.3	Kleverwise	100	1	49	1
16722	KW-16	16	2.3	Kleverwise	100	1	49	1
16723	KW-16	16	2.3	Kleverwise	100	1	49	1
16724	KW-16	16	2.3	Kleverwise	100	1	49	1
16725	KW-16	16	2.3	Kleverwise	100	1	49	1
16726	KW-16	16	2.3	Kleverwise	100	1	49	1
16727	KW-16	16	2.3	Kleverwise	100	1	49	1
16728	KW-16	16	2.3	Kleverwise	100	1	49	1
16732	KW-16	16	2.3	Kleverwise	50	1	49	1
16734	KW-16	16	2.25	Kleverwise	100	1	49	1
16737	KW-16	16	2.25	Kleverwise	0	0	49	1
16738	KW-16	16	2.3	Kleverwise	100	1	49	1
16739	STD-12	12	2.3	Traditional	50	1	49	1
16741	KW-16	16	2.3	Kleverwise	100	1	49	1
16744	STD-12	12	2.3	Traditional	0	0	49	1
16746	KW-16	16	2.3	Kleverwise	100	1	49	1
16748	KW-16	16	2.3	Kleverwise	100	1	49	1
16750	KW-16	16	2.25	Kleverwise	100	1	49	1
16752	KW-16	16	2.3	Kleverwise	100	1	49	1
16753	KWC	16	2.3	KWChoice	100	1	49	1
16754	STD-12	12	2.3	Traditional	50	1	49	1
16757	KW-16	16	2.3	Kleverwise	100	1	49	1
16761	KW-16	16	2.3	Kleverwise	100	1	49	1
16763	KWC	16	2.3	KWChoice	100	1	49	1
16765	KW-16	16	2	Kleverwise	100	1	49	1
16767	KW-16	16	2	Kleverwise	100	1	49	1
16769	STD-12	12	2.3	Traditional	50	1	49	1
16771	KW-16	16	2.3	Kleverwise	100	1	49	1
16772	KW-16	16	2.3	Kleverwise	100	1	49	1
16775	KW-16	16	2.25	Kleverwise	100	1	49	1
16776	KW-16	16	2.3	Kleverwise	50	1	49	1
16777	KW-16	16	2.3	Kleverwise	100	1	49	1
16779	KW-16	16	2.3	Kleverwise	100	1	49	1
16782	KW-16	16	2.3	Kleverwise	100	1	49	1
16785	KW-16	16	2.3	Kleverwise	100	1	49	1
16786	KW-16	16	2.25	Kleverwise	100	1	49	1
16788	KW-16	16	2.3	Kleverwise	100	1	49	1
16789	KW-16	16	2.3	Kleverwise	100	1	49	1
16790	KW-16	16	2.3	Kleverwise	100	1	49	1
16797	KW-16	16	2	Kleverwise	100	1	49	1
16798	KW-16	16	2.3	Kleverwise	100	1	49	1
16803	KW-16	16	2.25	Kleverwise	100	1	49	1
16805	KW-16	16	2.3	Kleverwise	100	1	49	1
16806	KW-16	16	2.3	Kleverwise	100	1	49	1
16809	KW-16	16	2.25	Kleverwise	100	1	49	1
16810	KW-16	16	2.3	Kleverwise	100	1	49	1
16811	KW-16	16	2.3	Kleverwise	100	1	49	1
16812	KW-16	16	2.25	Kleverwise	100	1	49	1
16814	KW-16	16	2.3	Kleverwise	100	1	49	1
16817	KW-16	16	2.25	Kleverwise	100	1	49	1
16818	KW-16	16	2.25	Kleverwise	100	1	49	1
16819	KWC	16	2.3	KWChoice	100	1	49	1
16820	KW-16	16	2.3	Kleverwise	100	1	49	1
16822	KW-16	16	2.3	Kleverwise	100	1	49	1
16823	KW-16	16	2.3	Kleverwise	100	1	49	1
16825	KW-16	16	2.3	Kleverwise	100	1	49	1
16826	KW-16	16	2.25	Kleverwise	100	1	49	1
16829	KW-16	16	2.3	Kleverwise	100	1	49	1
16830	KW-16	16	2.3	Kleverwise	100	1	49	1
16833	KW-16	16	2.3	Kleverwise	0	0	49	1
16835	KW-16	16	2.3	Kleverwise	100	1	49	1
16836	KW-16	16	2.3	Kleverwise	100	1	49	1
16838	KW-16	16	2.3	Kleverwise	100	1	49	1
16844	KW-16	16	2.3	Kleverwise	100	1	49	1
16847	KW-16	16	2.3	Kleverwise	100	1	49	1
16849	KW-16	16	2.3	Kleverwise	100	1	49	1
16850	KW-16	16	2.3	Kleverwise	100	1	49	1
16852	KW-16	16	2.3	Kleverwise	100	1	49	1
16853	KW-16	16	2.3	Kleverwise	100	1	49	1
16855	KW-16	16	2.25	Kleverwise	100	1	49	1
16856	KW-16	16	2.3	Kleverwise	50	1	49	1
16860	STD-12	12	2.3	Traditional	0	0	49	1
16862	KW-16	16	2.3	Kleverwise	100	1	49	1
16864	KW-16	16	2.3	Kleverwise	100	1	49	1
16865	KW-16	16	2.3	Kleverwise	100	1	49	1
16866	KW-16	16	2.3	Kleverwise	100	1	49	1
16867	KW-16	16	2.3	Kleverwise	100	1	49	1
16868	KW-16	16	2.3	Kleverwise	100	1	49	1
16869	KW-16	16	2.3	Kleverwise	100	1	49	1
16873	KW-16	16	2.25	Kleverwise	100	1	49	1
16874	KW-16	16	2.25	Kleverwise	100	1	49	1
16876	KW-16	16	2.25	Kleverwise	100	1	49	1
16877	KW-16	16	2.25	Kleverwise	100	1	49	1
16880	KW-16	16	2.3	Kleverwise	100	1	49	1
16881	KW-16	16	2.3	Kleverwise	0	0	49	1
16884	KW-16	16	2.3	Kleverwise	100	1	49	1
16885	KW-16	16	2.25	Kleverwise	100	1	49	1
16887	KW-16	16	2	Kleverwise	100	1	49	1
16888	KW-16	16	2	Kleverwise	100	1	49	1
16889	KW-16	16	2	Kleverwise	100	1	49	1
16890	KW-16	16	2	Kleverwise	100	1	49	1
16891	KW-16	16	2	Kleverwise	100	1	49	1
16892	KW-16	16	2	Kleverwise	100	1	49	1
16893	KW-16	16	2	Kleverwise	100	1	49	1
16894	KW-16	16	2	Kleverwise	100	1	49	1
16895	KW-16	16	2	Kleverwise	100	1	49	1
16896	KW-16	16	2.3	Kleverwise	100	1	49	1
16897	KW-16	16	2.25	Kleverwise	100	1	49	1
16900	KW-16	16	2.3	Kleverwise	100	1	49	1
16901	KWC	16	2.3	KWChoice	100	1	50	1
16903	KW-16	16	2.25	Kleverwise	100	1	49	1
16905	KWC	16	2.3	KWChoice	100	1	49	1
16906	KWC	16	2.3	KWChoice	0	0	49	1
16912	KW-16	16	2.3	Kleverwise	100	1	49	1
16913	KW-16	16	2.3	Kleverwise	100	1	49	1
16914	KWC	16	2.3	KWChoice	100	1	49	1
16918	KW-16	16	2.3	Kleverwise	100	1	49	1
16919	KW-16	16	2.3	Kleverwise	100	1	49	1
16920	KW-16	16	2.3	Kleverwise	100	1	49	1
16921	KW-16	16	2.3	Kleverwise	100	1	49	1
16922	KW-16	16	2.3	Kleverwise	100	1	49	1
16923	KW-16	16	2.25	Kleverwise	100	1	49	1
16924	KW-16	16	2	Kleverwise	100	1	49	1
16925	KW-16	16	2.3	Kleverwise	100	1	49	1
16926	KW-16	16	2.3	Kleverwise	100	1	49	1
16927	KW-16	16	2.25	Kleverwise	100	1	49	1
16928	KW-16	16	2.3	Kleverwise	100	1	49	1
16931	KW-16	16	2.3	Kleverwise	100	1	49	1
16933	KW-16	16	2.25	Kleverwise	100	1	49	1
16935	KW-16	16	2.3	Kleverwise	100	1	49	1
16937	KW-16	16	2.3	Kleverwise	100	1	49	1
16939	KW-16	16	2.3	Kleverwise	100	1	49	1
16940	KWC	16	2.3	KWChoice	100	1	49	1
16941	KWC	16	2.3	KWChoice	100	1	49	1
16942	KW-16	16	2.3	Kleverwise	100	1	49	1
16944	KW-16	16	2.3	Kleverwise	100	1	49	1
16948	KW-16	16	2.25	Kleverwise	100	1	49	1
16949	KW-16	16	2.25	Kleverwise	100	1	49	1
16950	STD-12	12	2.3	Traditional	50	1	49	1
16951	KW-16	16	2.3	Kleverwise	100	1	49	1
16953	KW-16	16	2.3	Kleverwise	100	1	25	1
16954	KW-16	16	2	Kleverwise	100	1	49	1
16955	KW-16	16	2.3	Kleverwise	100	1	49	1
16956	KW-16	16	2.3	Kleverwise	0	0	49	1
16962	KW-16	16	2.3	Kleverwise	100	1	49	1
16965	KW-16	16	2.3	Kleverwise	100	1	49	1
16966	KW-16	16	2	Kleverwise	100	1	49	1
16967	KW-16	16	2.3	Kleverwise	100	1	49	1
16981	KW-16	16	2	Kleverwise	100	1	49	1
16982	KW-16	16	2.3	Kleverwise	100	1	49	1
16993	STD-12	12	2.3	Traditional	50	1	49	1
16994	KW-16	16	2.25	Kleverwise	100	1	49	1
16997	KW-16	16	2.3	Kleverwise	100	1	49	1
16998	KW-16	16	2.3	Kleverwise	100	1	49	1
16999	KW-16	16	2.3	Kleverwise	100	1	49	1
17000	KW-16	16	2	Kleverwise	100	1	49	1
17001	KW-16	16	2.25	Kleverwise	100	1	49	1
17005	KW-16	16	2.3	Kleverwise	100	1	49	1
17009	KW-16	16	2.3	Kleverwise	100	1	49	1
17010	KW-16	16	2.3	Kleverwise	100	1	49	1
17012	KW-16	16	2.25	Kleverwise	50	1	49	1
17013	KW-16	16	2.25	Kleverwise	100	1	49	1
17014	KWC	16	2.3	KWChoice	100	1	49	1
17017	KW-16	16	2.3	Kleverwise	100	1	49	1
17024	KW-16	16	2.3	Kleverwise	100	1	49	1
17026	KW-16	16	2	Kleverwise	100	1	49	1
17036	KW-16	16	2.3	Kleverwise	100	1	49	1
17041	KW-16	16	2.3	Kleverwise	100	1	49	1
17042	KW-16	16	2.3	Kleverwise	100	1	49	1
17045	KW-16	16	2.3	Kleverwise	100	1	49	1
17054	KWC	16	2.3	KWChoice	100	1	49	1
17058	KW-16	16	2.3	Kleverwise	100	1	49	1
17059	KW-16	16	2.3	Kleverwise	100	1	49	1
17064	KWC	16	2.3	KWChoice	100	1	49	1
17066	KW-16	16	2	Kleverwise	100	1	49	1
17068	STD-12	12	2.25	Traditional	0	1	49	1
17069	KW-16	16	2.3	Kleverwise	100	1	49	1
17072	KW-16	16	2.3	Kleverwise	100	1	49	1
17076	KW-16	16	2.3	Kleverwise	100	1	49	1
17077	KW-16	16	2.25	Kleverwise	0	0	49	1
17080	KW-16	16	2.3	Kleverwise	100	1	49	1
17081	KW-16	16	2.3	Kleverwise	0	0	49	1
17083	KW-16	16	2.3	Kleverwise	100	1	49	1
17086	KW-16	16	2.3	Kleverwise	100	1	49	1
17087	KW-16	16	2.3	Kleverwise	100	1	49	1
17091	KW-16	16	2.25	Kleverwise	100	1	49	1
17092	KW-16	16	2.3	Kleverwise	100	1	49	1
17103	KW-16	16	2.3	Kleverwise	100	1	49	1
17106	KW-16	16	2.25	Kleverwise	100	1	49	1
17118	KW-16	16	2.25	Kleverwise	100	1	49	1
17119	KW-16	16	2.3	Kleverwise	100	1	49	1
17120	KW-16	16	2.25	Kleverwise	100	1	49	1
17121	KW-16	16	2.3	Kleverwise	100	1	49	1
17123	KW-16	16	2.25	Kleverwise	100	1	49	1
17128	KW-16	16	2.3	Kleverwise	100	1	49	1
17132	RL90	4	1.6	ReLease90	0	0	0	0
17133	RL90	4	1.2746	ReLease90	0	0	0	0
17134	RL90	4	1.3378	ReLease90	0	0	0	0
17135	RL90	4	1.4041	ReLease90	0	0	0	0
17136	RL90	4	1.4738	ReLease90	0	0	0	0
17137	RL90	4	1.5471	ReLease90	0	0	0	0
17138	RL90	4	1.6243	ReLease90	0	0	0	0
17139	RL90	4	1.7056	ReLease90	0	0	0	0
17140	RL90	4	1.7916	ReLease90	0	0	0	0
17141	RL90	4	1.8825	ReLease90	0	0	0	0
17142	RL90	4	1.9788	ReLease90	0	0	0	0
17145	KW-16	16	2.25	Kleverwise	100	1	49	1
17147	KW-16	16	2.3	Kleverwise	100	1	49	1
17150	KW-16	16	2.25	Kleverwise	100	1	49	1
17151	KW-16	16	2.3	Kleverwise	100	1	49	1
17153	KW-16	16	2.3	Kleverwise	100	1	49	1
17155	KW-16	16	2.3	Kleverwise	100	1	49	1
17159	KW-16	16	2.25	Kleverwise	100	1	49	1
17160	KW-16	16	2.25	Kleverwise	100	1	49	1
17162	KW-16	16	2.3	Kleverwise	100	1	49	1
17164	KW-16	16	2.25	Kleverwise	100	1	49	1
17166	KW-16	16	2.25	Kleverwise	100	1	49	1
17167	RL90	4	1.6	ReLease90	0	0	40	0
17168	KWC	16	2.3	KWChoice	100	1	49	1
17169	KW-16	16	2.3	Kleverwise	100	1	49	1
17172	KW-16	16	2.3	Kleverwise	100	1	49	1
17173	KW-16	16	2.25	Kleverwise	100	1	49	1
17179	KW-16	16	2.25	Kleverwise	100	1	49	1
17183	KW-16	16	2.3	Kleverwise	100	1	49	1
17184	KW-16	16	2.3	Kleverwise	100	1	49	1
17186	KW-16	16	2.3	Kleverwise	100	1	49	1
17187	KW-16	16	2.3	Kleverwise	100	1	49	1
17188	KW-16	16	2.3	Kleverwise	100	1	49	1
17189	KW-16	16	2.25	Kleverwise	50	1	25	1
17190	KW-16	16	2.3	Kleverwise	100	1	49	1
17193	KW-16	16	2.25	Kleverwise	100	1	49	1
17198	KW-16	16	2.3	Kleverwise	100	1	49	1
17199	KW-16	16	2.3	Kleverwise	0	0	9	1
17202	KW-16	16	2.3	Kleverwise	100	1	49	1
17203	KW-16	16	2.25	Kleverwise	100	1	49	1
17204	KW-16	16	2.3	Kleverwise	100	1	49	1
17205	KW-16	16	2.25	Kleverwise	100	1	49	1
17207	KW-16	16	2.3	Kleverwise	100	1	49	1
17208	KW-16	16	2.25	Kleverwise	100	1	49	1
17210	KW-16	16	2.3	Kleverwise	100	1	49	1
17211	KW-16	16	2	Kleverwise	50	1	49	1
17212	KW-16	16	2.3	Kleverwise	100	1	49	1
17213	KW-16	16	2.3	Kleverwise	100	1	49	1
17217	KW-16	16	2.3	Kleverwise	100	1	49	1
17218	KW-16	16	2.25	Kleverwise	100	1	500	1
17219	KW-16	16	2.25	Kleverwise	0	0	49	1
17220	STD-12	12	2.3	Traditional	50	1	49	1
17221	KWC	16	2.3	KWChoice	100	1	49	1
17222	STD-12	12	2.3	Traditional	50	1	49	1
17223	KW-16	16	2	Kleverwise	100	1	49	1
17224	KW-16	16	2.3	Kleverwise	100	1	49	1
17226	KW-16	16	2.25	Kleverwise	100	1	49	1
17228	KW-16	16	2.25	Kleverwise	100	1	49	1
17230	KW-16	16	2.3	Kleverwise	100	1	49	1
17232	KW-16	16	2.25	Kleverwise	100	1	49	1
17234	KW-16	16	2.25	Kleverwise	100	1	49	1
17240	KW-16	16	2.3	Kleverwise	100	1	49	1
17242	KW-16	16	2.3	Kleverwise	100	1	49	1
17243	KW-16	16	2.25	Kleverwise	0	0	49	1
17248	KW-16	16	2.3	Kleverwise	100	1	49	1
17250	KW-16	16	2.25	Kleverwise	100	1	49	1
17251	KW-16	16	2.25	Kleverwise	100	1	49	1
17252	KWC	16	2.3	KWChoice	100	1	49	1
17253	KW-16	16	2.3	Kleverwise	100	1	49	1
17254	KW-16	16	2.3	Kleverwise	100	1	49	1
17255	KW-16	16	2.3	Kleverwise	100	1	49	1
17256	KW-16	16	2.3	Kleverwise	100	1	49	1
17257	KW-16	16	2.3	Kleverwise	100	1	49	1
17259	KW-16	16	2.3	Kleverwise	100	1	49	1
17261	KW-16	16	2.25	Kleverwise	100	1	49	1
17262	KW-16	16	2.25	Kleverwise	100	1	49	1
17265	KW-16	16	2.3	Kleverwise	100	1	49	1
17267	KW-16	16	2.3	Kleverwise	100	1	49	1
17268	KW-16	16	2.3	Kleverwise	100	1	49	1
17269	KW-16	16	2.25	Kleverwise	100	1	49	1
17270	KW-16	16	2.3	Kleverwise	100	1	49	1
17272	KWC	16	2.3	KWChoice	100	1	49	1
17273	KW-16	16	2.3	Kleverwise	100	1	49	1
17274	KW-16	16	2.3	Kleverwise	100	1	49	1
17276	KW-16	16	2.3	Kleverwise	100	1	49	1
17277	KW-16	16	2.3	Kleverwise	100	1	49	1
17278	KW-16	16	2.3	Kleverwise	100	1	49	1
17283	KW-16	16	2.25	Kleverwise	100	1	49	1
17286	KW-16	16	2.3	Kleverwise	100	1	49	1
17287	KWC	16	2.3	KWChoice	100	1	49	1
17288	KW-16	16	2.3	Kleverwise	0	0	49	1
17289	KW-16	16	2	Kleverwise	100	1	49	1
17290	KW-16	16	2.25	Kleverwise	100	1	49	1
17293	KWC	16	2.3	KWChoice	100	1	49	1
17295	KW-16	16	2.3	Kleverwise	100	1	49	1
17296	KW-16	16	2.25	Kleverwise	100	1	49	1
17298	KW-16	16	2.3	Kleverwise	100	1	49	1
17300	KW-16	16	2.3	Kleverwise	100	1	49	1
17301	KW-16	16	2.25	Kleverwise	0	0	49	1
17302	KW-16	16	2.3	Kleverwise	100	1	49	1
17304	KW-16	16	2.25	Kleverwise	100	1	49	1
17305	KW-16	16	2.3	Kleverwise	100	1	49	1
17307	KWC	16	2.3	KWChoice	100	1	49	1
17309	KW-16	16	2	Kleverwise	100	1	49	1
17310	KW-16	16	2.3	Kleverwise	100	1	49	1
17312	KW-16	16	2.3	Kleverwise	100	1	49	1
17313	KWC	16	2.3	KWChoice	100	1	49	1
17317	KW-16	16	2	Kleverwise	100	1	49	1
17320	KW-16	16	2.3	Kleverwise	100	1	49	1
17321	KW-16	16	2.3	Kleverwise	100	1	49	1
17322	KW-16	16	2.3	Kleverwise	100	1	49	1
17323	KW-16	16	2.3	Kleverwise	100	1	49	1
17324	KW-16	16	2.3	Kleverwise	100	1	49	1
17326	KW-16	16	2.25	Kleverwise	100	1	49	1
17327	KW-16	16	2.3	Kleverwise	100	1	49	1
17328	KW-16	16	2.3	Kleverwise	100	1	49	1
17332	KW-16	16	2.3	Kleverwise	50	1	49	1
17334	KWC	16	2.3	KWChoice	100	1	49	1
17339	KW-16	16	2.25	Kleverwise	100	1	49	1
17340	KW-16	16	2.25	Kleverwise	0	1	49	1
17340	KW-16	16	2.25	Kleverwise	0	0	49	1
17342	KW-16	16	2.25	Kleverwise	100	1	49	1
17343	KW-16	16	2.3	Kleverwise	50	1	49	1
17344	KWC	16	2.3	KWChoice	100	1	49	1
17346	KW-16	16	2	Kleverwise	100	1	49	1
17349	KW-16	16	2.3	Kleverwise	100	1	49	1
17351	KWC	16	2.3	KWChoice	100	1	49	1
17353	KW-16	16	2.3	Kleverwise	100	1	49	1
17354	KW-16	16	2.25	Kleverwise	100	1	49	1
17355	KW-16	16	2	Kleverwise	100	1	49	1
17359	KW-16	16	2	Kleverwise	100	1	49	1
17361	KWC	16	2.3	KWChoice	50	1	49	1
17366	KW-16	16	2	Kleverwise	100	1	49	1
17367	KW-16	16	2.3	Kleverwise	50	1	49	1
17368	KWC	16	2.3	KWChoice	100	1	49	1
17371	KW-16	16	2.3	Kleverwise	50	1	9	1
17372	KW-16	16	2	Kleverwise	50	1	9	1
17373	KW-16	16	2	Kleverwise	100	1	49	1
17378	KW-16	16	2	Kleverwise	50	1	49	1
17379	KW-16	16	2	Kleverwise	100	1	49	1
17382	KW-16	16	2.3	Kleverwise	50	1	49	1
17383	KW-16	16	2.3	Kleverwise	100	1	49	1
17384	KW-16	16	2.3	Kleverwise	100	1	49	1
17385	KW-16	16	2.3	Kleverwise	100	1	49	1
17386	KWC	16	1.75	KWChoice	0	0	50	1
17398	KW-16	16	2.25	Kleverwise	100	1	49	1
17400	KW-16	16	2.3	Kleverwise	100	1	49	1
17403	KW-16	16	2.3	Kleverwise	100	1	49	1
17404	KW-16	16	2.25	Kleverwise	100	1	49	1
17405	KW-16	16	2	Kleverwise	0	1	49	1
17408	KW-16	16	2.3	Kleverwise	100	1	49	1
17417	KW-16	16	2.3	Kleverwise	50	1	49	1
17418	KW-16	16	2.3	Kleverwise	50	1	49	1
17419	KW-16	16	2.25	Kleverwise	100	1	49	1
17420	KW-16	16	2.25	Kleverwise	100	1	49	1
17421	KW-16	16	2.25	Kleverwise	100	1	49	1
17423	KW-16	16	2.25	Kleverwise	100	1	49	1
17425	KW-16	16	2.3	Kleverwise	100	1	49	1
17427	KW-16	16	2.3	Kleverwise	100	1	49	1
17428	KW-16	16	2.3	Kleverwise	100	1	49	1
17429	KW-16	16	2.3	Kleverwise	100	1	49	1
17430	KW-16	16	2.25	Kleverwise	100	1	49	1
17431	KW-16	16	2	Kleverwise	100	1	49	1
17434	KW-16	16	2.25	Kleverwise	100	1	49	1
17435	KW-16	16	2.3	Kleverwise	100	1	49	1
17436	KW-16	16	2.3	Kleverwise	100	1	49	1
17437	KW-16	16	2.1	Kleverwise	50	1	25	1
17438	KW-16	16	2.25	Kleverwise	100	1	49	1
17440	KW-16	16	2.25	Kleverwise	100	1	49	1
17441	KW-16	16	2.25	Kleverwise	0	0	49	1
17444	KW-16	16	2.3	Kleverwise	100	1	49	1
17445	KW-16	16	2.3	Kleverwise	100	1	49	1
17447	KW-16	16	2.3	Kleverwise	100	1	49	1
17450	KW-16	16	2.3	Kleverwise	100	1	49	1
17453	KW-16	16	2.25	Kleverwise	100	1	49	1
17455	KW-16	16	2.3	Kleverwise	100	1	49	1
17460	KW-16	16	2.25	Kleverwise	100	1	49	1
17463	KW-16	16	2.25	Kleverwise	100	1	49	1
17466	KW-16	16	2.25	Kleverwise	100	1	49	1
17470	KW-16	16	2.3	Kleverwise	100	1	49	1
17471	RL90	4	1.6	ReLease90	0	0	49	1
17472	KW-16	16	2.25	Kleverwise	100	1	49	1
17473	KW-16	16	2.25	Kleverwise	0	0	49	1
17474	KWC	16	2.3	KWChoice	100	1	49	1
17475	KW-16	16	2.3	Kleverwise	100	1	49	1
17479	KW-16	16	2.3	Kleverwise	100	1	49	1
17481	KW-16	16	2.3	Kleverwise	100	1	49	1
17490	KW-16	16	2.25	Kleverwise	100	1	49	1
17492	KW-16	16	2.25	Kleverwise	100	1	49	1
17496	KW-16	16	2.3	Kleverwise	100	1	49	1
17500	KW-16	16	2.3	Kleverwise	100	1	49	1
17501	KW-16	16	2.25	Kleverwise	100	1	49	1
17503	KW-16	16	2.25	Kleverwise	100	1	49	1
17505	KW-16	16	2.25	Kleverwise	0	0	49	1
17508	KWC	16	2.3	KWChoice	100	1	49	1
17510	KW-16	16	2.3	Kleverwise	100	1	49	1
17515	KW-16	16	2.3	Kleverwise	100	1	49	1
17520	KW-16	16	2.25	Kleverwise	100	1	49	1
17522	KW-16	16	2.3	Kleverwise	100	1	49	1
17523	KW-16	16	2.25	Kleverwise	100	1	49	1
17524	KW-16	16	2.25	Kleverwise	100	1	49	1
17525	KW-16	16	2.3	Kleverwise	0	0	49	1
17532	KWC	16	2.25	KWChoice	100	1	49	1
17538	KWC	16	2.3	KWChoice	100	1	49	1
17542	KW-16	16	2	Kleverwise	100	1	49	1
17543	KW-16	16	2.3	Kleverwise	100	1	49	1
17544	KW-16	16	2.3	Kleverwise	100	1	49	1
17549	KW-16	16	2.3	Kleverwise	100	1	49	1
17557	KW-16	16	2.3	Kleverwise	100	1	49	1
17577	KW-16	16	2.3	Kleverwise	50	1	49	1
17579	KW-16	16	2.25	Kleverwise	100	1	49	1
17581	KW-16	16	2.3	Kleverwise	50	1	49	1
17593	KW-16	16	2.3	Kleverwise	50	1	49	1
17605	KW-16	16	2.25	Kleverwise	100	1	49	1
17611	KW-16	16	2.25	Kleverwise	100	1	49	1
17619	KW-16	16	2.3	Kleverwise	100	1	49	1
17622	KW-16	16	2.3	Kleverwise	100	1	49	1
17641	KW-16	16	2.25	Kleverwise	100	1	49	1
17660	KW-16	16	2.3	Kleverwise	100	1	49	1
17661	KW-16	16	2.25	Kleverwise	100	1	49	1
17662	KW-16	16	2	Kleverwise	100	1	49	1
17663	KW-16	16	2.25	Kleverwise	100	1	49	1
17665	KW-16	16	2.25	Kleverwise	100	1	49	1
17666	KW-16	16	2.3	Kleverwise	100	1	49	1
17667	KWC	16	2.3	KWChoice	100	1	49	1
17668	KW-16	16	2.3	Kleverwise	100	1	49	1
17677	KW-16	16	2	Kleverwise	100	1	49	1
17682	KW-16	16	2.3	Kleverwise	100	1	49	1
17683	KW-16	16	2.25	Kleverwise	100	1	49	1
17685	KW-16	16	2	Kleverwise	100	1	49	1
17688	KW-16	16	2.3	Kleverwise	100	1	49	1
17689	KW-16	16	2	Kleverwise	100	1	49	1
17690	KW-16	16	2.25	Kleverwise	100	1	49	1
17693	P10	10	1.5	Prime10	0	0	49	1
17702	KW-16	16	2.3	Kleverwise	100	1	49	1
17709	KW-16	16	2.3	Kleverwise	100	1	25	1
17716	KW-16	16	2.3	Kleverwise	100	1	49	1
17719	KW-16	16	2.25	Kleverwise	0	0	49	1
17723	KW-16	16	2.3	Kleverwise	100	1	49	1
17725	KW-16	16	2.25	Kleverwise	100	1	49	1
17727	KW-16	16	2.3	Kleverwise	100	1	49	1
17730	KW-16	16	2.3	Kleverwise	100	1	49	1
17731	KW-16	16	2.25	Kleverwise	100	1	49	1
17733	KW-16	16	2.25	Kleverwise	0	0	49	1
17740	KW-16	16	2	Kleverwise	100	1	49	1
17743	KW-16	16	2.25	Kleverwise	100	1	49	1
17745	KW-16	16	2.25	Kleverwise	0	0	49	1
17747	KW-16	16	2.3	Kleverwise	100	1	49	1
17748	KW-16	16	2.3	Kleverwise	100	1	49	1
17749	KW-16	16	2.3	Kleverwise	100	1	49	1
17750	KW-16	16	2.3	Kleverwise	100	1	49	1
17751	KW-16	16	2.3	Kleverwise	100	1	49	1
17752	KW-16	16	2.3	Kleverwise	100	1	49	1
17753	KW-16	16	2.25	Kleverwise	100	1	49	1
17754	KW-16	16	2.3	Kleverwise	100	1	49	1
17757	KW-16	16	2.3	Kleverwise	100	1	49	1
17759	KW-16	16	2.25	Kleverwise	100	1	99	1
17763	KW-16	16	2	Kleverwise	100	1	49	1
17766	KW-16	16	2.3	Kleverwise	100	1	49	1
17767	KW-16	16	2.3	Kleverwise	100	1	49	1
17769	KW-16	16	2	Kleverwise	100	1	99	1
17770	KW-16	16	2.25	Kleverwise	0	0	49	1
17778	KW-16	16	2.25	Kleverwise	100	1	99	1
17782	KW-16	16	2.25	Kleverwise	100	1	49	1
17783	KW-16	16	2.3	Kleverwise	100	1	99	1
17784	KW-16	16	2.25	Kleverwise	100	1	49	1
17785	KW-16	16	2.3	Kleverwise	100	1	49	1
17789	KW-16	16	2.25	Kleverwise	100	1	99	1
17792	KW-16	16	2.3	Kleverwise	100	1	49	1
17796	KW-16	16	2.25	Kleverwise	100	1	49	1
17797	KW-16	16	2.25	Kleverwise	100	1	49	1
17798	KW-16	16	2.25	Kleverwise	100	1	99	1
17800	KWC	16	2	KWChoice	100	1	0	0
17801	KW-16	16	2.3	Kleverwise	100	1	49	1
17803	KW-16	16	2.3	Kleverwise	0	0	49	1
17807	KWC	16	2.3	KWChoice	100	1	49	1
17811	KWC	16	2	KWChoice	100	1	0	0
17818	KW-16	16	2.25	Kleverwise	100	1	49	1
17819	KW-16	16	2.3	Kleverwise	100	1	49	1
17820	KWC	16	2.25	KWChoice	100	1	49	1
17821	KW-16	16	2.3	Kleverwise	100	1	49	1
17822	KW-16	16	2.25	Kleverwise	100	1	49	1
17823	KWC	16	2.3	KWChoice	100	1	49	1
17824	KW-16	16	2.25	Kleverwise	100	1	49	1
17826	KW-16	16	2.3	Kleverwise	100	1	49	1
17831	KW-16	16	2.25	Kleverwise	100	1	0	0
17832	KWC	16	2.3	KWChoice	100	1	49	1
17833	KW-16	16	2.3	Kleverwise	100	1	49	1
17842	KWC	16	2	KWChoice	100	1	0	0
17843	KW-16	16	1	Kleverwise	0	0	0	0
17846	KW-16	16	2.3	Kleverwise	50	1	9	1
17847	PR-24	24	1.6	PhoneRental	0	0	0	0
17854	P10	10	1.75	Prime10	0	0	49	1
17855	KW-16	16	2.3	Kleverwise	0	0	49	1
17856	KW-16	16	2.3	Kleverwise	0	0	49	1
17857	KWC	16	2.3	KWChoice	0	0	49	1
17866	KW-16	16	2.25	Kleverwise	100	1	49	1
17867	KW-16	16	2.3	Kleverwise	100	1	49	1
17873	KW-16	16	2.3	Kleverwise	0	0	49	1
17874	KW-16	16	2.3	Kleverwise	100	1	49	1
17878	KW-16	16	2.3	Kleverwise	100	1	49	1
17879	KWC	16	2.3	KWChoice	100	1	49	1
17885	KW-16	16	2.3	Kleverwise	100	1	49	1
17886	KWC	16	2.3	KWChoice	100	1	49	1
17889	KW-16	16	2.3	Kleverwise	100	1	49	1
17895	KW-16	16	2.3	Kleverwise	100	1	49	1
17898	KW-16	16	2	Kleverwise	0	1	49	0
17899	KW-16	16	2	Kleverwise	0	1	49	0
17905	KW-16	16	2.3	Kleverwise	100	1	49	1
17907	KW-16	16	2	Kleverwise	100	1	49	1
17917	KW-16	16	2.25	Kleverwise	100	1	49	1
17928	KW-16	16	2.3	Kleverwise	100	1	49	1
17931	KW-16	16	2.3	Kleverwise	100	1	49	1
17933	KW-16	16	2.25	Kleverwise	0	0	49	1
17937	KW-16	16	2.3	Kleverwise	100	1	49	1
17939	KW-16	16	2.25	Kleverwise	100	1	49	1
17940	KW-16	16	2.25	Kleverwise	100	1	49	1
17945	KW-16	16	2.25	Kleverwise	100	1	99	1
17947	KW-16	16	2.3	Kleverwise	100	1	49	1
17953	KW-16	16	2.3	Kleverwise	100	1	49	1
17957	KWC	16	2.3	KWChoice	100	1	99	1
17958	KW-16	16	2.3	Kleverwise	100	1	49	1
17961	KW-16	16	2.3	Kleverwise	100	1	49	1
17962	KW-16	16	2.3	Kleverwise	100	1	49	1
17964	KW-16	16	2.25	Kleverwise	100	1	49	1
17967	KW-16	16	2.3	Kleverwise	100	1	49	1
17970	KW-16	16	2.25	Kleverwise	100	1	49	1
17973	KW-16	16	2.3	Kleverwise	100	1	49	1
17974	KW-16	16	2.3	Kleverwise	100	1	99	1
17980	KW-16	16	2	Kleverwise	100	1	99	1
17982	KW-16	16	2.25	Kleverwise	100	1	49	1
17987	KW-16	16	2.3	Kleverwise	100	1	49	1
17988	KW-16	16	2.3	Kleverwise	100	1	49	1
17992	KW-16	16	2.3	Kleverwise	100	1	99	1
17997	KWC	16	2	KWChoice	100	1	0	0
18013	KW-16	16	2	Kleverwise	100	1	99	1
18016	KW-16	16	2.3	Kleverwise	100	1	49	1
18021	KW-16	16	2.3	Kleverwise	100	1	49	1
18023	KWC	16	2.3	KWChoice	100	1	49	1
18031	KWC	16	2	KWChoice	100	1	0	0
18037	KW-16	16	2.3	Kleverwise	100	1	49	1
18042	KW-16	16	2.25	Kleverwise	100	1	49	1
18045	KW-16	16	2.3	Kleverwise	100	1	49	1
18046	KW-16	16	2.25	Kleverwise	100	1	49	1
18047	KW-16	16	2.3	Kleverwise	100	1	49	1
18054	KW-16	16	2.3	Kleverwise	100	1	49	1
18055	KW-16	16	2.3	Kleverwise	100	1	49	1
18060	KW-16	16	2.3	Kleverwise	100	1	49	1
18068	KW-16	16	2.3	Kleverwise	100	1	49	1
18070	KW-16	16	2.3	Kleverwise	100	1	49	1
18084	KW-16	16	2.25	Kleverwise	100	1	49	1
18086	KW-16	16	2.3	Kleverwise	100	1	49	1
18087	KW-16	16	2.3	Kleverwise	100	1	49	1
18090	KW-16	16	2.3	Kleverwise	100	1	49	1
18094	KW-16	16	2.25	Kleverwise	100	1	49	1
18109	KW-16	16	2.3	Kleverwise	50	1	49	1
18116	KW-16	16	2.3	Kleverwise	100	1	49	1
18117	KW-16	16	2.3	Kleverwise	100	1	49	1
18125	KW-16	16	2.3	Kleverwise	100	1	49	1
18126	KW-16	16	2.3	Kleverwise	100	1	49	1
18127	KW-16	16	2.3	Kleverwise	100	1	49	1
18129	KW-16	16	2.3	Kleverwise	100	1	49	1
18130	KW-16	16	2.25	Kleverwise	100	1	49	1
18131	KW-16	16	2.25	Kleverwise	100	1	49	1
18133	KW-16	16	2.3	Kleverwise	100	1	49	1
18138	KW-16	16	2.25	Kleverwise	100	1	49	1
18140	KW-16	16	2.3	Kleverwise	100	1	49	1
18141	KW-16	16	2.3	Kleverwise	100	1	49	1
18144	KW-16	16	2.3	Kleverwise	100	1	49	1
18145	KW-16	16	2.3	Kleverwise	100	1	49	1
18146	KW-16	16	2.25	Kleverwise	100	1	49	1
18147	KW-16	16	2.3	Kleverwise	100	1	49	1
18158	KW-16	16	2.3	Kleverwise	100	1	49	1
18159	KW-16	16	2.3	Kleverwise	100	1	49	1
18160	KW-16	16	2.3	Kleverwise	100	1	49	1
18161	KW-16	16	2.3	Kleverwise	100	1	49	1
18162	KW-16	16	2.25	Kleverwise	100	1	49	1
18164	KW-16	16	2.3	Kleverwise	100	1	49	1
18165	KW-16	16	2.25	Kleverwise	0	1	49	1
18168	KW-16	16	2.3	Kleverwise	100	1	49	1
18172	KW-16	16	2	Kleverwise	100	1	49	1
18174	KW-16	16	2.3	Kleverwise	100	1	49	1
18179	KW-16	16	2.25	Kleverwise	0	0	49	1
18181	KW-16	16	2.3	Kleverwise	100	1	49	1
18185	KW-16	16	2	Kleverwise	100	1	49	1
18186	KW-16	16	2	Kleverwise	100	1	49	1

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

```gherkin
# language: pt
Funcionalidade: Importação de Associações Merchant-Programa Kornerstone via Excel
  Como administrador do sistema UOWN
  Quero importar associações entre merchants e programas Kornerstone via arquivo Excel
  Para automatizar o cadastro em massa de configurações de leasing

  Contexto:
    Dado que o endpoint POST "/uown/importKornerstoneMerchantPrograms" está disponível
    E que o usuário possui autenticação válida via API Key

  # ============================================
  # CENÁRIOS DE SUCESSO
  # ============================================

  @importacao @sucesso
  Cenário: Importar arquivo Excel válido com merchants e programas STD-12 e KW-16
    Dado que existe um arquivo Excel válido contendo as colunas obrigatórias
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
    E que o merchant com refMerchantCode "KS-877" existe no sistema
    E que o merchant com refMerchantCode "KS-911" existe no sistema
    E que o programa "STD-12-2.25" existe no sistema
    E que o programa "KW-16-2.25" existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "totalRowsProcessed" igual a 2
    E a resposta deve conter "successfulImports" igual a 2
    E a resposta deve conter "failedImports" igual a 0
    E a resposta deve conter "skippedImports" igual a 0
    E a lista "errors" deve estar vazia
    E a lista "warnings" deve estar vazia
    E o merchant "KS-877" deve estar associado ao programa "STD-12-2.25"
    E o merchant "KS-911" deve estar associado ao programa "KW-16-2.25"

curl --location 'https://svc-sandbox.uownleasing.com/uown/importKornerstoneMerchantPrograms' \
--form 'excelFile=@"/path/to/valid-file.xlsx"'
curl --location 'https://svc-{{env}}.uownleasing.com/uown/importKornerstoneMerchantPrograms' \
--form 'excelFile=@"/Users/josedjalmaferreiramendes/Downloads/KSPrograms_test1.xlsx"'


  @importacao @sucesso @multiplos-produtos
  Cenário: Importar arquivo com todos os tipos de produto Kornerstone
    Dado que existe um arquivo Excel válido contendo merchants para cada tipo de produto
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1811        | KW-16        | 16     | 2        | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 1267        | STD-12       | 12     | 2        | Traditional | 50      | 1                 | 49              | 1                        |
      | 17133       | RL90         | 4      | 1.2746   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 2900        | P10          | 10     | 1.5      | Prime10     | 0       | 0                 | 49              | 1                        |
      | 1834        | KWC          | 16     | 2.3      | KWChoice    | 100     | 1                 | 49              | 1                        |
    E que todos os merchants correspondentes existem no sistema
    E que todos os programas correspondentes existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 5
    E cada merchant deve estar associado ao programa correto:
      | Merchant Code | Programa Esperado |
      | KS-1811       | KW-16-2           |
      | KS-1267       | STD-12-2          |
      | KS-17133      | RL90-1.2746       |
      | KS-2900       | P10-1.5           |
      | KS-1834       | KWC-2.3           |

  @importacao @sucesso @variacao-multiple
  Cenário: Importar merchants com diferentes variações de Multiple para KW-16
    Dado que existe um arquivo Excel com variações de Multiple para KW-16
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1811        | KW-16        | 16     | 2        | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 1443        | KW-16        | 16     | 2.1      | Kleverwise  | 50      | 1                 | 49              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 928         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 4
    E o merchant "KS-1811" deve estar associado ao programa "KW-16-2"
    E o merchant "KS-1443" deve estar associado ao programa "KW-16-2.1"
    E o merchant "KS-911" deve estar associado ao programa "KW-16-2.25"
    E o merchant "KS-928" deve estar associado ao programa "KW-16-2.3"

  @importacao @sucesso @rl90-variantes
  Cenário: Importar merchants com todas as variações de Multiple para RL90
    Dado que existe um arquivo Excel com variações de Multiple para RL90
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 17133       | RL90         | 4      | 1.2746   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17134       | RL90         | 4      | 1.3378   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17135       | RL90         | 4      | 1.4041   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17136       | RL90         | 4      | 1.4738   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17137       | RL90         | 4      | 1.5471   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17138       | RL90         | 4      | 1.6243   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17139       | RL90         | 4      | 1.7056   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17140       | RL90         | 4      | 1.7916   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17141       | RL90         | 4      | 1.8825   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17142       | RL90         | 4      | 1.9788   | ReLease90   | 0       | 0                 | 0               | 0                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 10
    E cada merchant RL90 deve estar associado ao programa correspondente

  # ============================================
  # CENÁRIOS DE AVISOS (WARNINGS)
  # ============================================

  @importacao @warning @produto-desconhecido
  Cenário: Arquivo contém Product Type PR-24 não mapeado no sistema
    Dado que existe um arquivo Excel contendo um Product Type desconhecido
      | Retailer ID | Product Type | Months | Multiple | Buyout Type  | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 17847       | PR-24        | 24     | 1.6      | PhoneRental  | 0       | 0                 | 0               | 0                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise   | 100     | 1                 | 49              | 1                        |
    E que o merchant "KS-911" e o programa "KW-16-2.25" existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 1
    E a resposta deve conter "failedImports" igual a 1
    E a lista "warnings" deve conter "Unknown Product Type 'PR-24'. Valid types: RL90, KW-16, KWC, P10, STD-12"
    E o merchant "KS-911" deve estar associado ao programa "KW-16-2.25"

  @importacao @warning @merchant-nao-encontrado
  Cenário: Retailer ID 99999 não existe no banco de dados
    Dado que existe um arquivo Excel com Retailer ID inexistente
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 99999       | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
    E que nenhum merchant com refMerchantCode "KS-99999" existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "warnings" deve conter "Merchant not found with refMerchantCode 'KS-99999'"
    E a resposta deve conter "successfulImports" igual a 0

  @importacao @warning @programa-nao-encontrado
  Cenário: Combinação KW-16 com Multiple 1 não existe como programa
    Dado que existe um arquivo Excel com combinação de programa inexistente
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 17843       | KW-16        | 16     | 1        | Kleverwise  | 0       | 0                 | 0               | 0                        |
    E que o merchant "KS-17843" existe no sistema
    E que o programa "KW-16-1" não existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "warnings" deve conter "Program not found with name 'KW-16-1'"

  @importacao @warning @multiple-invalido
  Cenário: Combinação KWC com Multiple 1.75 gera programa inexistente
    Dado que existe um arquivo Excel com Multiple não cadastrado
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 14110       | KWC          | 16     | 1.75     | KWChoice    | 0       | 0                 | 49              | 1                        |
    E que o merchant "KS-14110" existe no sistema
    E que o programa "KWC-1.75" não existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "warnings" deve conter "Program not found with name 'KWC-1.75'"

  # ============================================
  # CENÁRIOS DE SKIP (JÁ ASSOCIADO)
  # ============================================

  @importacao @skip @ja-associado
  Cenário: Reimportar arquivo onde merchant 877 já possui programa STD-12-2.25 associado
    Dado que o merchant "KS-877" já está associado ao programa "STD-12-2.25"
    E que existe um arquivo Excel contendo essa mesma associação
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "skippedImports" igual a 1
    E a resposta deve conter "successfulImports" igual a 0
    E nenhuma operação de banco de dados deve ser executada para linhas ignoradas
    E nenhum log de atividade duplicado deve ser criado

  @importacao @skip @parcial
  Cenário: Importar arquivo com mix de novas associações e existentes
    Dado que o merchant "KS-877" já está associado ao programa "STD-12-2.25"
    E que o merchant "KS-921" não está associado a nenhum programa
    E que existe um arquivo Excel contendo ambos merchants
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
      | 921         | STD-12       | 12     | 2.25     | Traditional | 0       | 1                 | 39              | 1                        |
    E que o programa "STD-12-2.25" existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 1
    E a resposta deve conter "skippedImports" igual a 1
    E apenas o merchant "KS-921" deve ter nova associação criada

  @importacao @skip @retailer-duplicado
  Cenário: Arquivo contém mesmo Retailer ID 9299 em duas linhas
    Dado que existe um arquivo Excel com Retailer ID duplicado
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 9299        | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 9299        | KW-16        | 16     | 2.3      | Kleverwise  | 50      | 1                 | 49              | 1                        |
    E que o merchant "KS-9299" existe no sistema
    E que o programa "KW-16-2.3" existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a primeira linha deve ser processada com sucesso
    E a segunda linha deve ser ignorada como "skippedImports"

  # ============================================
  # CENÁRIOS DE ERRO - FORMATO DE ARQUIVO
  # ============================================

  @importacao @erro @formato-invalido
  Cenário: Upload de arquivo CSV em vez de XLSX
    Dado que o usuário tenta submeter um arquivo "KSPrograms_1.csv" em vez de XLSX
    Quando o usuário submete o arquivo para importação
    Então a resposta deve conter erro "File must be an .xlsx file"
    E nenhum processamento deve ocorrer

  @importacao @erro @arquivo-vazio
  Cenário: Upload de arquivo Excel vazio
    Dado que o usuário tenta submeter um arquivo XLSX vazio
    Quando o usuário submete o arquivo para importação
    Então a resposta deve conter erro "Excel file is null or empty"
    E nenhum processamento deve ocorrer

  @importacao @erro @arquivo-nulo
  Cenário: Requisição sem arquivo anexado
    Dado que o usuário envia requisição POST para "/uown/importKornerstoneMerchantPrograms"
    E que o parâmetro "excelFile" não está presente
    Quando a requisição é processada
    Então a resposta deve indicar erro de arquivo ausente

  # ============================================
  # CENÁRIOS DE ERRO - DADOS INVÁLIDOS
  # ============================================

  @importacao @erro @retailer-id-ausente
  Cenário: Linha sem Retailer ID obrigatório
    Dado que existe um arquivo Excel com linha sem Retailer ID
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      |             | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
    E que o merchant "KS-911" e o programa "KW-16-2.25" existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a resposta deve conter "successfulImports" igual a 1
    E a lista "errors" deve conter "Row 2: Retailer ID is required"

  @importacao @erro @retailer-id-formato-invalido
  Cenário: Retailer ID com formato não-numérico
    Dado que existe um arquivo Excel com Retailer ID não-numérico
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | ABC         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "errors" deve conter "Invalid Retailer ID format: ABC"

  @importacao @erro @product-type-ausente
  Cenário: Linha sem Product Type obrigatório
    Dado que existe um arquivo Excel com linha sem Product Type
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         |              | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "errors" deve indicar "Product Type is required"

  @importacao @erro @multiple-ausente
  Cenário: Linha sem Multiple obrigatório
    Dado que existe um arquivo Excel com linha sem Multiple
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     |          | Traditional | 10      | 1                 | 40              | 1                        |
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "failedImports" igual a 1
    E a lista "errors" deve indicar "Multiple is required"

  @importacao @erro @processamento-continua
  Cenário: Processamento continua após erro em linha específica
    Dado que existe um arquivo Excel com erros intercalados
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
      | ABC         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      |             | STD-12       | 12     | 2.3      | Traditional | 50      | 1                 | 49              | 1                        |
      | 926         | STD-12       | 12     | 2.3      | Traditional | 50      | 1                 | 49              | 1                        |
    E que os merchants "KS-877", "KS-911" e "KS-926" existem no sistema
    E que os programas correspondentes existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "totalRowsProcessed" igual a 5
    E a resposta deve conter "successfulImports" igual a 3
    E a resposta deve conter "failedImports" igual a 2

  # ============================================
  # CENÁRIOS DE MAPEAMENTO DE PROGRAMAS
  # ============================================

  @importacao @mapeamento @kw-16
  Cenário: Mapeamento correto do Product Type KW-16 com Multiple 2.3
    Dado que existe um arquivo Excel com Product Type "KW-16" e Multiple "2.3"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 928         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
    Quando o sistema processa a linha
    Então o nome do programa deve ser construído como "KW-16-2.3"
    E o sistema deve buscar o programa com esse nome exato

  @importacao @mapeamento @std-12
  Cenário: Mapeamento correto do Product Type STD-12 com Multiple 2.1
    Dado que existe um arquivo Excel com Product Type "STD-12" e Multiple "2.1"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1443        | STD-12       | 12     | 2.1      | Traditional | 50      | 1                 | 49              | 1                        |
    Quando o sistema processa a linha
    Então o nome do programa deve ser construído como "STD-12-2.1"

  @importacao @mapeamento @rl90
  Cenário: Mapeamento correto do Product Type RL90 com Multiple decimal
    Dado que existe um arquivo Excel com Product Type "RL90" e Multiple "1.4041"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 17135       | RL90         | 4      | 1.4041   | ReLease90   | 0       | 0                 | 0               | 0                        |
    Quando o sistema processa a linha
    Então o nome do programa deve ser construído como "RL90-1.4041"

  @importacao @mapeamento @p10
  Cenário: Mapeamento correto do Product Type P10 com Multiple 1.75
    Dado que existe um arquivo Excel com Product Type "P10" e Multiple "1.75"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 14702       | P10          | 10     | 1.75     | Prime10     | 0       | 0                 | 49              | 1                        |
    Quando o sistema processa a linha
    Então o nome do programa deve ser construído como "P10-1.75"

  @importacao @mapeamento @kwc
  Cenário: Mapeamento correto do Product Type KWC com Multiple 2.3
    Dado que existe um arquivo Excel com Product Type "KWC" e Multiple "2.3"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1834        | KWC          | 16     | 2.3      | KWChoice    | 100     | 1                 | 49              | 1                        |
    Quando o sistema processa a linha
    Então o nome do programa deve ser construído como "KWC-2.3"

  @importacao @mapeamento @prefixo-ks
  Cenário: Retailer ID 877 é convertido para refMerchantCode KS-877
    Dado que existe um arquivo Excel com Retailer ID "877"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
    Quando o sistema processa a linha
    Então o sistema deve buscar merchant com refMerchantCode "KS-877"

  # ============================================
  # CENÁRIOS DE ESTRUTURA DE RESPOSTA
  # ============================================

  @importacao @resposta @estrutura
  Cenário: Validar estrutura completa da resposta de importação
    Dado que existe um arquivo Excel válido para importação
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
    E que o merchant e programa existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter todos os campos obrigatórios:
      | Campo              | Tipo    |
      | totalRowsProcessed | integer |
      | successfulImports  | integer |
      | failedImports      | integer |
      | skippedImports     | integer |
      | errors             | array   |
      | warnings           | array   |

  @importacao @resposta @contadores
  Cenário: Validar que contadores refletem corretamente o processamento misto
    Dado que existe um arquivo Excel com 10 linhas de dados reais
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 921         | STD-12       | 12     | 2.25     | Traditional | 0       | 1                 | 39              | 1                        |
      | 926         | STD-12       | 12     | 2.3      | Traditional | 50      | 1                 | 49              | 1                        |
      | 927         | STD-12       | 12     | 2.3      | Traditional | 50      | 1                 | 49              | 1                        |
      | 928         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | ABC         | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 49              | 1                        |
      |             | STD-12       | 12     | 2.25     | Traditional | 0       | 1                 | 39              | 1                        |
      | 946         | STD-12       | 12     | 2.25     | Traditional | 0       | 1                 | 39              | 1                        |
      | 947         | STD-12       | 12     | 2.25     | Traditional | 0       | 1                 | 49              | 1                        |
    E que 6 linhas são válidas e serão importadas com sucesso
    E que 2 linhas têm erros e falharão
    E que 2 linhas já existem e serão ignoradas
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "totalRowsProcessed" igual a 10
    E a soma de "successfulImports" + "failedImports" + "skippedImports" deve ser igual a 10

  # ============================================
  # CENÁRIOS DE REMOÇÃO DE ASSOCIAÇÕES ANTIGAS
  # ============================================

  @importacao @associacao @remocao
  Cenário: Nova associação remove programa anterior do merchant 877
    Dado que o merchant "KS-877" está associado ao programa "STD-12-2"
    E que existe um arquivo Excel associando o merchant ao novo programa "STD-12-2.25"
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
    E que o programa "STD-12-2.25" existe no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a associação antiga com "STD-12-2" deve ser removida
    E a nova associação com "STD-12-2.25" deve ser criada
    E o log de atividade deve registrar a remoção do programa anterior
    E o log de atividade deve registrar a criação da nova associação

  @importacao @associacao @logs
  Cenário: Logs de atividade são criados para cada associação bem-sucedida
    Dado que existe um arquivo Excel com 3 merchants válidos
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 877         | STD-12       | 12     | 2.25     | Traditional | 10      | 1                 | 40              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 1834        | KWC          | 16     | 2.3      | KWChoice    | 100     | 1                 | 49              | 1                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 3
    E 3 logs de atividade devem ser criados para as associações

  # ============================================
  # CENÁRIOS DE CONFIGURAÇÕES ESPECÍFICAS
  # ============================================

  @importacao @configuracao @ebo-fee
  Cenário: Importar merchants com diferentes configurações de EBO Fee
    Dado que existe um arquivo Excel com variações de EBO Fee
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1069        | KW-16        | 16     | 2.25     | Kleverwise  | 0       | 0                 | 49              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 1443        | KW-16        | 16     | 2.1      | Kleverwise  | 50      | 1                 | 49              | 1                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 3
    E as configurações de EBO Fee devem ser preservadas para cada merchant

  @importacao @configuracao @initial-payment
  Cenário: Importar merchants com diferentes valores de Initial Payment
    Dado que existe um arquivo Excel com variações de Initial Payment
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 1393        | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 10              | 1                        |
      | 1337        | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 39              | 1                        |
      | 911         | KW-16        | 16     | 2.25     | Kleverwise  | 100     | 1                 | 49              | 1                        |
      | 3223        | KW-16        | 16     | 2.3      | Kleverwise  | 100     | 1                 | 99              | 1                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 4

  @importacao @configuracao @rl90-sem-initial-payment
  Cenário: Importar merchants RL90 sem Initial Payment obrigatório
    Dado que existe um arquivo Excel com RL90 sem Initial Payment
      | Retailer ID | Product Type | Months | Multiple | Buyout Type | EBO Fee | Is EBO Fee Active | Initial Payment | Initial Payment Required |
      | 17133       | RL90         | 4      | 1.2746   | ReLease90   | 0       | 0                 | 0               | 0                        |
      | 17134       | RL90         | 4      | 1.3378   | ReLease90   | 0       | 0                 | 0               | 0                        |
    E que todos os merchants e programas existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "successfulImports" igual a 2
    E o Initial Payment Required "false" deve ser aceito para RL90

  # ============================================
  # CENÁRIOS DE VOLUME
  # ============================================

  @importacao @volume @grande
  Cenário: Importar arquivo com grande volume de registros
    Dado que existe um arquivo Excel com 100 linhas válidas de merchants
    E que todos os merchants e programas correspondentes existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "totalRowsProcessed" igual a 100
    E o processamento deve ser concluído com sucesso
    E o tempo de resposta deve ser aceitável

  @importacao @volume @lote-misto
  Cenário: Importar lote misto com todos os tipos de produto
    Dado que existe um arquivo Excel com distribuição mista de produtos
      | Product Type | Quantidade |
      | KW-16        | 50         |
      | STD-12       | 30         |
      | KWC          | 10         |
      | RL90         | 8          |
      | P10          | 2          |
    E que todos os merchants e programas correspondentes existem no sistema
    Quando o usuário submete o arquivo Excel para importação
    Então a resposta deve conter "totalRowsProcessed" igual a 100
    E cada tipo de produto deve ser processado corretamente
```

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

```gherkin
# language: pt
Funcionalidade: Importação de Associações Merchant-Programa Kornerstone via Excel

  # IMPORTAÇÃO BEM-SUCEDIDA
  
  Cenário: Arquivo Excel válido com merchants e programas existentes retorna totalRowsProcessed e successfulImports iguais ao número de linhas processadas
  
  Cenário: Arquivo válido com todos os tipos de produto Kornerstone associa cada merchant ao programa correspondente conforme mapeamento Product Type + Multiple
  
  # AVISOS (WARNINGS)
  
  Cenário: Product Type não mapeado no sistema adiciona warning com tipos válidos e continua processamento das demais linhas
  
  Cenário: Retailer ID inexistente no banco incrementa failedImports e adiciona warning informando merchant não encontrado com refMerchantCode
  
  Cenário: Combinação de Product Type e Multiple sem programa correspondente incrementa failedImports e adiciona warning informando programa não encontrado
  
  # SKIP (JÁ ASSOCIADO)
  
  Cenário: Merchant já associado ao mesmo programa incrementa skippedImports sem executar operações no banco de dados
  
  Cenário: Reimportação de arquivo com associações existentes não cria logs de atividade duplicados
  
  Cenário: Arquivo com mix de associações novas e existentes processa apenas as novas e incrementa skippedImports para as existentes
  
  # ERRO - FORMATO DE ARQUIVO
  
  Cenário: Arquivo não-xlsx retorna erro informando que deve ser arquivo .xlsx sem realizar processamento
  
  Cenário: Arquivo Excel vazio retorna erro informando arquivo nulo ou vazio sem realizar processamento
  
  Cenário: Requisição sem arquivo anexado retorna erro de arquivo ausente
  
  # ERRO - DADOS INVÁLIDOS
  
  Cenário: Linha sem Retailer ID obrigatório incrementa failedImports e registra erro com número da linha
  
  Cenário: Retailer ID com formato não-numérico incrementa failedImports e registra erro de formato inválido
  
  Cenário: Linha sem Product Type obrigatório incrementa failedImports e registra erro indicando campo ausente
  
  Cenário: Linha sem Multiple obrigatório incrementa failedImports
  
  # MAPEAMENTO DE PROGRAMAS
  
  Cenário: Product Type KW-16 com Multiple 2.3 constrói nome do programa como "KW-16-2.3" para busca no sistema
  
  Cenário: Product Type RL90 com Multiple 1.4041 constrói nome do programa como "RL90-1.4041" para busca no sistema
  
  Cenário: Product Type STD-12 com Multiple 2.1 constrói nome do programa como "STD-12-2.1" para busca no sistema
  
  Cenário: Product Type P10 com Multiple 1.75 constrói nome do programa como "P10-1.75" para busca no sistema
  
  Cenário: Product Type KWC com Multiple 2.0 constrói nome do programa como "KWC-2" para busca no sistema
  
  # ESTRUTURA DE RESPOSTA
  
  Cenário: Resposta da importação contém campos totalRowsProcessed, successfulImports, failedImports, skippedImports, errors e warnings
  
  Cenário: Soma de successfulImports, failedImports e skippedImports corresponde ao totalRowsProcessed informado na resposta
  
  # REMOÇÃO DE ASSOCIAÇÕES ANTIGAS
  
  Cenário: Nova associação para merchant com programa diferente remove associação anterior e cria nova associação
  
  Cenário: Remoção de associação antiga e criação de nova associação são registradas nos logs de atividade
```

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------