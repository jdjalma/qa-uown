nesse comando sempre tenho que passar enrollment date manualmente, como melhorar para pegar a data de assinatura do contrato de forma dinamica?
And Verify the "Protection Plan" panel on "Origination" portal page "customers" and stay on tab:
      | Field             | Expected   |
      | Opted In          | true       |
      | Already Covered   | false      |
      | Status            | COMPLETED  |
      | Enrollment Date   | 2025-06-11 |
      | Error Description | -          |



    @And("Verify the {string} panel on {string} portal page {string} and stay on tab:")
    public void verifyPanelStay(
            String panelName, String portalName, String pageKey, DataTable table
    ) throws Exception {
        verifyPanel(panelName, portalName, pageKey, table, false);
    }

public static void verifyPanel(
            String panelName,
            String portalName,
            String pageKey,
            DataTable table,
            boolean returnToPreviousTab
    ) throws Exception {
        log.info("Starting panel verification for '{}' on {}/{}", panelName, portalName, pageKey);

        String originalTab = driver().getWindowHandle();

        CommonHelpers.accessPortal(portalName, pageKey, true);

        Portal portal = Portal.fromString(portalName);
        int timeoutSeconds = 10;

        for (Map<String, String> row : table.asMaps()) {
            String field = row.get("Field");
            String expected = row.get("Expected");

            if ("Opted In".equalsIgnoreCase(field) || "Already Covered".equalsIgnoreCase(field)) {
                By checkbox = By.xpath("//label[text()='" + field + "']/following-sibling::div//input[@type='checkbox']");
                WebElement el = driver().findElement(checkbox);
                boolean isChecked = Boolean.parseBoolean(el.getAttribute("aria-checked"));
                boolean expectedBool = Boolean.parseBoolean(expected);
                if (isChecked != expectedBool) {
                    throw new AssertionError(String.format(
                            "Panel '%s' field '%s' validation failed: expected checked=%s but got %s",
                            panelName, field, expectedBool, isChecked
                    ));
                }
                log.info("Field '{}' validated: expected='{}', actual='{}'", field, expected, isChecked);
                continue;
            }

            String selectorMethod = null;
            String selectorValue = null;
            By locator = null;

            try {
                locator = CommonHelpers.getLocatorForField(pageKey, field);
                Map<String, String> selectorDetails = CommonHelpers.extractSelectorDetails(locator);
                selectorMethod = selectorDetails.get("method");
                selectorValue = selectorDetails.get("value");
            } catch (Exception e) {
                switch (field.toLowerCase()) {
                    case "enrollment date":
                        selectorMethod = "xpath";
                        selectorValue = "//label[div[text()='Enrollment Date']]/following-sibling::div//div[contains(@class,'index-module_inputField__readOnly')]";
                        break;
                    case "status":
                        selectorMethod = "xpath";
                        selectorValue = "//label[div[text()='Status']]/following-sibling::div//div[contains(@class,'index-module_inputField__readOnly')]";
                        break;
                    case "error description":
                        selectorMethod = "xpath";
                        selectorValue = "//label[div[text()='Error Description']]/following-sibling::div//div[contains(@class,'index-module_inputField__readOnly')]";
                        break;
                    default:
                        throw new Exception("No selector fallback defined for field: " + field);
                }
            }

            try {
                String actual = performCheck(
                        ValidationType.TEXT_EQUALS,
                        portal,
                        pageKey,
                        selectorMethod,
                        selectorValue,
                        expected,
                        timeoutSeconds
                );


                if (!ElementUtility.stringsMatch(actual, expected)) {
                    throw new AssertionError(String.format(
                            "Comparison Failure: Expected: >%s< | Real: >%s<", expected, actual
                    ));
                }

                log.info("Field '{}' validated: expected='{}', actual='{}'", field, expected, actual);

            } catch (AssertionError e) {
                try {
                    WebElement debugEl = driver().findElement(By.xpath(selectorValue));
                    String debugValue = debugEl.getText();
                    System.out.println("[DEBUG] Field error: " + field + " | Expected: '" + expected + "' | Found: '" + debugValue + "'");
                } catch (Exception debugEx) {
                    System.out.println("[DEBUG] Unable to capture real DOM value for field: " + field);
                }
                throw new AssertionError(String.format(
                        "Panel '%s' field '%s' validation failed: %s",
                        panelName, field, e.getMessage()
                ));
            }
        }

        log.info(SUCCESS, "[SUCCESS] Panel '{}' verification completed", panelName);

        if (returnToPreviousTab) {
            driver().close();
            driver().switchTo().window(originalTab);
            log.info(SUCCESS, "[SUCCESS] Returned to the previous tab!");
        }
    }


public static void accessPortal(String portalName, String pageKey, boolean openInNewTab) throws Exception {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));

        Portal portal = Portal.fromString(portalName);
        PageConfig pageConfig = PageConfig.forPage(pageKey);
        String id = resolveAccountIdForPortal(portal);
        String targetUrl = portal.buildUrl(pageConfig, id);

        log.info("Accessing URL [{}] to Portal [{}] and PageKey [{}]", targetUrl, portal, pageKey);

        if (switchToExistingTabWithUrl(targetUrl, driver)) {
            log.info("It is already in the correct URL, keeping flap.");
        } else {
            if (openInNewTab) {
                openNewTab(driver);
            }
            driver.get(targetUrl);
            wait.until(ExpectedConditions.urlToBe(targetUrl));
            log.info("URL loaded: {}", targetUrl);
        }

        waitForPageReady(wait, driver);
        log.info("Page ready!");
    }

   private static void waitForPageReady(WebDriverWait wait, WebDriver driver) {
        wait.until(d -> ((JavascriptExecutor) d).executeScript("return document.readyState").equals("complete"));
        By filterButton = By.className("index-module_filterButton__Imptk");
        wait.until(ExpectedConditions.visibilityOfElementLocated(filterButton));
    }

de onde posso pegar essa data?

    }


}
