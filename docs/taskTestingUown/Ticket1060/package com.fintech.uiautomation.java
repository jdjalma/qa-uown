package com.fintech.uiautomation.uownpages.origination;

import com.fintech.uiautomation.helpers.CommonHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.*;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import static com.fintech.uiautomation.helpers.Browser.driver;

public class MetricsCalculatorPage {

    private static class PeriodMapping {
        String periodOptionValue;   // para o select
        String periodSwitchValue;   // para o filtro de datas

        PeriodMapping(String optionValue, String switchValue) {
            this.periodOptionValue = optionValue;
            this.periodSwitchValue = switchValue;
        }
    }

    public static String getMetricBoxTextByTitle(String metricTitle) {
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(10));
        List<WebElement> metricBoxes = wait.until(
                ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector("div.overview_summaryBox__lkddx"))
        );
        for (WebElement box : metricBoxes) {
            WebElement titleDiv = box.findElement(By.xpath(".//div[contains(@class,'mr-3')]"));
            if (titleDiv != null && titleDiv.getText().trim().equalsIgnoreCase(metricTitle.trim())) {
                WebElement valueDiv = box.findElement(By.cssSelector("div.overview_summaryBox__value__1pEUs"));
                return valueDiv.getText().trim();
            }
        }
        throw new RuntimeException("Metric panel with title '" + metricTitle + "' not found!");
    }

    /**
     * Soma os valores das aplicações aprovadas (todos menos Denied e Cancelled) no período.
     * Retorna um array: [soma, quantidade]
     */
    public static double[] getSumAndCountOfApprovedAmounts(String periodo) throws Exception {
        fillDateFilters(periodo, true);
        driver().findElement(By.cssSelector("button[name='searchButton']")).click();
        Thread.sleep(1000);

        selectMaxRowsPerPage();

        List<WebElement> rows = driver().findElements(By.cssSelector("table tbody tr"));

        double sum = 0.0;
        int count = 0;

        System.out.println("[DEBUG] >>> Linhas da tabela encontradas para o período '" + periodo + "': " + rows.size());
        for (WebElement row : rows) {
            List<WebElement> cols = row.findElements(By.tagName("td"));
            if (cols.size() < 5) {
                System.out.println("[DEBUG] Linha ignorada (menos de 5 colunas): " + row.getText());
                continue;
            }
            String status = cols.get(3).getText().trim();
            String valueRaw = cols.get(4).getText().trim();
            System.out.println("[DEBUG] Linha - status: '" + status + "' | valor: '" + valueRaw + "'");

            if (status.equalsIgnoreCase("Denied") || status.equalsIgnoreCase("Cancelled")) {
                System.out.println("[DEBUG] -- Ignorando linha (Denied ou Cancelled)");
                continue;
            }

            String valueStr = valueRaw.replaceAll("[^\\d.,]", "");
            valueStr = valueStr.replace(".", "").replace(",", ".");
            double value = 0.0;
            try { value = Double.parseDouble(valueStr); } catch (Exception ex) {
                System.out.println("[DEBUG] -- Falha ao converter valor: '" + valueStr + "'");
            }
            sum += value;
            count++;
            System.out.println("[DEBUG] -- Valor somado: " + value + " | Total parcial: " + sum);
        }

        System.out.println("[DEBUG] >>> Soma final: " + sum + " | Contagem final: " + count);
        return new double[] { sum, count };
    }

    /**
     * Recarrega a página, aplica apenas o filtro de datas, retorna o total
     */
    public static int getTotalLeasesByDateOnly(String periodo) throws Exception {
        driver().navigate().refresh();
        fillDateFilters(periodo, true); // limpa status
        WebElement btnSearch = driver().findElement(By.cssSelector("button[name='searchButton']"));
        btnSearch.click();
        Thread.sleep(1000);
        if (!isLeasesTablePresent()) return 0;
        return getTotalApplicationsFromTable();
    }

    private static PeriodMapping resolvePeriod(String periodo) {
        String normalized = periodo.trim().toLowerCase();
        switch (normalized) {
            case "today":
                return new PeriodMapping("today", "today");
            case "yesterday":
                return new PeriodMapping("yesterday", "yesterday");
            case "this week":
            case "thisweek":
                return new PeriodMapping("thisWeek", "thisweek");
            case "this month":
            case "thismonth":
                return new PeriodMapping("thisMonth", "thismonth");
            case "this year":
            case "thisyear":
            case "year to date":
                return new PeriodMapping("thisYear", "thisyear");
            default:
                return new PeriodMapping(periodo, periodo.toLowerCase().replaceAll("\\s+", ""));
        }
    }

    public static void selectPeriodOnDashboard(String nomeMetrica, String periodo) {
        PeriodMapping mapping = resolvePeriod(periodo);

        List<WebElement> metricBoxes = driver().findElements(By.cssSelector("div.col-xl-3, div.col-md-6"));
        boolean found = false;
        for (WebElement box : metricBoxes) {
            List<WebElement> titles = box.findElements(By.xpath(".//div[contains(@class,'mr-3')]"));
            if (titles.isEmpty()) continue;
            String title = titles.get(0).getText().trim();
            if (title.equalsIgnoreCase(nomeMetrica.trim())) {
                WebElement select = box.findElement(By.cssSelector("select[name='range']"));
                Select dropdown = new Select(select);
                dropdown.selectByValue(mapping.periodOptionValue);
                found = true;
                System.out.println(String.format("[INFO] Period '%s' (value='%s') selected in metric panel '%s'.", periodo, mapping.periodOptionValue, nomeMetrica));
                break;
            }
        }
        if (!found) {
            throw new RuntimeException("Metric panel not found for: " + nomeMetrica);
        }
    }

    /**
     * Checa se a tabela de leases está presente na tela.
     */
    public static boolean isLeasesTablePresent() {
        List<WebElement> tables = driver().findElements(By.cssSelector("nav.rdt_Pagination span[class*='izjbJU']"));
        return !tables.isEmpty();
    }

    /**
     * Preenche apenas as datas do filtro (limpa status se limparStatus = true)
     */
    public static void fillDateFilters(String periodo, boolean limparStatus) throws Exception {
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(10));
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("fromDate")));
        } catch (Exception e) {
            WebElement btnFilters = driver().findElement(By.cssSelector("button.index-module_filterButton__Imptk"));
            btnFilters.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("fromDate")));
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("toDate")));
        }
        LocalDate today = LocalDate.now();
        LocalDate start, end;
        switch (periodo) {
            case "today":      start = end = today; break;
            case "yesterday":  start = end = today.minusDays(1); break;
            case "thisweek":   start = today.with(java.time.DayOfWeek.MONDAY); end = today; break;
            case "thismonth":  start = today.withDayOfMonth(1); end = today; break;
            case "thisyear":   start = today.withDayOfYear(1); end = today; break;
            default: throw new IllegalArgumentException("Unsupported period: " + periodo);
        }
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy");
        WebElement fromInput = driver().findElement(By.id("fromDate"));
        fromInput.clear(); fromInput.sendKeys(start.format(fmt));
        WebElement toInput = driver().findElement(By.id("toDate"));
        toInput.clear(); toInput.sendKeys(end.format(fmt));
        toInput.sendKeys(org.openqa.selenium.Keys.TAB);

        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.xpath("//div[contains(text(),'Invalid date')]"))
        );

        if (limparStatus) {
            try {
                WebElement statusDiv = driver().findElement(By.id("status"));
                WebElement statusClearBtn = null;
                try {
                    statusClearBtn = statusDiv.findElement(By.cssSelector("div.filter__multi-value__remove,div.css-xb97g8"));
                } catch (Exception ignored) {}
                if (statusClearBtn != null) statusClearBtn.click();
            } catch (Exception ignored) { }
        }
    }

    public static int getLeasesCountByStatus(String status, String periodo) throws Exception {
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(10));
        fillDateFilters(periodo, true); // Sempre limpa antes!

        // Se status vazio, apenas limpa o filtro (busca todos)
        if (status == null || status.trim().isEmpty()) {
            // Limpa e busca tudo
            driver().findElement(By.cssSelector("button[name='searchButton']")).click();
            Thread.sleep(800);

            if (!isLeasesTablePresent()) return 0;
            String totalText = driver().findElement(By.cssSelector("nav.rdt_Pagination span[class*='izjbJU']")).getText();
            String[] parts = totalText.split("of");
            if (parts.length < 2) throw new RuntimeException("Could not find total in pagination text: " + totalText);
            String totalStr = parts[1].replaceAll("[^0-9]", "");
            return Integer.parseInt(totalStr);
        }

        // Clica no dropdown do status
        WebElement statusDiv = driver().findElement(By.id("status"));
        statusDiv.findElement(By.className("filter__dropdown-indicator")).click();

        // Busca a opção do status (fazendo case-insensitive para 'All')
        String optionXpath;
        if (status.equalsIgnoreCase("all")) {
            // Tolerância para All e all, usando translate para case-insensitive
            optionXpath = "//div[contains(@class,'filter__option') and translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='all']";
        } else {
            optionXpath = String.format("//div[contains(@class,'filter__option') and text()='%s']", status);
        }
        WebElement statusOption = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath(optionXpath)));
        statusOption.click();

        // Busca
        driver().findElement(By.cssSelector("button[name='searchButton']")).click();
        Thread.sleep(800);

        if (!isLeasesTablePresent()) return 0;
        String totalText = driver().findElement(By.cssSelector("nav.rdt_Pagination span[class*='izjbJU']")).getText();
        String[] parts = totalText.split("of");
        if (parts.length < 2) throw new RuntimeException("Could not find total in pagination text: " + totalText);
        String totalStr = parts[1].replaceAll("[^0-9]", "");
        return Integer.parseInt(totalStr);
    }

    public static void selectMaxRowsPerPage() {
        try {
            By selectRowsPerPage = By.cssSelector("select[aria-label='Rows per page:']");
            WebElement select = driver().findElement(selectRowsPerPage);
            Select dropdown = new Select(select);
            dropdown.selectByValue("100");
            Thread.sleep(700);
        } catch (Exception e) {
            System.out.println("Could not select 100 rows per page (maybe only few results). Skipping pagination adjustment.");
        }
    }

    public static int getTotalApplicationsFromTable() {
        if (!isLeasesTablePresent()) return 0;
        String totalText = driver().findElement(
                By.cssSelector("nav.rdt_Pagination span[class*='izjbJU']")
        ).getText();
        String[] parts = totalText.split("of");
        if (parts.length < 2) {
            throw new RuntimeException("Could not find total in pagination text: " + totalText);
        }
        String totalStr = parts[1].replaceAll("[^0-9]", "");
        return Integer.parseInt(totalStr);
    }

    public static void setFilterDatesOnly(String periodo) throws Exception {
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(10));

        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("fromDate")));
        } catch (Exception e) {
            WebElement btnFilters = driver().findElement(By.cssSelector("button.index-module_filterButton__Imptk"));
            btnFilters.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("fromDate")));
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("toDate")));
        }

        LocalDate today = LocalDate.now();
        LocalDate start, end;
        switch (periodo) {
            case "today":      start = end = today; break;
            case "yesterday":  start = end = today.minusDays(1); break;
            case "thisweek":   start = today.with(java.time.DayOfWeek.MONDAY); end = today; break;
            case "thismonth":  start = today.withDayOfMonth(1); end = today; break;
            case "thisyear":   start = today.withDayOfYear(1); end = today; break;
            default: throw new IllegalArgumentException("Unsupported period: " + periodo);
        }
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy");
        WebElement fromInput = driver().findElement(By.id("fromDate"));
        fromInput.clear();
        fromInput.sendKeys(start.format(fmt));
        WebElement toInput = driver().findElement(By.id("toDate"));
        toInput.clear();
        toInput.sendKeys(end.format(fmt));
        toInput.sendKeys(org.openqa.selenium.Keys.TAB);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.xpath("//div[contains(text(),'Invalid date')]"))
        );

        // Limpa qualquer filtro de status
        WebElement statusDiv = driver().findElement(By.id("status"));
        WebElement statusClearBtn = null;
        try {
            statusClearBtn = statusDiv.findElement(By.cssSelector("div.filter__multi-value__remove,div.css-xb97g8"));
        } catch (Exception ignored) {}
        if (statusClearBtn != null) statusClearBtn.click();
    }

    public static void validateApplications(String periodo) throws Exception {
        PeriodMapping mapping = resolvePeriod(periodo);
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(30));

        selectPeriodOnDashboard("Applications", mapping.periodOptionValue);

        // Total leases (apenas datas, sem status)
        int totalTable = getTotalLeasesByDateOnly(mapping.periodSwitchValue);

        selectMaxRowsPerPage();

        int deniedCount    = getLeasesCountByStatus("Denied",    mapping.periodSwitchValue);
        int cancelledCount = getLeasesCountByStatus("Cancelled", mapping.periodSwitchValue);

        int validLeases = totalTable - deniedCount - cancelledCount;

        String totalBoxStr = getMetricBoxTextByTitle("Applications").replaceAll("[^0-9]", "");
        int totalBox = Integer.parseInt(totalBoxStr);

        if (validLeases != totalBox) {
            throw new AssertionError(
                    String.format(
                            "Mismatch in Applications: Expected %d (from table, ignoring denied/cancelled), but box shows %d (total: %d, denied: %d, cancelled: %d)",
                            validLeases, totalBox, totalTable, deniedCount, cancelledCount
                    )
            );
        } else {
            System.out.println(String.format("[OK] Applications metric: %d matches filtered table result.", totalBox));
        }
    }

    public static void validateApprovalRate(String periodo) throws Exception {
        PeriodMapping mapping = resolvePeriod(periodo);
        WebDriverWait wait = new WebDriverWait(driver(), Duration.ofSeconds(30));

        selectPeriodOnDashboard("Approval Rate", mapping.periodOptionValue);

        // 1. Busca Denied e Cancelled com filtro de status
        int deniedCount    = getLeasesCountByStatus("Denied",    mapping.periodSwitchValue);
        int cancelledCount = getLeasesCountByStatus("Cancelled", mapping.periodSwitchValue);

        // 2. Recarrega tela para garantir que leases recém-criados aparecem
        driver().navigate().refresh();

        // 3. Espera botão Filters e clica para expandir
        By filtersBtnBy = By.cssSelector("button.index-module_filterButton__Imptk");
        wait.until(ExpectedConditions.elementToBeClickable(filtersBtnBy));
        driver().findElement(filtersBtnBy).click();

        // 4. Aguarda os campos de data visíveis
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("fromDate")));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("toDate")));

        // 5. Limpa filtro de status se houver (clica no X)
        try {
            WebElement statusDiv = driver().findElement(By.id("status"));
            List<WebElement> clearBtns = statusDiv.findElements(By.cssSelector("div.filter__clear-indicator,div.filter__multi-value__remove,div.css-xb97g8"));
            if (!clearBtns.isEmpty()) {
                clearBtns.get(0).click();
                Thread.sleep(250); // pequeno delay para garantir que sumiu
            }
        } catch (Exception ignored) {}

        // 6. Preenche as datas
        LocalDate today = LocalDate.now();
        LocalDate start, end;
        switch (mapping.periodSwitchValue) {
            case "today":      start = end = today; break;
            case "yesterday":  start = end = today.minusDays(1); break;
            case "thisweek":   start = today.with(java.time.DayOfWeek.MONDAY); end = today; break;
            case "thismonth":  start = today.withDayOfMonth(1); end = today; break;
            case "thisyear":   start = today.withDayOfYear(1); end = today; break;
            default: throw new IllegalArgumentException("Unsupported period: " + mapping.periodSwitchValue);
        }
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy");
        WebElement fromInput = driver().findElement(By.id("fromDate"));
        fromInput.clear();
        fromInput.sendKeys(start.format(fmt));
        WebElement toInput = driver().findElement(By.id("toDate"));
        toInput.clear();
        toInput.sendKeys(end.format(fmt));
        toInput.sendKeys(org.openqa.selenium.Keys.TAB);

        // 7. Clica em Search para aplicar apenas datas
        WebElement btnSearch = driver().findElement(By.cssSelector("button[name='searchButton']"));
        btnSearch.click();

        // 8. Aguarda tabela aparecer (garante que tabela recarregou SEM status)
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("nav.rdt_Pagination span[class*='izjbJU']"))
        );

        selectMaxRowsPerPage();

        int totalTable = getTotalApplicationsFromTable();
        int deniedCount2 = getLeasesCountByStatus("Denied", mapping.periodSwitchValue);
        int cancelledCount2 = getLeasesCountByStatus("Cancelled", mapping.periodSwitchValue);
        // Não precisa buscar "Approved"!

        int validLeases = totalTable - deniedCount2 - cancelledCount2;
        int calculatedRate = (totalTable == 0) ? 0 : (int) Math.round((validLeases * 100.0) / totalTable);

        String rateText = getMetricBoxTextByTitle("Approval Rate").replace("%", "").trim();
        int dashboardRate = Integer.parseInt(rateText);

        if (calculatedRate != dashboardRate) {
            throw new AssertionError(
                    String.format(
                            "Mismatch in Approval Rate: Expected %d%% (valid: %d, total: %d, denied: %d, cancelled: %d), but box shows %d%%",
                            calculatedRate, validLeases, totalTable, deniedCount2, cancelledCount2, dashboardRate
                    )
            );
        } else {
            System.out.println(String.format("[OK] Approval Rate metric: %d%% matches calculated result.", dashboardRate));
        }
    }

    public static void validateAvgApprovalAmt(String periodo) throws Exception {
        PeriodMapping mapping = resolvePeriod(periodo);

        // Seleciona período na box correta
        selectPeriodOnDashboard("Avg. Approval Amt.", mapping.periodOptionValue);

        // Soma valores aprovados e conta
        double[] sumAndCount = getSumAndCountOfApprovedAmounts(mapping.periodSwitchValue);
        double sum = sumAndCount[0];
        int count = (int) sumAndCount[1];

        double avg = (count == 0) ? 0.0 : (sum / count);

        // Pega o valor exibido na box e converte para double
        String boxText = getMetricBoxTextByTitle("Avg. Approval Amt.").replaceAll("[^\\d.,]", "");
        // Converte para 4090.00, para comparação
        boxText = boxText.replace(".", "").replace(",", ".");
        double dashboardValue = 0.0;
        try { dashboardValue = Double.parseDouble(boxText); } catch (Exception ignored) {}

        // Tolerância para comparação (centavos)
        boolean ok = Math.abs(avg - dashboardValue) < 0.01;

        if (!ok) {
            throw new AssertionError(
                    String.format("Mismatch in Avg. Approval Amt.: Expected %.2f (sum: %.2f, count: %d), but box shows %.2f",
                            avg, sum, count, dashboardValue)
            );
        }

        // Valida se está no formato de moeda
        String rawText = getMetricBoxTextByTitle("Avg. Approval Amt.").trim();
        if (!rawText.matches("^\\$?\\d{1,3}(,\\d{3})*(\\.\\d{2})?$")) {
            throw new AssertionError("Avg. Approval Amt. box is not in currency format: " + rawText);
        }

        System.out.println(String.format("[OK] Avg. Approval Amt.: %.2f (sum: %.2f, count: %d)", dashboardValue, sum, count));
    }

}
