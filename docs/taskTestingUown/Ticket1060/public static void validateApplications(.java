 public static void validateApplications(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";

        boolean noMerchantCode = true; // or false filtrar merchants
        List<String> merchantRefCodes = new ArrayList<>(); // Add if you want to filter
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        String sql = "SELECT count(l.pk) " +
                "FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE" +
                (merchantRefCodes.isEmpty() ? "" : " OR merchant.ref_merchant_code IN (" + merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(",")) + ")") +
                ") AND l.ref_app_id IS NULL " +
                "AND uw.uw_status = 'APPROVED' " +
                "AND uw.approval_amount > 0 " +
                "AND l.row_created_timestamp BETWEEN ? AND ? " +
                "AND l.lead_status NOT IN ('CANCELLED_DUP_SSN', 'UW_DENIED', 'DENIED', 'CANCELLED_DUP_DENIAL')";

        int count = 0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                count = rs.getInt(1);
            }
        }

        assertMetricMatchesDashboard("Applications", count, count, "[Applications] Total leases: " + count);
    }

    public static void validateApprovalRate(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";
        boolean noMerchantCode = true;
        List<String> merchantRefCodes = new ArrayList<>();
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        String sqlTotal = "SELECT COUNT(l.pk) FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE" +
                (merchantRefCodes.isEmpty() ? "" : " OR merchant.ref_merchant_code IN (" + merchantRefCodes.stream().map(c -> "?").collect(Collectors.joining(",")) + ")") +
                ") AND l.ref_app_id IS NULL " +
                "AND (uw.uw_status = 'APPROVED' OR uw.uw_status = 'DENIED') " +
                "AND l.row_created_timestamp BETWEEN ? AND ? " +
                "AND l.lead_status NOT IN ('CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL')";

        String sqlApproved = "SELECT COUNT(l.pk) FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE" +
                (merchantRefCodes.isEmpty() ? "" : " OR merchant.ref_merchant_code IN (" + merchantRefCodes.stream().map(c -> "?").collect(Collectors.joining(",")) + ")") +
                ") AND l.ref_app_id IS NULL " +
                "AND uw.uw_status = 'APPROVED' " +
                "AND l.row_created_timestamp BETWEEN ? AND ? " +
                "AND l.lead_status NOT IN ('CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL')";

        int total = 0, approved = 0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmtTotal = conn.prepareStatement(sqlTotal);
            PreparedStatement stmtApproved = conn.prepareStatement(sqlApproved);
            int idx = 1;
            stmtTotal.setBoolean(idx, noMerchantCode);
            stmtApproved.setBoolean(idx, noMerchantCode);
            idx++;
            for (String code : merchantRefCodes) {
                stmtTotal.setString(idx, code);
                stmtApproved.setString(idx, code);
                idx++;
            }
            stmtTotal.setTimestamp(idx, java.sql.Timestamp.valueOf(fromTime));
            stmtTotal.setTimestamp(idx + 1, java.sql.Timestamp.valueOf(toTime));
            stmtApproved.setTimestamp(idx, java.sql.Timestamp.valueOf(fromTime));
            stmtApproved.setTimestamp(idx + 1, java.sql.Timestamp.valueOf(toTime));

            ResultSet rsTotal = stmtTotal.executeQuery();
            if (rsTotal.next()) total = rsTotal.getInt(1);

            ResultSet rsApproved = stmtApproved.executeQuery();
            if (rsApproved.next()) approved = rsApproved.getInt(1);
        }

        int calculatedRate = (total == 0) ? 0 : (int)Math.round((approved * 100.0) / total);
        String rateText = getMetricBoxTextByTitle("Approval Rate").replace("%", "").trim();
        int dashboardRate = Integer.parseInt(rateText);
        if (calculatedRate != dashboardRate) {
            throw new AssertionError(
                    String.format("Mismatch in Approval Rate: Expected %d%%, but box shows %d%%", calculatedRate, dashboardRate)
            );
        }
        System.out.println(String.format("[OK] Approval Rate metric: %d%%", dashboardRate));
    }

    public static void validateAvgApprovalAmt(String period) throws Exception {

        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";

        boolean noMerchantCode = true; // or false, as appropriate
        List<String> merchantRefCodes = new ArrayList<>(); // or add codes according to the scenario
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;


        String sql = "SELECT avg(uw.approval_amount) " +
                "FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE";

        if (!merchantRefCodes.isEmpty()) {
            String placeholders = merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(","));
            sql += " OR merchant.ref_merchant_code IN (" + placeholders + ")";
        }
        sql += " ) " +
                "AND uw.uw_status = 'APPROVED' " +
                "AND uw.row_created_timestamp BETWEEN ? AND ? " +
                "AND l.lead_status NOT IN ('CANCELLED_DUP_SSN', 'CANCELLED_DUP_DENIAL')";

        double avg = 0.0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));

            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                avg = rs.getDouble(1);
            }
        }

        int count = 1;// If you want, look for Count Real at Query too
        assertMetricMatchesDashboard("Avg. Approval Amt.", avg, count, "[Avg. Approval Amt.] avg: " + avg);
    }


    public static void validateOpenApprovalAmt(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";
        boolean noMerchantCode = true;
        List<String> merchantRefCodes = new ArrayList<>();
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        String sql = "SELECT sum(uw.approval_amount) " +
                "FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE";
        if (!merchantRefCodes.isEmpty()) {
            String placeholders = merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(","));
            sql += " OR merchant.ref_merchant_code IN (" + placeholders + ")";
        }
        sql += ") AND uw.uw_status = 'APPROVED' " +
                "AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED') " +
                "AND l.row_created_timestamp BETWEEN ? AND ?";

        double sum = 0.0;
        int count = 0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                sum = rs.getDouble(1);
            }
        }
        // Count can be calculated as you want, eg Count of leads returned by the same query

        assertMetricMatchesDashboard("$ Amt. of Open Apvl.", sum, count, "[Open Apvl.] Total: " + count);
    }

    public static void validateFundedTxnAmt(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";
        boolean noMerchantCode = true;
        List<String> merchantRefCodes = new ArrayList<>();
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        String sql = "SELECT SUM(funding_transaction.amount_to_be_funded) " +
                "FROM uown_funding_transaction funding_transaction " +
                "JOIN uown_merchant merchant ON funding_transaction.merchant_pk = merchant.pk " +
                "WHERE funding_transaction.funding_queue_status = 'FUNDED' " +
                "AND funding_transaction.status = 'ACTIVE' " +
                "AND funding_transaction.fund_date_time BETWEEN ? AND ? " +
                "AND ( ? = TRUE";

        if (!merchantRefCodes.isEmpty()) {
            String placeholders = merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(","));
            sql += " OR merchant.ref_merchant_code IN (" + placeholders + ")";
        }
        sql += ")";

        double sum = 0.0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                sum = rs.getDouble(1);
            }
        }

        // Count is not relevant to this metric, so put 1 or ignore if your Assert does not require.
        int count = 1;
        assertMetricMatchesDashboard("$ Amt. of Funded TXN", sum, count, "[Funded TXN] Total: " + sum);
    }

    public static void validateSignedLeaseAmt(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";

        boolean noMerchantCode = true;// or false, according to the Merchant filter
        List<String> merchantRefCodes = new ArrayList<>();// Add codes if necessary
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        // assembles the dynamically placeholders
        String sql = "SELECT SUM(invoice.total_invoice_amount) " +
                "FROM uown_los_lead l " +
                "JOIN uown_los_invoice invoice ON l.pk = invoice.lead_pk " +
                "JOIN uown_los_contract contract ON l.pk = contract.lead_pk AND contract_type = 'LEASE' " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE";

        if (!merchantRefCodes.isEmpty()) {
            String placeholders = merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(","));
            sql += " OR merchant.ref_merchant_code IN (" + placeholders + ")";
        }
        sql += ") " +
                "AND contract.contract_status = 'SIGNED' " +
                "AND l.row_created_timestamp BETWEEN ? AND ?";

        double sum = 0.0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));

            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                sum = rs.getDouble(1);
            }
        }

        // Here you can look for the value displayed on the screen, compare, and make the assert.
        int count = 1; // or obtain the real count if necessary
        assertMetricMatchesDashboard("$ Amt. of Approvals With Signed Leases", sum, count, "[Signed Leases] Total: " + sum);
    }

    public static void validateApproachingExpiryAmt(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";

        boolean noMerchantCode = true;
        List<String> merchantRefCodes = new ArrayList<>();
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;
        String toExpirationDate = LocalDate.now().plusDays(7).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));


        String sql = "SELECT SUM(uw.approval_amount) " +
                "FROM uown_los_lead l " +
                "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                "WHERE ( ? = TRUE";
        if (!merchantRefCodes.isEmpty()) {
            String placeholders = merchantRefCodes.stream().map(code -> "?").collect(Collectors.joining(","));
            sql += " OR merchant.ref_merchant_code IN (" + placeholders + ")";
        }
        sql += ") " +
                "AND l.lead_status IN ('UW_APPROVED', 'CONTRACT_CREATED') " +
                "AND l.expiration_date BETWEEN CURRENT_DATE AND ? " +
                "AND l.row_created_timestamp BETWEEN ? AND ?";

        double sum = 0.0;
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement stmt = conn.prepareStatement(sql);
            int idx = 1;
            stmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) {
                stmt.setString(idx++, code);
            }
            stmt.setDate(idx++, java.sql.Date.valueOf(toExpirationDate));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            stmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                sum = rs.getDouble(1);
            }
        }

        int count = 1;
        assertMetricMatchesDashboard("$'s Approaching Expiry", sum, count, "[Approaching Expiry] Total: " + sum);
    }


    public static void validateConversionRate(String period) throws Exception {
        String jdbcUrl = "jdbc:postgresql://127.0.0.1:5445/svc";
        String username = "svc_user";
        String password = "F1ntech";
        PeriodRange range = getSqlPeriodRange(period);
        String fromTime = range.fromTime;
        String toTime = range.toTime;

        String numeradorSql =
                "SELECT COUNT(l.pk) " +
                        "FROM uown_los_lead l " +
                        "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                        "WHERE (:noMerchantCode = TRUE OR merchant.ref_merchant_code IN (:merchantRefCodes)) " +
                        "AND l.lead_status IN ('READY_TO_FUND', 'FUNDING', 'FUNDED') " +
                        "AND l.row_created_timestamp BETWEEN ? AND ?";

        String denominadorSql =
                "SELECT COUNT(l.pk) " +
                        "FROM uown_los_lead l " +
                        "JOIN uown_los_uwdata uw ON uw.lead_pk = l.pk " +
                        "JOIN uown_merchant merchant ON l.merchant_pk = merchant.pk " +
                        "WHERE (:noMerchantCode = TRUE OR merchant.ref_merchant_code IN (:merchantRefCodes)) " +
                        "AND l.ref_app_id IS NULL " +
                        "AND uw.uw_status = 'APPROVED' " +
                        "AND uw.approval_amount > 0 " +
                        "AND l.row_created_timestamp BETWEEN ? AND ? " +
                        "AND l.lead_status NOT IN ('CANCELLED_DUP_SSN', 'UW_DENIED', 'DENIED', 'CANCELLED_DUP_DENIAL')";

        boolean noMerchantCode = true;
        List<String> merchantRefCodes = new ArrayList<>();

        int settledAndAbove = 0;
        int approved = 0;

        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            PreparedStatement numeradorStmt = conn.prepareStatement(
                    numeradorSql.replace(":noMerchantCode", "?").replace(":merchantRefCodes", merchantRefCodes.isEmpty() ? "''" : String.join(",", Collections.nCopies(merchantRefCodes.size(), "?")))
            );
            int idx = 1;
            numeradorStmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) numeradorStmt.setString(idx++, code);
            numeradorStmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            numeradorStmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            ResultSet rsNum = numeradorStmt.executeQuery();
            if (rsNum.next()) settledAndAbove = rsNum.getInt(1);

            PreparedStatement denominadorStmt = conn.prepareStatement(
                    denominadorSql.replace(":noMerchantCode", "?").replace(":merchantRefCodes", merchantRefCodes.isEmpty() ? "''" : String.join(",", Collections.nCopies(merchantRefCodes.size(), "?")))
            );
            idx = 1;
            denominadorStmt.setBoolean(idx++, noMerchantCode);
            for (String code : merchantRefCodes) denominadorStmt.setString(idx++, code);
            denominadorStmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(fromTime));
            denominadorStmt.setTimestamp(idx++, java.sql.Timestamp.valueOf(toTime));
            ResultSet rsDen = denominadorStmt.executeQuery();
            if (rsDen.next()) approved = rsDen.getInt(1);
        }

        int calcRate = (approved == 0) ? 0 : (int)Math.round((settledAndAbove * 100.0) / approved);

        String boxText = getMetricBoxTextByTitle("Conversion Rate").replace("%", "").trim();
        int dashboardRate = Integer.parseInt(boxText);

        if (Math.abs(calcRate - dashboardRate) > 1) {
            throw new AssertionError(
                    String.format("Mismatch in Conversion Rate: Calculated %d%% (settled+above: %d, approved: %d), but box shows %d%%",
                            calcRate, settledAndAbove, approved, dashboardRate)
            );
        }
        System.out.println(String.format("[OK] Conversion Rate: %d%% (settled+above: %d, approved: %d)", dashboardRate, settledAndAbove, approved));
    }

}
