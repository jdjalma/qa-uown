---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/435

UOWN | SVC | Create API POST /tms/v1/accounts/search for Level AI integration

Synopsis
Create a new API POST /tms/v1/accounts/search in TMS to support Level AI integration, allowing lookup of active accounts based on specific customer identification criteria.

Business Objective
This integration supports automation of support, analysis, and operational workflows, reducing manual effort, improving efficiency, and ensuring consistent and reliable access to system data.

Feature Request | Business Requirements
Create a new API POST /tms/v1/accounts/search in tmsController for Level AI
    1. This should take in a FindAccountRequest and return a FindAccountResponse
    2. FindAccountRequest should have String phone, String last4Ssn, LocalDate dob
    3. Return 400 if phone is blank or if both ssn & dob are blank.
    4. We have find the account by all the non-null input criteria with an ACTIVE account being isPrimary = true.
    5. findAccountResponse should have a list of AccountProfile pojo containing accountPk, accountStatus, autoPayTypes, Customer first name, last name, last4ssn, dob, zip, phone & email.

test instructions
Sample request
curl --location '<HOST_NAME>/uown/tms/v1/accounts/search' \
--header 'Content-Type: application/json' \
--header 'Authorization: <API_KEY>' \
--data '{
    "phone": "",
    "last4SSN": "",
    "dob": "" 
}'
All the parameters are optional, but at least one must be provided. Omitting all fields should result in a BAD_REQUEST.
An additional rule if the response returns would return more than 5 items it should return a error with CONFLICT status instead of returning all items.

---------------------------------------------------------------------------------------------------------------------------------------------------------

**UOWN | SVC | Criar API POST /tms/v1/accounts/search para integração com Level AI**

**Sinopse**
Criar uma nova API POST `/tms/v1/accounts/search` no TMS para dar suporte à integração com o Level AI, permitindo a busca de contas ativas com base em critérios específicos de identificação do cliente.

**Objetivo de Negócio**
Esta integração oferece suporte à automação de fluxos de suporte, análise e operações, reduzindo esforço manual, melhorando a eficiência e garantindo acesso consistente e confiável aos dados do sistema.

**Solicitação de Funcionalidade | Requisitos de Negócio**
Criar uma nova API POST `/tms/v1/accounts/search` no `tmsController` para o Level AI

1. Deve receber um `FindAccountRequest` e retornar um `FindAccountResponse`.
2. `FindAccountRequest` deve conter `String phone`, `String last4Ssn`, `LocalDate dob`.
3. Retornar **400** se `phone` estiver em branco ou se **ambos** `ssn` e `dob` estiverem em branco.
4. Devemos encontrar a conta usando **todos os critérios de entrada não nulos**, com a conta **ATIVA** sendo aquela em que `isPrimary = true`.
5. `FindAccountResponse` deve conter uma lista de POJOs `AccountProfile` contendo `accountPk`, `accountStatus`, `autoPayTypes`, **nome do cliente**, **sobrenome**, `last4ssn`, `dob`, `zip`, `phone` e `email`.

**Instruções de Teste**
**Requisição de exemplo**

```bash
curl --location '<HOST_NAME>/uown/tms/v1/accounts/search' \
--header 'Content-Type: application/json' \
--header 'Authorization: <API_KEY>' \
--data '{
    "phone": "",
    "last4SSN": "",
    "dob": "" 
}'
```

Todos os parâmetros são opcionais, porém **ao menos um** deve ser fornecido. Omissão de todos os campos deve resultar em **BAD_REQUEST**.
Regra adicional: se a resposta retornar **mais de 5 itens**, deve retornar um erro com status **CONFLICT** em vez de retornar todos os itens.

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

src/main/java/com/uownleasing/svc/exceptions/CustomExceptionHandler.java
@ExceptionHandler(TmsException.class)
    public ResponseEntity<Object> handleTmsException(TmsException e) {
        if (e.getCause() instanceof ClassNotFoundException) {
            return new ResponseEntity<>("TMS EXCEPTION: " + e.getMessage(), HttpStatus.NOT_FOUND);

        }

        return new ResponseEntity<>("TMS EXCEPTION: " + e.getMessage(), HttpStatus.BAD_REQUEST);
    }


src/main/java/com/uownleasing/svc/exceptions/GlobalExceptionHandler.java
package com.uownleasing.svc.exceptions;

import com.uownleasing.los.common.exception.LosCommonException;
import lombok.extern.slf4j.Slf4j;
import org.joda.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
        ResponseStatusException ex) {
        HttpStatus status = ex.getStatus();
        return ResponseEntity.status(status)
            .body(Map.of(
                "status", status.value(),
                "error", status.name(),
                "message", ex.getReason() != null ? ex.getReason() : ex.getMessage(),
                "timestamp", Instant.now()
            ));
    }

    @ExceptionHandler(LosCommonException.class)
    public ResponseEntity<Map<String, Object>> handleLosCommonException(
        LosCommonException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", HttpStatus.BAD_REQUEST.name(),
                "message", ex.getMessage(),
                "timestamp", Instant.now()
            ));
    }

    @ExceptionHandler(SvcException.class)
    public ResponseEntity<Map<String, Object>> handleSvcException(
        SvcException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", HttpStatus.BAD_REQUEST.name(),
                "message", ex.getMessage(),
                "timestamp", Instant.now()
            ));
    }
}


src/main/java/com/uownleasing/svc/exceptions/TooManyAccountsFoundException.java
package com.uownleasing.svc.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class TooManyAccountsFoundException extends ResponseStatusException {
    /**
     * Thrown when a request expected a single account but multiple matches are found
     * @param count number of accounts found.
     */
    public TooManyAccountsFoundException(long count) {
        super(HttpStatus.CONFLICT, "Too many accounts found: " + count);
    }
}

src/main/java/com/uownleasing/svc/pojo/rest/AccountProfile.java
package com.uownleasing.svc.pojo.rest;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.uownleasing.common.enumeration.AccountStatus;
import com.uownleasing.common.enumeration.AutoPayType;

import java.time.LocalDate;

public record AccountProfile(
    long accountPk,
    AccountStatus accountStatus,
    String firstName,
    String lastName,
    String last4Ssn,
    LocalDate dob,
    String zip,
    String phone,
    String email,
    @JsonIgnore long totalResults
) {
}

src/main/java/com/uownleasing/svc/rest/svc/TmsController.java
package com.uownleasing.svc.rest.svc;

import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.pojo.ACHPayment;
import com.uownleasing.common.pojo.CCTransactionInfo;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.service.LoggingService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.pojo.CCTransactionResult;
import com.uownleasing.svc.pojo.LogRequest;
import com.uownleasing.svc.pojo.PaymentArrangement;
import com.uownleasing.svc.pojo.embeddable.DueDateMoveInfo;
import com.uownleasing.svc.pojo.rest.TmsAccountSummary;
import com.uownleasing.svc.pojo.rest.TmsPaymentArrangement;
import com.uownleasing.svc.service.TmsService;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/tms", produces = MediaType.APPLICATION_JSON_VALUE)
public class TmsController {

    private final TmsService tmsService;
    private final LoggingService loggingService;

    @GetMapping("/getAccountSummary/{accountPk}")
    public TmsAccountSummary getAccountSummary(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return tmsService.getAccountSummary(accountPk);
    }

    @PostMapping("/updateAccount")
    public void updateAccount(@RequestBody TmsAccountSummary accountSummary){
        tmsService.updateAccount(accountSummary);
    }

    @PostMapping("/moveDueDatesByDays/{accountPk}")
    public List<SvReceivable> moveAllDueDatesByDays(@PathVariable(name = "accountPk") @NonNull Long accountPk,
                                                    @RequestParam(name = "fromDueDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDueDate,
                                                    @RequestParam @NonNull Integer moveNumberOfDays){
        DueDateMoveInfo dueDateMoveInfo = new DueDateMoveInfo();
        dueDateMoveInfo.setAccountPk(accountPk);
        dueDateMoveInfo.setMovedFromDueDate(fromDueDate);
        dueDateMoveInfo.setMovedByDays(moveNumberOfDays);
        return tmsService.moveAllDueDatesByDays(dueDateMoveInfo);
    }

    @GetMapping("/getPayoffAmount/{accountPk}")
    public BigDecimal getPayoffAmount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk) {
        return tmsService.getPayOffAmount(accountPk);
    }

    @GetMapping("/getBankAccounts/{accountPk}")
    public List<SvBankAccount> getBankAccounts(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return tmsService.getActiveBankAccountByAccountPk(accountPk);
    }

    @GetMapping("/getCreditCards/{accountPk}")
    public List<SvCreditCard> getCreditCards(@PathVariable long accountPk){
        return tmsService.getTokenizedCardsByAccountPk(accountPk);
    }

    @PostMapping("/makeCreditCardPayment")
    public CCTransactionResult makeCreditCardPayment(@RequestBody CCTransactionInfo ccTransactionInfo){
        return tmsService.runTransaction(ccTransactionInfo);
    }

    @PostMapping("/makeCreditCardPayments")
    public TmsPaymentArrangement makeCreditCardPayments(@RequestBody PaymentArrangement paymentArrangement){
        return tmsService.runTransactions(paymentArrangement);
    }

    @GetMapping("/getAutopayCreditCard/{accountPk}")
    public SvCreditCard getAutopayCreditCard(@PathVariable long accountPk){
        List<SvCreditCard> creditCards = tmsService.getTokenizedCardsByAccountPk(accountPk);
        if(CollectionUtils.isEmpty(creditCards))
            return null;
        creditCards = creditCards.stream().filter(cc -> cc.getCreditCardInfo().getAutoPay()).collect(Collectors.toList());
        if(CollectionUtils.isEmpty(creditCards))
            return null;
        return creditCards.get(0);
    }

    @PostMapping("/makeAchPayment")
    public SvACHPayment makeAchPayment(@RequestBody ACHPayment achPayment){
        return tmsService.makeAchPayment(achPayment);
    }

    @PostMapping("/addLogNote")
    public SvActivityLog addLogNote(@RequestBody LogRequest logRequest) {
        return loggingService.createActivityLog(
            logRequest.getAccountPk(),
            logRequest.getLogType() == null  && ThreadAttributes.getUsername().equalsIgnoreCase("skit.ai") ?
                LogType.SKIT_CALL_LOG :  logRequest.getLogType(),
            logRequest.getLogNote(),
            ThreadAttributes.getUsername()
        );
    }
}

src/main/java/com/uownleasing/svc/service/TmsService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.RatingLetter;
import com.uownleasing.common.pojo.ACHPayment;
import com.uownleasing.common.pojo.CCTransactionInfo;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.service.AddressService;
import com.uownleasing.svc.common.service.BankAccountService;
import com.uownleasing.svc.common.service.SchedSummaryService;
import com.uownleasing.svc.common.service.SvCreditCardService;
import com.uownleasing.svc.common.db.repository.SvReceivableRepo;
import com.uownleasing.svc.exceptions.TmsException;
import com.uownleasing.svc.pojo.CCTransactionResult;
import com.uownleasing.svc.pojo.PaymentArrangement;
import com.uownleasing.svc.pojo.embeddable.DueDateMoveInfo;
import com.uownleasing.svc.pojo.rest.AccountSummary;
import com.uownleasing.svc.pojo.rest.CustomerInformation;
import com.uownleasing.svc.pojo.rest.TmsAccountSummary;
import com.uownleasing.svc.pojo.rest.TmsPaymentArrangement;
import com.uownleasing.svc.service.cc.CCTransactionService;
import com.uownleasing.svc.utility.StringUtility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class TmsService {
    private final SvAccountService accountService;

    private final SvCustomerService customerService;

    private final AddressService addressService;
    private final CCTransactionService ccTransactionService;
    private final AccountSummaryService accountSummaryService;
    private final BankAccountService bankAccountService;
    private final SvCreditCardService ccService;
    private final ACHPaymentService achPaymentService;

    private final PaymentService paymentService;

    private final PaymentArrangementService paymentArrangementService;
    private final PayOffAmountService payOffAmountService;
    private final SchedSummaryService schedSummaryService;
    private final SvReceivableRepo receivableRepo;


    /*
     * These functions are called from the TmsController. They wrap exceptions thrown
     * from the nested functions in a TmsException, so they can be handled differently
     * than when they throw SvcExceptions (the nested functions throw SvcExceptions when
     * they're called from other controllers)
     */

    public TmsAccountSummary getAccountSummary(long accountPk) {
        try {
            SvAccount account = accountService.getAccountByPK(accountPk);
            AccountSummary accountSummary = accountSummaryService.getAccountSummaryForAccount(accountPk);
            TmsAccountSummary tmsAccountSummary = new TmsAccountSummary(accountSummary);

            populateCustomerInformation(tmsAccountSummary, accountPk);
            populateAddressInformation(tmsAccountSummary, accountSummary.getCustomerPk());
            populateAccountDetails(tmsAccountSummary, account);
            populatePaymentInformation(tmsAccountSummary, accountPk);
            populateSchedSummaryInformation(tmsAccountSummary, accountPk);
            calculateNumberOfPaymentsLeft(tmsAccountSummary, accountPk);

            return tmsAccountSummary;
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    private void populateCustomerInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        CustomerInformation customerInformation = customerService.getPrimaryCustomerInfoForAccount(accountPk);
        tmsAccountSummary.setCustomerDob(customerInformation.getPrimaryCustomerInformation().getDateOfBirth());
    }

    private void populateAddressInformation(TmsAccountSummary tmsAccountSummary, long customerPk) {
        SvAddress address = addressService.getHomeAddressForCustomer(customerPk);
        tmsAccountSummary.setCustomerAddressLine1(address.getAddressInfo().getStreetAddress1());
        tmsAccountSummary.setCustomerAddressLine2(address.getAddressInfo().getStreetAddress2());
        tmsAccountSummary.setCustomerCity(address.getAddressInfo().getCity());
        tmsAccountSummary.setCustomerState(address.getAddressInfo().getState());
        tmsAccountSummary.setCustomerZip(address.getAddressInfo().getZipCode());
    }

    private void populateAccountDetails(TmsAccountSummary tmsAccountSummary, SvAccount account) {
        tmsAccountSummary.setActivationDate(account.getAccountInfo().getActivationDate());
        tmsAccountSummary.setRatingLetter(account.getAccountInfo().getRating() == null ? null : RatingLetter.valueOf(account.getAccountInfo().getRating()));
        tmsAccountSummary.setDateOfNextCall(account.getAccountInfo().getDateOfNextCall());
    }

    private void populatePaymentInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        List<SvPayment> payments = paymentService.getAllAppliedPaymentsForAccount(accountPk);
        tmsAccountSummary.setNumberOfPaymentsMade(payments != null ? payments.size() : 0);
    }

    private void populateSchedSummaryInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        SvSchedSummary schedSummary = schedSummaryService.getSchedSummaryByAccount(accountPk);
        tmsAccountSummary.setEarlyPayOffDate(schedSummary != null && schedSummary.getSchedSummaryInfo() != null ? schedSummary.getSchedSummaryInfo().getEarlyPayoffDateExpiry() : null);
    }

    private void calculateNumberOfPaymentsLeft(TmsAccountSummary tmsAccountSummary, long accountPk) {
        long count = receivableRepo.countActiveUnpaidOrPartiallyPaidRegularReceivables(accountPk);
        tmsAccountSummary.setNumberOfPaymentsLeft((int) count);
    }

    public CCTransactionResult runTransaction(CCTransactionInfo ccTransactionInfo) {
        try {
            ccTransactionInfo = ccTransactionService.runTransaction(ccTransactionInfo);
            return new CCTransactionResult(ccTransactionInfo);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvReceivable> moveAllDueDatesByDays(DueDateMoveInfo dueDateMoveInfo) {
        try {
            return accountService.moveAllDueDatesByDays(dueDateMoveInfo);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public BigDecimal getPayOffAmount(long accountPk) {
        try {
            return payOffAmountService.getPayOffAmount(accountPk).getEpoBalance();
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvBankAccount> getActiveBankAccountByAccountPk(long accountPk) {
        try {
            return bankAccountService.getActiveBankAccountByAccountPk(accountPk);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvCreditCard> getTokenizedCardsByAccountPk(long accountPk) {
        try {
            return ccService.getTokenizedCardsByAccountPk(accountPk);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public SvACHPayment makeAchPayment(ACHPayment achPayment) {
        try {
            return achPaymentService.createOrUpdateAchPayment(achPayment);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    private String getException(Exception e) {
        return StringUtils.isBlank(e.getMessage()) ? StringUtility.convertStackTraceToString(e) : e.getMessage();
    }

    public void updateAccount(TmsAccountSummary accountSummary) {
        try {
            SvAccount svAccount = accountService.getAccountByPK(accountSummary.getAccountPk());
            if(svAccount != null){
                svAccount.getAccountInfo().setDebtType(accountSummary.getDebtType());
                svAccount.getAccountInfo().setInternalAccountScore(accountSummary.getInternalAccountScore());
            }
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public TmsPaymentArrangement runTransactions(PaymentArrangement paymentArrangement){
        try {
            PaymentArrangement result = paymentArrangementService.runTransactions(paymentArrangement);
            if (result != null){
                return new TmsPaymentArrangement(result);
            }
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
        return null;
    }
}

src/main/java/com/uownleasing/svc/tms/FindAccountRequest.java
package com.uownleasing.svc.tms;

import java.time.LocalDate;


public record FindAccountRequest(
    String phone,
    String last4SSN,
    LocalDate dob
) {
}

src/main/java/com/uownleasing/svc/tms/FindAccountResponse.java
package com.uownleasing.svc.tms;

import com.uownleasing.svc.pojo.rest.AccountProfile;

import java.util.List;

public record FindAccountResponse(List<AccountProfile> content, long size) {
}

src/main/java/com/uownleasing/svc/tms/IVRSearchService.java
package com.uownleasing.svc.tms;

import com.uownleasing.common.enumeration.AccountStatus;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.exceptions.TooManyAccountsFoundException;
import com.uownleasing.svc.pojo.rest.AccountProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class IVRSearchService {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    private final SvSqlConfigService svSqlConfigService;

    public FindAccountResponse findActivePrimaryAccountsBy(FindAccountRequest findAccountRequest, Pageable pageable) {
        if (findAccountRequest.dob() == null && !StringUtils.hasText(findAccountRequest.phone()) && !StringUtils.hasText(findAccountRequest.last4SSN())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must supply at least one identifier: SSN, phone number, or date of birth");
        }
        log.info("********************START [getActivePrimaryAccountsBy]********************");

        String sqlQuery = svSqlConfigService.getSqlConfigBySqlName("getAccountsForIVR").getSqlConfigInfo().getSqlQuery();
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("dob", findAccountRequest.dob())
            .addValue("phone", findAccountRequest.phone())
            .addValue("last4SSN", findAccountRequest.last4SSN())
            .addValue("offset", pageable.getOffset())
            .addValue("size",  pageable.getPageSize());


        List<AccountProfile> contents = namedParameterJdbcTemplate.query(sqlQuery, params, (rs, rowNum) -> {
            long totalResults = rs.getLong("totalResults");

            return new AccountProfile(
                rs.getLong("accountPk"),
                AccountStatus.valueOf(rs.getString("accountStatus")),
                rs.getString("firstName"),
                rs.getString("lastName"),
                rs.getString("last4Ssn"),
                rs.getObject("dob", LocalDate.class),
                rs.getString("zip"),
                rs.getString("phone"),
                rs.getString("email"),
                totalResults);
        });
        if (contents.size() > 5) {
            throw new TooManyAccountsFoundException(contents.size());
        }

        log.info("********************END [getActivePrimaryAccountsBy]********************");
        return new FindAccountResponse(contents, contents.isEmpty() ? 0 : contents.get(0).totalResults());
    }
}

src/main/java/com/uownleasing/svc/tms/InboundIVRController.java
package com.uownleasing.svc.tms;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/tms", produces = MediaType.APPLICATION_JSON_VALUE)
public class InboundIVRController {

    private final IVRSearchService ivrSearchService;

    @PostMapping("/v1/accounts/search")
    public FindAccountResponse searchAccount(@RequestBody FindAccountRequest findAccountRequest) {
        Pageable pageable = PageRequest.of(0, 10);
        return ivrSearchService.findActivePrimaryAccountsBy(findAccountRequest, pageable);
    }
}

src/main/resources/config/application-dev.yml
logging:
  level:
    ROOT: DEBUG
    com.uownleasing: DEBUG
    org.hibernate.SQL: INFO

spring:
  config:
    activate:
      on-profile: dev
  devtools:
    restart:
      enabled: true
      additional-exclude: static/**
    livereload:
      enabled: false
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    url: jdbc:postgresql://localhost:5433/ams?sslmode=disable
    username: ams_user
    password:
    hikari:
      poolName: Hikari
      auto-commit: false
  jackson:
    serialization:
      indent-output: true
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQL95Dialect

server:
  port: 8082

application:
  logging:
    use-json-format: false # By default, logs are not in Json format
    logstash: # Forward logs to logstash over a socket, used by LoggingConfiguration
      enabled: false
      host: localhost
      port: 5000
      queue-size: 512
  cors:
    allowed-headers: '*'
    allowed-methods: '*'
    allow-credentials: true
    allowed-origin-patterns: '*'
  authentication:
    max-login-attempt: 3                # the maximum number of login attempts a user can make before being locked out

    login-attempt-reset-interval: 5     # the time in minutes where upon an unsuccessful login attempt,
                                        # the next unsuccessful login attempt to will be counted towards lock out login attempts.
                                        # when this time frame passes, the login attempts count will be reset.

    login-lockout-time: 60               # the time in minutes where an account will be locked due to exceeding the maximum login attempts
                                        # set to 0 to lock indefinitely

    login-token-expiration-time: 60     # the time in minutes a login token is valid for once issued

src/main/resources/sqls/getAccountsForIVR.sql
WITH filtered_accounts AS (SELECT account.pk                                  AS "accountPk",
                                  account.account_status                      AS "accountStatus",
                                  customer.first_name                         AS "firstName",
                                  customer.last_name                          AS "lastName",
                                  RIGHT(customer.ssn, 4)                      AS "last4Ssn",
                                  customer.date_of_birth                      AS "dob",
                                  address.zip_code                            AS "zip",
                                  CONCAT(phone.area_code, phone.phone_number) AS "phone",
                                  email.email_address                         AS "email"
                           FROM uown_sv_account AS account
                                    JOIN uown_sv_customer AS customer
                                         ON customer.account_pk = account.pk
                                             AND customer.customer_type = 'PRIMARY'
                                    JOIN uown_sv_email AS email
                                         ON email.account_pk = account.pk AND email.email_type = 'PRIMARY'
                                    JOIN uown_sv_phone AS phone
                                         ON phone.account_pk = account.pk
                                    JOIN uown_sv_address AS address
                                         ON address.account_pk = account.pk
                           WHERE account.account_status = 'ACTIVE'
                             AND (CAST(:last4SSN AS TEXT) IS NULL OR
                                  customer.ssn LIKE CONCAT('%', CAST(:last4SSN AS TEXT)))
                             AND (CAST(:phone AS TEXT) IS NULL OR
                                  CAST(:phone AS TEXT) = CONCAT((phone.area_code)::TEXT, (phone.phone_number)::TEXT))
                             AND (CAST(:dob AS TEXT) IS NULL OR
                                  customer.date_of_birth = CAST(CAST(:dob AS TEXT) AS DATE))),
     total AS (SELECT COUNT(*) AS totalResults
               FROM filtered_accounts)
SELECT a.*,
       t.totalResults
FROM filtered_accounts AS a
         CROSS JOIN
     total AS t
ORDER BY a."accountPk" DESC
OFFSET :offset LIMIT :size

/Users/josedjalmaferreiramendes/projects./svc/src/main/java/com/uownleasing/svc/logging/RequestFilter.java

package com.uownleasing.svc.logging;

import com.uownleasing.los.common.db.config.*;
import com.uownleasing.svc.common.config.*;
import com.uownleasing.svc.config.*;
import com.uownleasing.svc.service.ApiKeyService;
import lombok.extern.slf4j.*;
import org.apache.commons.lang3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.*;
import org.springframework.web.filter.*;
import org.springframework.web.util.*;

import javax.servlet.*;
import javax.servlet.http.*;
import java.io.*;


@Component
@Slf4j
public class RequestFilter extends GenericFilterBean {
    //@Override
    /*public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
        throws IOException, ServletException {
        log.debug("#######INSIDE DO FILTER###########");
        HttpServletRequest currentRequest = (HttpServletRequest) servletRequest;
        HttpServletResponse currentResponse = (HttpServletResponse) servletResponse;
        CustomRequestWrapper wrappedRequest = new CustomRequestWrapper(currentRequest);
        CustomResponseWrapper wrappedResponse = new CustomResponseWrapper(currentResponse);
        chain.doFilter(wrappedRequest, wrappedResponse);
    }*/

    @Autowired
    private ApiKeyService apiKeyService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(httpServletRequest);
        String username = requestWrapper.getHeader("username");
        String deviceInfo = requestWrapper.getHeader("User-Agent");
        String ipAddress = requestWrapper.getHeader("X-Client-Ip");
        if(StringUtils.isBlank(deviceInfo)){
            deviceInfo = requestWrapper.getHeader("user-agent");
        }

//        parseMerchantRefCodes(getRequestBody(requestWrapper));
//        if (CollectionUtils.isEmpty(ThreadAttributes.getMerchantReferenceCodes())) {
//            String merchantCode = requestWrapper.getHeader("merchantReferenceCode");
//            ThreadAttributes.setMerchantReferenceCodes(StringUtils.isBlank(merchantCode) || merchantCode.equalsIgnoreCase("*")
//                ? null
//                : Arrays.asList(merchantCode.split(",")));
//        }

        log.debug("[RequestFilter][doFilter] Method: {} Url: {}", httpServletRequest.getMethod(), httpServletRequest.getRequestURL());
        log.debug("[RequestFilter][doFilter] Service {} Username {}, deviceInfo {}", requestWrapper.getRequestURI(), username, deviceInfo);
        String path = requestWrapper.getRequestURI();
        log.debug("PATH {}", path);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper((HttpServletResponse) response);
//        if(!path.startsWith("/uown/svc") && !path.startsWith("/management/health")
//            && !path.startsWith("/uown/los/getApplicationStatus") && !path.startsWith("/uown/los/sendApplication")
//            && !path.startsWith("/uown/los/getApplicationStatus") && !path.startsWith("/uown/los/sendApplication")
//            && !path.startsWith("/uown/los/getApplicationStatus") && !path.startsWith("/uown/los/sendApplication")
//            && StringUtils.isBlank(merchantCode)){
//            HttpServletResponse resp = (HttpServletResponse) response;
//            String error = "Invalid user";
//            resp.reset();
//            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//            response.setContentLength(error.length());
//            response.getWriter().write(error);
//        }else {
        ThreadAttributes.setUsername(username);
        ThreadAttributes.setDeviceInfo(deviceInfo == null ? "EMPTY" : deviceInfo);
        ThreadAttributes.setIpAddress(ipAddress == null ? "NO_IP_ADDRESS" : ipAddress);
        LosThreadAttributes.setUsername(ThreadAttributes.getUsername());
        SvThreadAttributes.setUsername(ThreadAttributes.getUsername());
        log.debug(" LOS logUsername : {}, SVC logUsername : {}", LosThreadAttributes.getUsername(), SvThreadAttributes.getUsername());

        boolean pathStartsWithSvc = path.startsWith("/uown/svc");
        boolean pathStartsWithTms = path.startsWith("/uown/tms");
        if (pathStartsWithSvc || pathStartsWithTms) {
            String requestApiKey = requestWrapper.getHeader("Authorization");
            log.debug("requestApiKey {}", requestApiKey);

            String svcApiKey = "knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2";
            String tmsApiKey = "65INPJ7e003SFSHOyNOoGOUCIoKRZST2r79YrZoHiXJmZs9lRWYD0gw8BYXY8SRT";

            String apiKey;
            if (pathStartsWithSvc) {
                apiKey = svcApiKey;
            } else {
                apiKey = tmsApiKey;
            }

            // Check if the token received in the request matches the appropriate key (either svc or tms)
            if (StringUtils.isNotBlank(requestApiKey) && requestApiKey.equalsIgnoreCase(apiKey)) {
                chain.doFilter(requestWrapper, responseWrapper);
            } else if(pathStartsWithTms && StringUtils.isNotBlank(requestApiKey) && apiKeyService.isValid(requestApiKey)) {
                ThreadAttributes.setUsername(username);
                LosThreadAttributes.setUsername(ThreadAttributes.getUsername());
                SvThreadAttributes.setUsername(ThreadAttributes.getUsername());
                chain.doFilter(requestWrapper, responseWrapper);
            } else {
                HttpServletResponse resp = (HttpServletResponse) response;
                String error = "Invalid API KEY";
                resp.reset();
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentLength(error.length());
                response.getWriter().write(error);
            }
        } else {
            chain.doFilter(requestWrapper, responseWrapper);
        }
        responseWrapper.copyBodyToResponse();
    }
}





analise o que encontrei
public class TmsService {
    private final SvAccountService accountService;

    private final SvCustomerService customerService;

    private final AddressService addressService;
    private final CCTransactionService ccTransactionService;
    private final AccountSummaryService accountSummaryService;
    private final BankAccountService bankAccountService;
    private final SvCreditCardService ccService;
    private final ACHPaymentService achPaymentService;

    private final PaymentService paymentService;

    private final PaymentArrangementService paymentArrangementService;
    private final PayOffAmountService payOffAmountService;
    private final SchedSummaryService schedSummaryService;
    private final SvReceivableRepo receivableRepo;


    /*
     * These functions are called from the TmsController. They wrap exceptions thrown
     * from the nested functions in a TmsException, so they can be handled differently
     * than when they throw SvcExceptions (the nested functions throw SvcExceptions when
     * they're called from other controllers)
     */

    public TmsAccountSummary getAccountSummary(long accountPk) {
        try {
            SvAccount account = accountService.getAccountByPK(accountPk);
            AccountSummary accountSummary = accountSummaryService.getAccountSummaryForAccount(accountPk);
            TmsAccountSummary tmsAccountSummary = new TmsAccountSummary(accountSummary);

            populateCustomerInformation(tmsAccountSummary, accountPk);
            populateAddressInformation(tmsAccountSummary, accountSummary.getCustomerPk());
            populateAccountDetails(tmsAccountSummary, account);
            populatePaymentInformation(tmsAccountSummary, accountPk);
            populateSchedSummaryInformation(tmsAccountSummary, accountPk);
            calculateNumberOfPaymentsLeft(tmsAccountSummary, accountPk);

            return tmsAccountSummary;
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    private void populateCustomerInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        CustomerInformation customerInformation = customerService.getPrimaryCustomerInfoForAccount(accountPk);
        tmsAccountSummary.setCustomerDob(customerInformation.getPrimaryCustomerInformation().getDateOfBirth());
    }

    private void populateAddressInformation(TmsAccountSummary tmsAccountSummary, long customerPk) {
        SvAddress address = addressService.getHomeAddressForCustomer(customerPk);
        tmsAccountSummary.setCustomerAddressLine1(address.getAddressInfo().getStreetAddress1());
        tmsAccountSummary.setCustomerAddressLine2(address.getAddressInfo().getStreetAddress2());
        tmsAccountSummary.setCustomerCity(address.getAddressInfo().getCity());
        tmsAccountSummary.setCustomerState(address.getAddressInfo().getState());
        tmsAccountSummary.setCustomerZip(address.getAddressInfo().getZipCode());
    }

    private void populateAccountDetails(TmsAccountSummary tmsAccountSummary, SvAccount account) {
        tmsAccountSummary.setActivationDate(account.getAccountInfo().getActivationDate());
        tmsAccountSummary.setRatingLetter(account.getAccountInfo().getRating() == null ? null : RatingLetter.valueOf(account.getAccountInfo().getRating()));
        tmsAccountSummary.setDateOfNextCall(account.getAccountInfo().getDateOfNextCall());
    }

    private void populatePaymentInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        List<SvPayment> payments = paymentService.getAllAppliedPaymentsForAccount(accountPk);
        tmsAccountSummary.setNumberOfPaymentsMade(payments != null ? payments.size() : 0);
    }

    private void populateSchedSummaryInformation(TmsAccountSummary tmsAccountSummary, long accountPk) {
        SvSchedSummary schedSummary = schedSummaryService.getSchedSummaryByAccount(accountPk);
        tmsAccountSummary.setEarlyPayOffDate(schedSummary != null && schedSummary.getSchedSummaryInfo() != null ? schedSummary.getSchedSummaryInfo().getEarlyPayoffDateExpiry() : null);
    }

    private void calculateNumberOfPaymentsLeft(TmsAccountSummary tmsAccountSummary, long accountPk) {
        long count = receivableRepo.countActiveUnpaidOrPartiallyPaidRegularReceivables(accountPk);
        tmsAccountSummary.setNumberOfPaymentsLeft((int) count);
    }

    public CCTransactionResult runTransaction(CCTransactionInfo ccTransactionInfo) {
        try {
            ccTransactionInfo = ccTransactionService.runTransaction(ccTransactionInfo);
            return new CCTransactionResult(ccTransactionInfo);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvReceivable> moveAllDueDatesByDays(DueDateMoveInfo dueDateMoveInfo) {
        try {
            return accountService.moveAllDueDatesByDays(dueDateMoveInfo);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public BigDecimal getPayOffAmount(long accountPk) {
        try {
            return payOffAmountService.getPayOffAmount(accountPk).getEpoBalance();
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvBankAccount> getActiveBankAccountByAccountPk(long accountPk) {
        try {
            return bankAccountService.getActiveBankAccountByAccountPk(accountPk);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public List<SvCreditCard> getTokenizedCardsByAccountPk(long accountPk) {
        try {
            return ccService.getTokenizedCardsByAccountPk(accountPk);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public SvACHPayment makeAchPayment(ACHPayment achPayment) {
        try {
            return achPaymentService.createOrUpdateAchPayment(achPayment);
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    private String getException(Exception e) {
        return StringUtils.isBlank(e.getMessage()) ? StringUtility.convertStackTraceToString(e) : e.getMessage();
    }

    public void updateAccount(TmsAccountSummary accountSummary) {
        try {
            SvAccount svAccount = accountService.getAccountByPK(accountSummary.getAccountPk());
            if(svAccount != null){
                svAccount.getAccountInfo().setDebtType(accountSummary.getDebtType());
                svAccount.getAccountInfo().setInternalAccountScore(accountSummary.getInternalAccountScore());
            }
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
    }

    public TmsPaymentArrangement runTransactions(PaymentArrangement paymentArrangement){
        try {
            PaymentArrangement result = paymentArrangementService.runTransactions(paymentArrangement);
            if (result != null){
                return new TmsPaymentArrangement(result);
            }
        } catch (Exception e) {
            throw new TmsException(getException(e));
        }
        return null;
    }
}

public class SvCustomerService{

    private final AccountService accountService;
    private final CustomerService customerService;

    private final EmploymentService employmentService;
    private final PhoneService phoneService;
    private final EmailService emailService;
    private final AddressService addressService;
    private final LosLeadService leadService;
    private final LosCustomerService losCustomerService;
    private final LosAddressService losAddressService;
    private final LosPhoneService losPhoneService;
    private final LosEmailService losEmailService;
    private final LosEmploymentService losEmploymentService;
    private final LosBankAccountService bankAccountService;
    private final LoginAttemptRepo loginAttemptRepo;
    private final EmailQService emailQService;
    private final SmsService smsService;
    private final ConfigurationManagement configManagement;
    private final LoggingService svLoggingService;

    private final SvCustomerRepo svCustomerRepo;

    public CustomerInformation getPrimaryCustomerInfoForAccount(long accountPk){
        SvAccount account = accountService.getAccountByPK(accountPk);
        CustomerInformation customerInformation = null;

        if(account != null) {
            customerInformation = new CustomerInformation();
            SvCustomer primaryCustomer = customerService.getPrimaryCustomer(account.getPk());
            customerInformation.setPrimaryCustomerInformation(primaryCustomer.getCustomerInfo());
        }
        return customerInformation;

    }

    public ResponseEntity<CustomerInformation> getPrimaryCustomerInfoForLead(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        if(lead == null) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
        CustomerInformation customerInformation = new CustomerInformation();
        LosCustomer primaryCustomer = losCustomerService.getPrimaryCustomer(lead.getPk());
        if (primaryCustomer == null) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
        customerInformation.setPrimaryCustomerInformation(primaryCustomer.getCustomerInfo());
        return new ResponseEntity<>(customerInformation, HttpStatus.OK);
    }

    public ContactInformation getPrimaryCustomerContactInfoForAccount(long accountPk){
        SvAccount account = accountService.getAccountByPK(accountPk);
        ContactInformation contactInformation = null;
        if(account != null) {
            contactInformation = new ContactInformation();
            SvCustomer primaryCustomer = customerService.getPrimaryCustomer(account.getPk());
            List<SvPhone> phones = phoneService.getPhonesByCustomerPK(primaryCustomer.getPk());
            contactInformation.setPhoneList(phones);
            List<SvEmail> emails = emailService.getEmailsByCustomerPK(primaryCustomer.getPk());
            contactInformation.setEmailList(emails);
            List<SvAddress> addresses = addressService.getAllPrimaryCustomerAddresses(primaryCustomer.getPk());
            contactInformation.setAddressList(addresses);
            contactInformation.setAccountPk(accountPk);
        }

        return contactInformation;
    }

    public ResponseEntity<ContactInformation> getPrimaryCustomerContactInfoForLead(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        if(lead == null) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
        ContactInformation contactInformation = new ContactInformation();
        LosCustomer primaryCustomer = losCustomerService.getPrimaryCustomer(lead.getPk());
        if (primaryCustomer == null) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
        List<LosPhone> phones = losPhoneService.getPhonesByCustomerPK(primaryCustomer.getPk());
        contactInformation.setLeadPhones(phones);
        List<LosEmail> emails = losEmailService.getEmailsByCustomerPK(primaryCustomer.getPk());
        contactInformation.setLeadEmails(emails);
        List<LosAddress> addresses = losAddressService.getAllAddressesForPrimaryCustomer(primaryCustomer.getPk());
        contactInformation.setLeadAddresses(addresses);
        contactInformation.setLeadPk(leadPk);
        return new ResponseEntity<>(contactInformation, HttpStatus.OK);
    }

    public CustomerInformation createOrUpdatePrimaryCustomerInfo(@Valid CustomerInformation customerInformation){
        SvAccount account = accountService.getAccountByPK(customerInformation.getPrimaryCustomerInformation().getAccountPk());
        if(account != null) {
            customerInformation.getPrimaryCustomerInformation().setLeadPk(account.getAccountInfo().getLeadPk());
            CustomerInfo customerInfo = customerService.createOrUpdateCustomer(customerInformation.getPrimaryCustomerInformation()).getCustomerInfo();
            customerInformation.setPrimaryCustomerInformation(customerInfo);
        }
        return customerInformation;
    }

    public CustomerInformation createOrUpdatePrimaryCustomerInfoForLead(@Valid CustomerInformation customerInformation){
        LosLead lead = leadService.getByLeadPk(customerInformation.getPrimaryCustomerInformation().getLeadPk());
        if(lead != null) {
            CustomerInfo customerInfo = losCustomerService.createOrUpdateCustomer(customerInformation.getPrimaryCustomerInformation()).getCustomerInfo();
            customerInformation.setPrimaryCustomerInformation(customerInfo);
        }
        return customerInformation;
    }

    public ContactInformation createOrUpdatePrimaryCustomerContactInfo(@Valid ContactInformation contactInformation){
        SvAccount account = accountService.getAccountByPK(contactInformation.getAccountPk());
        SvCustomer primaryCustomer = customerService.getPrimaryCustomer(account.getPk());
        List<SvPhone> phoneList = new ArrayList<>();
        List<SvEmail> emailList = new ArrayList<>();
        List<SvAddress> addressList = new ArrayList<>();

        if (account != null) {
            log.info("Given phoneList {}", contactInformation.getPhoneList());
            for (SvPhone phone : contactInformation.getPhoneList()) {
                String phoneNumber = phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber().toString();
                if(PhoneNumberUtils.isValidUSPhoneNumber(phoneNumber)){
                    phone.setCustomer(primaryCustomer);
                    phoneList.add(phoneService.createOrUpdatePhone(phone.getPhoneInfo()));
                }
                else {
                    throw new SvcException("Invalid Phone Number");
                }
            }

            for(SvEmail email : contactInformation.getEmailList()) {
                email.setCustomer(primaryCustomer);
                emailList.add(emailService.createOrUpdate(email.getEmailInfo()));
            }

            for(SvAddress address : contactInformation.getAddressList()) {
                address.setCustomer(primaryCustomer);
                addressList.add(addressService.createOrUpdateAddress(address.getAddressInfo()));
            }

            contactInformation.setAccountPk(account.getPk());
            contactInformation.setPhoneList(phoneList);
            contactInformation.setEmailList(emailList);
            contactInformation.setAddressList(addressList);

        }
        return contactInformation;
    }

    public ContactInformation createOrUpdatePrimaryCustomerContactInfoForLead(@Valid ContactInformation contactInformation){
        LosLead lead = leadService.getByLeadPk(contactInformation.getLeadPk());
        LosCustomer primaryCustomer = losCustomerService.getPrimaryCustomer(lead.getPk());
        List<LosPhone> phoneList = new ArrayList<>();
        List<LosEmail> emailList = new ArrayList<>();
        List<LosAddress> addressList = new ArrayList<>();
        if(lead != null) {
            for(LosPhone phone : contactInformation.getLeadPhones()) {
                phone.setLosCustomer(primaryCustomer);
                phoneList.add(losPhoneService.createOrUpdatePhone(phone.getPhoneInfo()));
            }

            for(LosEmail email : contactInformation.getLeadEmails()) {
                email.setLosCustomer(primaryCustomer);
                emailList.add(losEmailService.createOrUpdate(email.getEmailInfo()));
            }

            for(LosAddress address : contactInformation.getLeadAddresses()) {
                address.setLosCustomer(primaryCustomer);
                addressList.add(losAddressService.createOrUpdateAddress(address.getAddressInfo()));
            }
            contactInformation.setLeadPk(lead.getPk());
            contactInformation.setLeadPhones(phoneList);
            contactInformation.setLeadEmails(emailList);
            contactInformation.setLeadAddresses(addressList);

        }
        return contactInformation;
    }


    public CustomerLoginResult authenticateCustomer(CustomerLoginRequest request) {
        CustomerLoginResult result = new CustomerLoginResult();
        List<SvCustomer> customers = customerService.getCustomer(request.getFirstName(), request.getLastName(), request.getLast4ssn(), request.getDateOfBirth());
        if(customers != null && !customers.isEmpty()){
            customers.stream().forEach(svCustomer -> result.getAccountPks().add(svCustomer.getAccount().getPk()));
        }
        return result;
    }

    public void sendVerificationCode(String emailOrPhone, Company company) {
        LoginAttempt loginAttempt = new LoginAttempt();
        loginAttempt.setEmailPhoneInput(emailOrPhone);
        loginAttempt = loginAttemptRepo.save(loginAttempt);
        String code = String.valueOf(new Random().nextInt(899999) + 100000);
        Matcher matcher = Pattern.compile("^(?!.*@)[0-9-]+$").matcher(emailOrPhone);
        List<SvAccount> accounts;
        if (matcher.matches()) {
            emailOrPhone = StringUtils.isNotBlank(emailOrPhone) ? emailOrPhone.replaceAll("-", "") : emailOrPhone;
            accounts = phoneService.getActiveAccountsByPhoneNumber(emailOrPhone);
            if (accounts == null || accounts.isEmpty()) {
                throw new SvcException("We could not find an active account for customer with phone number " + emailOrPhone + " in our system");
            }
        } else {
            accounts = emailService.getActiveAccountsByEmailAddress(emailOrPhone);
            if (accounts == null || accounts.isEmpty()) {
                throw new SvcException("We could not find an active account for customer with email " + emailOrPhone + " in our system");
            }
        }

        loginAttempt.setAccountPks(
            accounts.stream()
                .filter(account -> company != Company.KORNERSTONE || account.getAccountInfo().getCompany().equals(Company.KORNERSTONE))
                .map(account -> String.valueOf(account.getPk())).collect(Collectors.joining(",")));

        if (matcher.matches()) {
            SmsQueue sms = new SmsQueue();
            sms.setTemplateName("SendVerificationCode");
            sms.setAccountPk(accounts.get(0).getPk());
            sms.setLeadPk(accounts.get(0).getAccountInfo().getLeadPk());
            sms.setSmsBody(
                (Company.KORNERSTONE.equals(company)
                    ? "kornerstonecredit.com:"
                    : "uownleasing.com:")
                    + "NEVER share your verification code via call or text\nYour code is " + code
            );
            sms.setToPhoneNumber(emailOrPhone);
            loginAttempt.setSmsId(smsService.sendText(sms));
            svLoggingService.createActivityLog(accounts.get(0).getPk(), LogType.CORRESPONDENCE, false, null, "LOGIN ATTEMPT: Verification Code Sent to " + emailOrPhone, SvThreadAttributes.getUsername());
        } else {
            EmailQueue email = new EmailQueue();
            email.setAccountPk(accounts.get(0).getPk());
            email.setEmailBody("Your verification code is " + code);
            email.setSubject("Verification Code");
            email.setToEmailAddresses(emailOrPhone);
            email.setTemplateName("Verification Code");
            email.setFromEmailAddress(configManagement.getString(
                "verification.code.from.email.address." + company.name(),
                "KORNERSTONE".equalsIgnoreCase(company.name())
                    ? "CS@kornerstonecredit.com"
                    : "CustomerService@uownleasing.com"
            ));
            emailQService.sendEmail(email);
        }
        loginAttempt.setAccountFound(true);
        loginAttempt.setCode(code);
        loginAttempt.setSentTime(LocalDateTime.now());
        loginAttempt.setExpirationTime(LocalDateTime.now().plusMinutes(configManagement.getLong("verification.code.expiration.in.minutes", 5L)));
        loginAttemptRepo.save(loginAttempt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CustomerLoginResult verifyCode(String phoneOrEmail, String code) {
        CustomerLoginResult result = new CustomerLoginResult();
        LoginAttempt loginAttempt = loginAttemptRepo.findTopByEmailPhoneInputIgnoreCaseOrderByRowCreatedTimestampDesc(phoneOrEmail);
        if(loginAttempt == null){
            throw new SvcException("Invalid code");
        }
        loginAttempt.setNumberOfAttempts(loginAttempt.getNumberOfAttempts() != null ? loginAttempt.getNumberOfAttempts() + 1 : 1);
        loginAttempt.setGivenCodes(loginAttempt.getGivenCodes() != null ? loginAttempt.getGivenCodes() + "," + code : code);
        loginAttemptRepo.save(loginAttempt);
        List<Long> accountPks = Stream.of(loginAttempt.getAccountPks().split(",")).map(Long::parseLong).collect(Collectors.toList());

        Collections.sort(accountPks, (pk1, pk2) -> {
            AccountStatus s1 = customerService.getPrimaryCustomer(pk1).getAccount().getAccountInfo().getAccountStatus();
            AccountStatus s2 = customerService.getPrimaryCustomer(pk2).getAccount().getAccountInfo().getAccountStatus();
            return Boolean.compare(!AccountStatus.ACTIVE.equals(s1), !AccountStatus.ACTIVE.equals(s2));
        });

        Long primaryAccountPk = accountPks.get(0);

        if(!loginAttempt.getCode().equals(code)){
            svLoggingService.createActivityLog(primaryAccountPk,
                LogType.INTERNAL, "Login attempt " + loginAttempt.getNumberOfAttempts() + " failed due to mismatched code: " + code, SvThreadAttributes.getUsername());
            throw new SvcException("Given code doesn't match the code sent");
        }
        if(loginAttempt.getExpirationTime().compareTo(LocalDateTime.now()) < 0){
            svLoggingService.createActivityLog(primaryAccountPk,
                LogType.INTERNAL, String.format("Login attempt " + loginAttempt.getNumberOfAttempts() + " failed due to expired code: code -> %s; expiration -> %s", code, loginAttempt.getExpirationTime()),
                SvThreadAttributes.getUsername());
            throw new SvcException("Code has expired");
        }

        // Set the last successful login time to the current time for each account associated with the email/phone number
        for (Long accountPk : accountPks) {
            SvCustomer customer = customerService.getPrimaryCustomer(accountPk);
            customer.getCustomerInfo().setLastSuccessfulLogin(LocalDateTime.now());
            svCustomerRepo.save(customer);
        }

        svLoggingService.createActivityLog(primaryAccountPk,
            LogType.INTERNAL, String.format("Login Success using code %s at %s; Attempt %d", code, LocalDateTime.now(), loginAttempt.getNumberOfAttempts()),
            SvThreadAttributes.getUsername());
        result.setAccountPks(accountPks);
        return result;
    }

    public BasicCustomerData getBasicCustomerDataForAccount(long accountPk){
        SvAccount account = accountService.getAccountByPK(accountPk);
        SvCustomer primaryCustomer = customerService.getPrimaryCustomer(account.getPk());
        long customerPk = primaryCustomer.getPk();
        CustomerInfo customerInfo = primaryCustomer.getCustomerInfo();
        SvEmail email = emailService.getPrimaryEmailByCustomerPK(customerPk);
        List<SvPhone> phones = phoneService.getPhonesByCustomerPK(customerPk);
        PhoneInfo phone = CollectionUtils.isNotEmpty(phones) ? phones.get(0).getPhoneInfo() : null;
        SvAddress address = addressService.getHomeAddressForCustomer(customerPk);
        return new BasicCustomerData(
            customerInfo.getFirstName(),
            customerInfo.getLastName(),
            customerInfo.getDateOfBirth(),
            email != null ? email.getEmailInfo().getEmailAddress() : null,
            phone != null ? phone.getAreaCode() + phone.getPhoneNumber() : null,
            address != null ? address.getAddressInfo() : null
        );
    }

}


    public CalculatorResults calculateForAccount(CalculatorRequest request) {
        CalculatorResults result = new CalculatorResults();
        SvAccount account = request.getSvAccount();
        SvInvoice invoice = account.getSvInvoice();
        if (invoice == null || account.getSchedSummary() == null) {
            log.info("[CalculatorService][calculate] Account {} needs both Sched summary and invoice infomation. Returning without calculation", account.getPk());
            return result;
        }
        SchedSummaryInfo schedSummaryInfo = account.getSchedSummary().getSchedSummaryInfo();
        InvoiceInfo invoiceInfo = invoice.getInvoiceInfo();
        CustomerInfo customerInfo = svCustomerService.getCustomerService().getPrimaryCustomer(account.getPk()).getCustomerInfo();
        Merchant merchant = merchantService.getMerchantByAccountPk(account.getPk());
        AddressInfo addressInfo = svAddressService.getHomeAddressForCustomer(customerInfo.getCustomerPk()).getAddressInfo();
        result.setMerchant(merchant);
        int numberOfMonths = schedSummaryInfo.getTermInMonths();
        Frequency frequency = request.getPaymentFrequencyList().get(0);
        Integer numOfPayments = configurationManagement.getInteger(configurationPath + "numOfPayments." + numberOfMonths + "." + frequency);
        if (numOfPayments == null) {
            numOfPayments = getNumberOfPayments(numberOfMonths, frequency);
        }
        BigDecimal numberOfPayments = new BigDecimal(numOfPayments);
        BigDecimal minLastPaymentAmount = null;
        String state = addressInfo.getState();
        BigDecimal baseCost = getBaseCost(invoiceInfo);
        BigDecimal moneyFactor = getMoneyFactorForAccount(account);
        BigDecimal taxRate = schedSummaryInfo.getTaxRate();

        if(moneyFactor.equals(BigDecimal.ZERO)){
            result.setErrorMessage("Merchant program doesn't exist on account");
            return result;
        }
        BigDecimal contractAmountBeforeTax = getContractAmountBeforeTax(baseCost, moneyFactor);
        schedSummaryInfo.setTotalContractAmountWithTaxAndFees((contractAmountBeforeTax
            .multiply(BigDecimal.ONE.add(taxRate)))
            .add(schedSummaryInfo.getProcessingFee())
            .setScale(2, RoundingMode.HALF_EVEN));
        BigDecimal termPaymentNoTax = contractAmountBeforeTax.divide(numberOfPayments, 4, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);

        if (configurationManagement.getString("last.payment.amount.different.for.states", "NC").contains(state)) {
            minLastPaymentAmount = baseCost.multiply(BigDecimal.valueOf(configurationManagement.getDouble("last.payment.percent.rate.for.state." + state, 0.11))).setScale(2, RoundingMode.HALF_EVEN);
        }
        BigDecimal regularPaymentNoTax = minLastPaymentAmount == null ? termPaymentNoTax
            : contractAmountBeforeTax.subtract(minLastPaymentAmount).divide(new BigDecimal(numOfPayments - 1), 2, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal regularPaymentTax = regularPaymentNoTax.multiply(taxRate).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal regularPaymentWithTax = regularPaymentNoTax.add(regularPaymentTax).setScale(2, RoundingMode.HALF_EVEN);

        schedSummaryInfo.setPaymentFrequency(frequency);
        schedSummaryInfo.setTotalNumberOfPayments(numOfPayments);
        schedSummaryInfo.setFirstPaymentDueDate(request.getFirstPaymentDate() != null ? request.getFirstPaymentDate() : schedSummaryInfo.getFirstPaymentDueDate());
        schedSummaryInfo.setFirstPaymentNoTaxNoFees(regularPaymentNoTax);
        BigDecimal firstPaymentNoTaxWithFees = regularPaymentNoTax.add(schedSummaryInfo.getProcessingFee());
        schedSummaryInfo.setFirstPaymentWithTaxNoFees(regularPaymentNoTax.add(regularPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        schedSummaryInfo.setFirstPaymentNoTaxWithFees(firstPaymentNoTaxWithFees);
        schedSummaryInfo.setNextPaymentNoTaxNoFees(regularPaymentNoTax);
        schedSummaryInfo.setNextPaymentWithTax(regularPaymentWithTax);
        schedSummaryInfo.setLastPaymentNoTaxNoFees(minLastPaymentAmount == null ? regularPaymentNoTax : minLastPaymentAmount);
        schedSummaryInfo.setLastPaymentNoTaxWithFees(schedSummaryInfo.getLastPaymentNoTaxNoFees().subtract(schedSummaryInfo.getSecurityDeposit()));
        BigDecimal lastPaymentTax = schedSummaryInfo.getLastPaymentNoTaxWithFees().multiply(taxRate).setScale(4, RoundingMode.HALF_EVEN);
        schedSummaryInfo.setLastPaymentTax(lastPaymentTax);
        schedSummaryInfo.setLastPaymentWithTax(schedSummaryInfo.getLastPaymentNoTaxWithFees().add(lastPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        result.getSchedSummaryInfoList().add(schedSummaryInfo);
        return result;
    }


    public SvACHPayment createOrUpdateAchPayment(ACHPayment achPayment) {
        BankData bankData = achPayment.getBankData();
        if(bankData != null) {
            if(bankData.getIsAutoPay() == null){
                bankData.setIsAutoPay(Boolean.FALSE);
            }

            if(StringUtils.isBlank(bankData.getCustomerFirstName()) || StringUtils.isBlank(bankData.getCustomerLastName())){
                CustomerInfo customerInfo = svCustomerService.getPrimaryCustomerInfoForAccount(achPayment.getAccountPk()).getPrimaryCustomerInformation();
                bankData.setCustomerFirstName(customerInfo.getFirstName());
                bankData.setCustomerLastName(customerInfo.getLastName());
            }
            //In case of new account and selected auto-pay
            if (bankData.getBankAccountPk() == null) {
                BankAccountInfo bankAccountInfo = new BankAccountInfo();
                bankAccountInfo.setAccountPk(achPayment.getAccountPk());
                bankAccountInfo.setAccountNumber(bankData.getAccountNumber());
                bankAccountInfo.setRoutingNumber(bankData.getRoutingNumber());
                bankAccountInfo.setAutoPay(bankData.getIsAutoPay());
                bankAccountInfo.setName(bankData.getCustomerFirstName() + " " + bankData.getCustomerLastName());
                bankAccountInfo.setBankAccountType(achPayment.getBankAccountType()== null? BankAccountType.CHECKING:achPayment.getBankAccountType());
                bankAccountInfo.setCustomerPk(svCustomerService.getPrimaryCustomerInfoForAccount(achPayment.getAccountPk()).getPrimaryCustomerInformation().getCustomerPk());
                achPayment.setBankAccountType(achPayment.getBankAccountType()== null? BankAccountType.CHECKING:achPayment.getBankAccountType());
                achPayment.setCustomerFirstName(bankData.getCustomerFirstName());
                achPayment.setCustomerLastName(bankData.getCustomerLastName());
                achPayment.getBankData().setBankAccountPk(bankAccountService.createOrUpdateBankAccount(bankAccountInfo).getPk());
            }
            //In case existing
           else {
                SvBankAccount autoPayBankAccountForAccount = bankAccountService.getAutoPayBankAccountForAccount(achPayment.getAccountPk());
                SvBankAccount bankAccountForGivenPk = bankAccountService.getBankAccountByPk(bankData.getBankAccountPk());
                if(bankAccountForGivenPk != null){
                    achPayment.setBankAccountType(bankAccountForGivenPk.getBankAccountInfo().getBankAccountType());
                    achPayment.setCustomerFirstName(bankData.getCustomerFirstName());
                    achPayment.setCustomerLastName(bankData.getCustomerLastName());
                    if(bankData.getIsAutoPay()
                            && (autoPayBankAccountForAccount == null || (autoPayBankAccountForAccount != null && autoPayBankAccountForAccount.getPk() != bankAccountForGivenPk.getPk()))) {
                            BankAccountInfo bankAccountInfo = bankAccountForGivenPk.getBankAccountInfo();
                            bankAccountInfo.setAutoPay(bankData.getIsAutoPay());
                            bankAccountService.createOrUpdateBankAccount(bankAccountInfo);
                    }
                    bankData.setAccountNumber(bankAccountForGivenPk.getBankAccountInfo().getAccountNumber());
                    bankData.setRoutingNumber(bankAccountForGivenPk.getBankAccountInfo().getRoutingNumber());
                    bankData.setBankName(bankAccountForGivenPk.getBankAccountInfo().getBankName());
                    bankData.setBankAccountPk(bankAccountForGivenPk.getPk());
                    achPayment.setBankData(bankData);
                 }
           }
        }else{
            throw new SvcException("Error Creating ACH payment: No bank data");
        }
        achPayment.setUsername(
            StringUtils.isNotBlank(achPayment.getUsername())
                && "SYSTEM".equals(SvThreadAttributes.getUsername())
            ? achPayment.getUsername() : SvThreadAttributes.getUsername());
        if (configurationManagement.getBoolean(configurationPath + "ach.customer.portal.add.rating.letter", Boolean.TRUE)) {
            if (achPayment.getAchProcessType() != null && achPayment.getAchProcessType().equals(ACHProcessType.REQUEST) && achPayment.getPostingDate().compareTo(LocalDate.now()) > 0 && "customer portal".equalsIgnoreCase(achPayment.getUsername())) {
                SvAccount account = svAccountService.getAccountByPK(achPayment.getAccountPk());
                AccountInfo accountInfo = account.getAccountInfo();
                svAccountService.updateRatingLetterAndAutoPay(RatingLetter.P, accountInfo.getAutoPayTypes(), accountInfo);
            }
        }
        return createOrUpdateSvAchPayment(achPayment);
    }

public class AccountProtectionPlanService {

    private final SvProtectionPlanService protectionPlanService;
    private final SvAccountService accountService;
    private final SvCustomerService customerService;
    private final MerchantService merchantService;
    private final ConfigurationManagement config;
    private final LoggingService logger;
    private final SvSqlConfigService sqlConfigService;
    private final EntityManager entityManager;

    private static final String SQL_FIND_ACTIVE_PLAN_ACCOUNTS = "findActiveProtectionAccounts";
    private static final String CONFIG_PATH = "com.uownleasing.svc.service.AccountProtectionPlanService";

    public ProtectionPlanInfo enrollInProtectionPlan(long accountPk, boolean optIn, String customerId, String policyId, String orderId) {
        ProtectionPlanInfo plan = getByAccountPk(accountPk);
        SvAccount svAccount = accountService.getAccountByPK(accountPk);

        if (plan == null) {
            plan = new ProtectionPlanInfo(accountPk, optIn, customerId, policyId, orderId);
        } else {
            plan.setOptIn(optIn);
            plan.setCustomerId(customerId);
            plan.setPolicyId(policyId);
            plan.setOrderId(orderId);
        }
        plan.setStatus(ProtectionPlanStatus.COMPLETED);
        plan.setError(null);
        plan.setEnrollmentDate(LocalDate.now());
        plan.setLeadPk(svAccount.getAccountInfo().getLeadPk());
        log.info("Protection plan enrollment completed for accountPk={}, optedIn={}",
            accountPk, optIn);
        logger.createActivityLog(accountPk, LogType.INTERNAL, null, null, "Successfully enrolled in protection plan", ThreadAttributes.getUsername());
        return plan;
    }

    public ProtectionPlanInfo updateProtectionPlan(ProtectionPlanInfo plan) {
        return protectionPlanService.createOrUpdate(plan).getProtectionPlanInfo();
    }

    public ProtectionPlanInfo getByAccountPk(long accountPk) {
        return protectionPlanService.getInfoByAccountPk(accountPk);
    }

    public AccountProtectionPlanEligibility getPlanEligibilityForAccount(long accountPk) {

        Merchant merchant = merchantService.getMerchantByAccountPk(accountPk);
        SvAccount account = accountService.getAccountByPK(accountPk);
        AccountProtectionPlanEligibility eligibility = new AccountProtectionPlanEligibility();
        eligibility.setAccountPk(accountPk);

        if(!AccountStatus.ACTIVE.equals(account.getAccountInfo().getAccountStatus())){
            eligibility.setOfferProtectionPlan(Boolean.FALSE);
            logger.createActivityLog(account.getPk(), LogType.INTERNAL, null, null,
                "Protection plan not offered: Account status: " + account.getAccountInfo().getAccountStatus(), ThreadAttributes.getUsername());
            return eligibility;
        }
        BigDecimal ppFee = account.getSchedSummary().getSchedSummaryInfo().getProtectionPlanFee();
        if(ppFee != null && ppFee.compareTo(BigDecimal.ZERO) > 0){
            eligibility.setOfferProtectionPlan(Boolean.FALSE);
            logger.createActivityLog(account.getPk(), LogType.INTERNAL, null, null,
                "Already enrolled in protection plan via Kornerstone", ThreadAttributes.getUsername());
            return eligibility;
        }

        BasicCustomerData customer = customerService.getBasicCustomerDataForAccount(accountPk);
        eligibility.setBasicCustomerData(customer);

        String state = customer.getState();

        Boolean offerInsurance = merchant.getMerchantInfo().getOfferInsurance();
        if (Boolean.TRUE.equals(offerInsurance)) {
            String eligibleStates = config.getString(CONFIG_PATH + "offer.insurance.in.states", "AR, AZ, AK, AL, CO, CT, DE, DC, FL, GA, HI, IN, IL, IA, ID, KY, KS, LA, LA, MO, MI, MT, MN, MD, ME, MA, MS, NE, NY, NM, NH, ND, NC, NJ, NV, OR, OH, PA, SD, SC, TX, TN, VT, VA, WV, WY, WI, PR");
            if (!eligibleStates.contains(state)) {
                eligibility.setOfferProtectionPlan(false);
                logger.createActivityLog(account.getPk(), LogType.INTERNAL, null, null,
                    "Protection plan not offered in state " + state, ThreadAttributes.getUsername());
                return eligibility;
            }
        }

        ProtectionPlanInfo plan = getByAccountPk(accountPk);
        if (plan != null && ProtectionPlanStatus.COMPLETED.equals(plan.getStatus())
            && (plan.getAlreadyCovered() || plan.getOptIn())) {
            eligibility.setOfferProtectionPlan(false);
            logger.createActivityLog(account.getPk(), LogType.INTERNAL, null, null,
                "Already enrolled in protection plan", ThreadAttributes.getUsername());
            return eligibility;
        }

        if (plan == null) {
            plan = new ProtectionPlanInfo(accountPk, false, null, null,null);
        }
        plan = checkAndSetAccountCoverage(plan, accountPk);
        eligibility.setOfferProtectionPlan(!plan.getAlreadyCovered());
        return eligibility;
    }

    private ProtectionPlanInfo checkAndSetAccountCoverage(ProtectionPlanInfo plan, long accountPk) {

        SvSqlConfig configEntry = sqlConfigService.getSqlConfigBySqlName(SQL_FIND_ACTIVE_PLAN_ACCOUNTS);
        String sql = configEntry.getSqlConfigInfo().getSqlQuery();
        log.info("[AccountProtectionPlanService][checkAndSetAccountCoverage] Account: {} SQL: {}", plan.getAccountPk(), sql);
        Query query = entityManager.createNativeQuery(sql, Tuple.class)
            .setParameter("accountPk", plan.getAccountPk());
        List<Tuple> resultList = query.getResultList();

        Tuple activeProtectionPlanAccount = resultList.isEmpty() ? null : resultList.get(0);
        if (activeProtectionPlanAccount != null) {
            for (TupleElement<?> element : activeProtectionPlanAccount.getElements()) {
                log.info("[AccountProtectionPlanService] Column: {}, Value: {}", element.getAlias(), activeProtectionPlanAccount.get(element.getAlias()));
            }
            Long coveredByAccountPk = activeProtectionPlanAccount.get("accountPk") != null ? ((Number) activeProtectionPlanAccount.get("accountPk")).longValue() : null;
            plan.setCoveredByAccountPk(String.valueOf(coveredByAccountPk));
            plan.setAlreadyCovered(true);
            plan.setStatus(ProtectionPlanStatus.COMPLETED);
            plan.setEnrollmentDate(LocalDate.now());
            plan.setCustomerId((String)activeProtectionPlanAccount.get("customerId"));
            plan.setPolicyId((String)activeProtectionPlanAccount.get("policyId"));
            plan.setOrderId((String)activeProtectionPlanAccount.get("orderId"));

            String logMessage = String.format(
                "Account %d is already covered under an active protection plan with same email (Account PK: %d, Email: %s).",
                plan.getAccountPk(), coveredByAccountPk, activeProtectionPlanAccount.get("emailAddress"));

            log.info("[AccountProtectionPlanService][checkAndSetAccountCoverage] {}", logMessage);
            logger.createActivityLog(accountPk, LogType.INTERNAL, null, null, logMessage, ThreadAttributes.getUsername());
        }else{
            logger.createActivityLog(accountPk, LogType.INTERNAL, null, null,
                "No protection plan on this account: Offering protection plan", ThreadAttributes.getUsername());
        }

        return updateProtectionPlan(plan);
    }
}

public class SvcAccountController {
    private final SvAccountService accountService;

    private final ChangeAccountStatusService changeAccountStatusService;

    private final SvCustomerService customerService;

    private final SearchService searchService;

    private final EmploymentService employmentService;

    private final BankAccountService bankAccountService;

    private final PhoneService phoneService;

    private final EmailService emailService;

    private final AddressService addressService;

    private final SvAlertService alertService;

    private final AccountSummaryService accountSummaryService;

    private final CustomerVerificationService customerVerificationService;

    private final TrustpilotService trustpilotService;

    private final ImportHelper importHelper;

    private final CancelAccountService cancelAccountService;

    private final ThirdPartyContactService thirdPartyContactService;

    private final PortalInvitationService portalInvitation;

    private final PayOffAmountService payOffAmountService;

    private final ServicingInformationService servicingInformationService;

    private final ChangeFrequencyService changeFrequencyService;

    @PostMapping("/getAccountsByCriteria")
    public SearchResults<SearchResult> getAccountsByCriteria(@RequestBody AccountSearchFilter accountsSearchFilter){
        return searchService.getAccountsByCriteria(accountsSearchFilter);
    }

    @GetMapping("/simpleSearch/{searchString}")
    public SearchResults<SearchResult> searchForAccount(@PathVariable(name = "searchString") @NotBlank String searchString
        ,@RequestParam(required = false) String searchType
        ,@RequestParam(name = "pageNumber") Integer pageNumber
        ,@RequestParam(name = "maxResults") Integer maxResults){
        return searchService.getSimpleSearchResults(searchString, searchType, pageNumber, maxResults, SystemSource.SVC);
    }

    @GetMapping("/getAccountData/{accountPk}")
    public Object getAccountData(@PathVariable @Positive(message = "Please provide a valid account number") long accountPk) {
        return accountService.getAccountData(accountPk);
    }

    @GetMapping("/getServicingInfo/{accountPk}")
    public ServicingInformation getServicingInfoForAccount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk")  long accountPk){
        return servicingInformationService.getServicingInfoForAccount(accountPk);
    }
    @PostMapping("/createOrUpdateServicingInfo")
    public ServicingInformation createOrUpdateServicingInfo(@RequestBody ServicingInformation servicingInformation){
        return servicingInformationService.updateServicingInfo(servicingInformation);
    }

    @GetMapping("/getPrimaryCustomerInfo/{accountPk}")
    public CustomerInformation getPrimaryCustomerInfo(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return customerService.getPrimaryCustomerInfoForAccount(accountPk);
    }

    @PostMapping("/createOrUpdatePrimaryCustomerInfo")
    public CustomerInformation createOrUpdatePrimaryCustomerInfo(@RequestBody@NonNull CustomerInformation primaryCustomerInformation){
        return customerService.createOrUpdatePrimaryCustomerInfo(primaryCustomerInformation);
    }

    @GetMapping("/getPrimaryCustomerContactInfo/{accountPk}")
    public ContactInformation getPrimaryCustomerContactInfo(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return customerService.getPrimaryCustomerContactInfoForAccount(accountPk);
    }

    @PostMapping(value = "/createOrUpdatePrimaryCustomerContactInfo")
    public ContactInformation createOrUpdatePrimaryCustomerContactInfo(@RequestBody@NonNull ContactInformation primaryContactInformation){
        return customerService.createOrUpdatePrimaryCustomerContactInfo(primaryContactInformation);
    }

    @GetMapping("/getFinancialInfo/{accountPk}")
    public FinancialInformation getFinancialInfoForAccount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return accountService.getFinancialInfoForAccount(accountPk);
    }

    @GetMapping("/getAccountSummary/{accountPk}")
    public AccountSummary getAccountSummaryForAccount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return accountSummaryService.getAccountSummaryForAccount(accountPk);
    }

    @GetMapping("/getPayoffAmount/{accountPk}")
    public BigDecimal getPayoffAmount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk) {
        return payOffAmountService.getPayOffAmount(accountPk).getEpoBalance();
    }

    @GetMapping("/getAccountSummaryForRefAccount/{refAccountId}")
    public AccountSummary getAccountSummaryForRefAccount(@PathVariable(name = "refAccountId")@Positive(message = "Please provide valid ref account Id") long refAccountId){
        return accountSummaryService.getAccountSummaryForRefAccount(refAccountId);
    }

    @GetMapping("/getTransactions/{accountPk}")
    public List<TransactionDto> getTransactions(
        @PathVariable(name = "accountPk") @Positive(message = "Please provide valid account pk") long accountPk) {
        return accountService.getTransactions(accountPk);
    }

    @GetMapping("/getScheduledPayments/{accountPk}")
    public ScheduledPaymentsInformation getScheduledPayments(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return accountService.getScheduledPayments(accountPk);
    }

    @PostMapping("/createOrUpdateAccountInfo")
    public AccountInfo createOrUpdateAccountInfo(@RequestBody @NonNull AccountInfo accountInfo) {
        return accountService.createOrUpdateAccountInfo(accountInfo);
    }

    @PostMapping("/changeAccountStatus")
    public ResponseEntity<ChangeAccountStatusResponse> changeAccountStatus(@RequestBody @NonNull ChangeAccountStatusRequest request) {
        ChangeAccountStatusResponse response = changeAccountStatusService.changeAccountStatus(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cancelAccount")
    public AccountInfo cancelAccount(@RequestBody @NonNull CancelAccountRequest cancelAccountRequest) {
        return cancelAccountService.cancelAccount(cancelAccountRequest);
    }

    @PostMapping("/toggleAlerts/{accountPk}/{showAlerts}")
    public AccountInfo toggleAlertsForAccount(@PathVariable(name = "accountPk") @Positive(message = "Please provide a valide account pk") long accountPk,
                                @PathVariable(name = "showAlerts") boolean showAlerts) {
        return accountService.toggleAlertsForAccount(accountPk, showAlerts);
    }

    @GetMapping("/getAccountInfo/{accountPk}")
    public AccountInfo getAccountInfo(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk) {
        return accountService.getAccountInfoForAccount(accountPk);
    }

    @PostMapping("/createOrUpdateEmployment")
    public SvEmployment createOrUpdateEmployment(@RequestBody @NonNull EmploymentInfo employmentInfo){
        return employmentService.createOrUpdateEmployment(employmentInfo);
    }

    @GetMapping("/getEmployment/{accountPk}")
    public SvEmployment getEmployment(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return employmentService.getPrimaryEmploymentByAccountPK(accountPk);
    }

    @PostMapping("/createOrUpdateBankAccount")
    public SvBankAccount createOrUpdateBank(@RequestBody @NonNull BankAccountInfo bankAccountInfo) {
        SvBankAccount bankAccount = bankAccountService.createOrUpdateBankAccount(bankAccountInfo);
        accountService.handleBankAccountUpdate(bankAccountInfo.getAccountPk(), false, null);
        return bankAccount;
    }

    @GetMapping("/getBankAccounts/{accountPk}")
    public List<SvBankAccount> getBankAccounts(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return bankAccountService.getActiveBankAccountByAccountPk(accountPk);
    }

    @PostMapping("/removeBankAccount")
    public void removeBankAccount(@RequestBody BankAccountInfoRequest bankAccountInfoRequest){
        bankAccountService.deleteBankAccount(bankAccountInfoRequest.getBankAccountInfo());
        accountService.handleBankAccountUpdate(bankAccountInfoRequest.getAccountPk(), false, null);
    }

    @PostMapping("/removeBankAccounts")
    public void removeBankAccounts(@RequestBody List<Long> baPks) {
        List<SvBankAccount> deletedAccounts = bankAccountService.deleteBankAccounts(baPks);
        accountService.handleBankAccountUpdate(deletedAccounts.get(0).getBankAccountInfo().getAccountPk(), true, null);
    }

    @PostMapping("updateBankruptStatus")
    public SvAccount updateBankruptStatus(@RequestBody @NonNull AccountInfo accountInfo){
        return accountService.updateBankruptStatus(accountInfo);
    }

    @PostMapping("/createOrUpdateEmail")
    public SvEmail createOrUpdateEmail(@RequestBody @NonNull EmailInfo emailInfo){
        return emailService.createOrUpdate(emailInfo);
    }

    @PostMapping("/createOrUpdatePhone")
    public SvPhone createOrUpdatePhone(@RequestBody @NonNull PhoneInfo phoneInfo){
        return phoneService.createOrUpdatePhone(phoneInfo);
    }

    @PostMapping("/updateDnc")
    public SvPhone updateDnc(@RequestBody @NonNull PhoneInfo phoneInfo){
        return phoneService.updateDnc(phoneInfo);
    }

    @PostMapping("/updateDnt")
    public SvPhone updateDnt(@RequestBody @NonNull PhoneInfo phoneInfo){
        return phoneService.updateDnt(phoneInfo);
    }

    @PostMapping("/createOrUpdateAddress")
    public SvAddress createOrUpdateAddress(@RequestBody @NonNull AddressInfo addressInfo){
        return addressService.createOrUpdateAddress(addressInfo);
    }

    //ALERTS
    @GetMapping("/getAlertsForAccount/{accountPk}")
    public List<SvAlert> getAlertsForLead(@PathVariable(name = "accountPk") long accountPk){
        return alertService.getActiveAlertsForAccount(accountPk);
    }

    @PostMapping("/createOrUpdateAlert")
    public SvAlert createOrUpdateAlert(@RequestBody AlertInfo alertInfo){
        return alertService.createOrUpdate(alertInfo);
    }

    @GetMapping("/getInvoiceInfo/{accountPk}")
    public InvoiceInformation getInvoiceInfo(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        return accountService.getInvoiceInformation(accountPk);
    }

    @GetMapping("/removeItemsOnAccount/{accountPk}")
    public void removeItemsOnAccount(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
        accountService.removeItemsOnAccount(accountPk);
    }

    @GetMapping("/getSchedSummaryForAccount/{accountPk}")
    public SvSchedSummary getSchedSummaryForAccount(@PathVariable(name = "accountPk")@Positive(message = "Please provaide valid accountpk") long accountPk) {
        return accountService.getSchedSummaryForAccount(accountPk);
    }

    @PostMapping("/changePaymentFrequency")
    public SvSchedSummary changePaymentFrequency(@RequestBody @NonNull ChangeFrequencyRequest request) {
        return changeFrequencyService.changePaymentFrequency(request);
    }
    @PostMapping("/saveCustomerVerification")
    public void saveCustomerVerification(@RequestBody CustomerVerificationData verificationData){
        customerVerificationService.create(verificationData);
    }

    @DeleteMapping("/deleteAccount/{accountPk}")
    public void deleteAccount(@PathVariable("accountPk") @Positive(message = "Please provide a valid account pk") long accountPk) {
        importHelper.deleteAccount(accountPk);
    }

    @GetMapping("/getProrateAmount/{accountPk}")
    public BigDecimal getProrateAmount(@PathVariable long accountPk, @RequestParam String onDate) {
        return accountService.getProrateAmountForReturn(accountPk, DateUtils.stringToLocalDate(onDate));
    }

    @GetMapping("/getRemainingApprovalAmount/{accountPk}")
    public RemainingApprovalAmountInfo getRemainingApprovalAmount(@PathVariable long accountPk) {
        return accountService.getRemainingApprovalAmount(accountPk);
    }

    @PostMapping("/sendTrustpilotInvitation/{accountPk}")
    public Boolean sendTrustpilotInvitation(@PathVariable(name = "accountPk") long accountPk) {
        return trustpilotService.createSvcInvitation(accountPk);
    }

    @PostMapping(value = "/sendCustomerPortalLink/{accountPk}")
    public ResponseEntity<SendCustomerPortalLinkResponse> sendCustomerPortalLink(@PathVariable(name = "accountPk") long accountPk) {
        SendCustomerPortalLinkResponse response = portalInvitation.sendCustomerPortalLink(accountPk);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getRatingLetters")
    public List<String> getRatingLetters() {
        return accountService.getRatingLetters();
    }

    @GetMapping("/getDistinctCompanies")
    public List<String> getDistinctCompanies() {
        return searchService.getDistinctCompanies();
    }

    @GetMapping(value = "/getThirdPartyContact/{accountPk}")
    public ContactDetails getThirdPartyContactInfo( @PathVariable(value = "accountPk") long accountPk) {
        return thirdPartyContactService.getThirdPartyInformation(accountPk);
    }

    @PostMapping(value = "/createOrUpdateThirdPartyContact")
    public ContactDetails createOrUpdateThirdPartyContactInfo(@RequestBody ContactDetails contactDetails ) {
        return thirdPartyContactService.createOrUpdateContactDetails(contactDetails);
    }
}

public class LosLeadController {
    private static final String MERCHANT_REF_CODES = "merchantRefCodes";

    private final LosLoggingService loggingService;

    private final SearchService searchService;

    private final SvCustomerService customerService;

    private final LosAddressService addressService;

    private final FinalizeApplicationService finalizeApplicationService;

    private final LosEmploymentService employmentService;

    private final LosBankAccountService bankAccountService;

    private final LosPhoneService losPhoneService;

    private final LosEmailService losEmailService;

    private final MerchantService merchantService;

    private final LeadService leadService;

    private final LeadFundingService leadFundingService;

    private final LosContractService contractService;

    private final LosToSvcImportService losToSvcImportService;

    private final LosCreditCardService ccService;

    private final LosAlertService alertService;

    private final LosSchedSummaryService schedSummaryService;

    private final LosCreditCardTransactionService losCCTransactionService;

    private final CCTransactionService ccTransactionService;

    private final UownStoredDocService storedDocService;

    private final LosInvoiceService losInvoiceService;

    private final LosItemService losItemService;

    private final ChangeLeadStatusService changeLeadStatusService;

    private final EsignRedirectService esignRedirectService;

    private final AddressVerificationService addressVerificationService;

    private final LeadModificationsService leadModificationsService;

    private final LeadRecordingService leadRecordingService;

    private final TrustpilotService trustpilotService;

    private final ChangeMerchantService changeMerchantService;

    private final ModifyInvoiceService modifyInvoiceService;

    private final AddLeaseService addLeaseService;

    private final StartProtectionPlanService startProtectionPlanService;

    private final CancelProtectionPlanService cancelProtectionPlanService;

    private final LosActivityLogsService losActivityLogsService;

    private final SendInvoiceService sendInvoiceService;

    private final ChangeApprovalAmountService changeApprovalAmountService;

    @ExceptionHandler({HttpMessageNotReadableException.class})
    public ResponseEntity<Object> handleInvalidDateFormat(HttpServletRequest request, RuntimeException thrownException) {
        // Handles exceptions thrown while jackson's object mapper fails to bind fields in the request
        // specifically handles an odd instance where the dateOfBirth field of /createOrUpdatePrimaryCustomerContactInfo
        // is being sent as a 4-digit number instead of a string of form "yyyy-MM-dd"
        HashMap<String, Object> responseBody = new HashMap<>();
        responseBody.put("message", thrownException.getMessage());
        responseBody.put("status", 500);
        if (thrownException.getMessage().contains("java.time.LocalDate")) responseBody.put("message", "Invalid date format: Try again using the form \"yyyy-MM-dd\" like \"1969-07-20\"");
        return new ResponseEntity<>(responseBody, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @PostMapping("/simpleSearch/{searchString}")
    public SearchResults<SearchResult> searchForAccount(@PathVariable(name = "searchString") @NotBlank String searchString
        , @RequestParam(required = false) String searchType
        , @RequestParam(name = "pageNumber") Integer pageNumber
        , @RequestParam(name = "maxResults") Integer maxResults
        , @RequestBody FilterRequest merchantRefCodes){
        return searchService.getSimpleSearchResults(searchString, searchType, pageNumber, maxResults, SystemSource.LOS);
    }

    @GetMapping("/getLeadInfo/{leadPk}")
    public LeadInfo getLeadInfo(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return leadService.getByLeadPk(leadPk).getLeadInfo();
    }

    @PostMapping(value = "/getLeadsByCriteria", consumes = { MediaType.APPLICATION_JSON_VALUE }, produces = { MediaType.APPLICATION_JSON_VALUE })
    public SearchResults<GetLeadsByCriteriaResult> getLeadsByCriteria(@RequestBody GetLeadsByCriteriaFilter filters){
        return searchService.getLeadsByCriteria(filters);
    }

    @GetMapping("/getPrimaryCustomerInfo/{leadPk}")
    public ResponseEntity<CustomerInformation> getPrimaryCustomerInfo(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return customerService.getPrimaryCustomerInfoForLead(leadPk);
    }

    @PostMapping("/createOrUpdatePrimaryCustomerInfo")
    public CustomerInformation createOrUpdatePrimaryCustomerInfo(@RequestBody@NonNull CustomerInformation primaryCustomerInformation){
        return customerService.createOrUpdatePrimaryCustomerInfoForLead(primaryCustomerInformation);
    }

    @GetMapping("/getPrimaryCustomerContactInfo/{leadPk}")
    public ResponseEntity<ContactInformation> getPrimaryCustomerContactInfo(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return customerService.getPrimaryCustomerContactInfoForLead(leadPk);
    }

    @PostMapping(value = "/createOrUpdatePrimaryCustomerContactInfo")
    public ContactInformation createOrUpdatePrimaryCustomerContactInfo(@RequestBody@NonNull ContactInformation primaryContactInformation){
        return customerService.createOrUpdatePrimaryCustomerContactInfoForLead(primaryContactInformation);
    }

    @GetMapping("/getFinancialInfo/{leadPk}")
    public FinancialInformation getFinancialInfoForLead(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return leadService.getFinancialInfoForLead(leadPk);
    }

    @GetMapping("/getScheduledPayments/{leadPk}")
    public ScheduledPaymentsInformation getScheduledPayments(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return leadService.getScheduledPayments(leadPk);
    }

    @GetMapping("/getMerchantInfo/{leadPk}")
    public MerchantInfo getMerchantInfo(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return merchantService.getMerchantByLeadPk(leadPk).getMerchantInfo();
    }

    @GetMapping("/getInvoiceInfo/{leadPk}")
    public InvoiceInformation getInvoiceInfo(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return leadService.getInvoiceInformation(leadPk);
    }

    @PostMapping("/createOrUpdateInvoice")
    public LosInvoice createOrUpdateInvoice(@RequestBody @NonNull InvoiceInfo invoiceInfo){
        return losInvoiceService.createOrUpdate(invoiceInfo);
    }

    @PostMapping("/createOrUpdateItem")
    public LosItem createOrUpdateItem(@RequestBody @NonNull ItemInfo itemInfo){
        return losItemService.createOrUpdateItem(itemInfo);
    }

    @GetMapping(value = "/getFinalApprovalDetails/{leadPk}", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public FinalizeApplication getFinalApprovalDetails(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk) {
        return finalizeApplicationService.getFinalApprovalDetails(leadPk);
    }

    @PostMapping("/createOrUpdateInvoiceInformation")
    public InvoiceInformation createOrUpdateInvoiceInformation(@RequestBody @NonNull InvoiceInformation invoiceInformation){
        return sendInvoiceService.createOrUpdate(invoiceInformation);
    }

    @GetMapping("/getContracts/{leadPk}")
    public List<LosContract> getContracts(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return contractService.getAllContractsForLead(leadPk);
    }

    @PostMapping("/createOrUpdateEmployment")
    public LosEmployment createOrUpdateEmployment(@RequestBody @NonNull EmploymentInfo employmentInfo){
        return employmentService.createOrUpdateEmployment(employmentInfo);
    }

    @GetMapping("/getEmployment/{leadPk}")
    public LosEmployment getEmployment(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return employmentService.getPrimaryEmploymentByLeadPk(leadPk);
    }

    @PostMapping("/createOrUpdateBankAccount")
    public LosBankAccount createOrUpdateBank(@RequestBody @NonNull BankAccountInfo bankAccountInfo){
        return bankAccountService.createOrUpdateBankAccount(bankAccountInfo);
    }

    @GetMapping("/getBankAccounts/{leadPk}")
    public List<LosBankAccount> getBankAccounts(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return bankAccountService.getAllBankAccountsForLead(leadPk);
    }

    @PostMapping("/createOrUpdateEmail")
    public LosEmail createOrUpdateEmail(@RequestBody @NonNull EmailInfo emailInfo){
        return losEmailService.createOrUpdate(emailInfo);
    }

    @PostMapping("/createOrUpdatePhone")
    public LosPhone createOrUpdatePhone(@RequestBody @NonNull PhoneInfo phoneInfo){
        return losPhoneService.createOrUpdatePhone(phoneInfo);
    }

    @PostMapping("/createOrUpdateAddress")
    public LosAddress createOrUpdateAddress(@RequestBody @NonNull AddressInfo addressInfo){
        return addressService.createOrUpdateAddress(addressInfo);
    }

    @PostMapping("/createOrUpdateCCInfo")
    public LosCreditCard createOrUpdateCCInfo(@RequestBody @NonNull CCInfo ccInfo){
        return (LosCreditCard) ccTransactionService.createOrUpdate(ccInfo);
    }

    @GetMapping("/getSchedSummary/{leadPk}")
    public LosSchedSummary getSchedParams(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid lead pk") long leadPk){
        return schedSummaryService.getSchedSummaryByLead(leadPk);
    }

    @PostMapping(value = "/getLeadsForFundingQueue")
    public FundingQueueResponse getLeadsForFundingQueue(@RequestBody FundingQueueFilters filters) {
        return leadFundingService.getLeadsForFundingQueue(filters);
    }

    @PostMapping(value = "/getModifiedLeads")
    public LeadModificationResults getModifiedLeads(@RequestBody LeadModInfoRequest leadModInfoRequest) {
        return leadModificationsService.findAllBySearchDetails(leadModInfoRequest);
    }

    @GetMapping(value = "/getLeadModificationTypes")
    public List<ModType> getLeadModificationTypes() {
        return leadModificationsService.getLeadModificationTypes();
    }

    @GetMapping(value = "/getAllMerchants")
    public List<Merchant> getAllMerchants(){
        return merchantService.getAllMerchants();
    }

    @GetMapping(value = "/getAllActiveMerchants")
    public List<Merchant> getAllActiveMerchants() {
        return merchantService.getAllActiveMerchants();
    }

    @GetMapping(value = "/getAllAvailableMerchants")
    public List<Merchant> getAllAvailableMerchants() {
        return merchantService.getAllAvailableMerchants();
    }

    @PostMapping(value = "/getMerchantsByRefCode")
    public List<Merchant> getMerchantsByRefCode(@RequestBody Map<String, String> merchantRefCodes){
        return merchantService.getMerchantsByRefCode(merchantRefCodes.getOrDefault(MERCHANT_REF_CODES, null));
    }

    @PostMapping(value = "/getBasicMerchantInfoByRefCode")
    public List<BasicMerchantInfo> getBasicMerchantInfoByRefCode(@RequestBody Map<String, String> merchantRefCodes) {
        return merchantService.getBasicMerchantInfoByRefCode(merchantRefCodes.getOrDefault(MERCHANT_REF_CODES,  null));
    }

    @PostMapping(value = "/getLeadFilterOptions")
    public Map<String, Object> getLeadFilterInfo(@RequestBody Map<String, String> merchantRefCodes) {
        List<ClientType> clientType = merchantService.getAllClientTypes();
        List<BasicMerchantInfo> merchantInfos = merchantService.getBasicMerchantInfoByRefCode(merchantRefCodes.getOrDefault(MERCHANT_REF_CODES, null));
        List<LeadStatus> internalStatuses = leadService.getAllInternalStatuses();
        Map<String, Object> result = new HashMap<>();
        result.put("clientType", clientType);
        result.put(MERCHANT_REF_CODES, merchantInfos);
        result.put("internalStatus", internalStatuses);
        return result;
    }

    @GetMapping(value = "/getAllMerchantNames")
    public List<String> getAllMerchantNames(){
        return merchantService.getAllMerchantNames();
    }

    @GetMapping(value = "/getAllClientTypes")
    public List<ClientType> getAllClientTypes() {
        return merchantService.getAllClientTypes();
    }

    @GetMapping(value = "/getAllInventoryCategories")
    public List<String> getAllInventoryCategories() {
        return merchantService.getAllInventoryCategories();
    }

    @GetMapping(value = "/getAllLeadStatuses")
    public List<LeadStatus> getAllLeadStatuses() {
        return leadService.getAllLeadStatuses();
    }

    @GetMapping(value = "/getAllInternalStatuses")
    public List<LeadStatus> getAllInternalStatuses() {
        return leadService.getAllInternalStatuses();
    }

    @PostMapping("createOrUpdateFinancialInfo")
    public FinancialUpdate createOrUpdateFinancialInfo(@RequestBody @NonNull FinanceInfo financeInfo){
        return leadService.createOrUpdateFinancialInfo(financeInfo);
    }

    @PostMapping(value = "/getLocationNamesByMerchant")
    public List<String> getLocationNamesByMerchant(@RequestBody @NonNull List<String> merchantNames){
        return merchantService.getLocationNamesByMerchant(merchantNames);
    }

    @PostMapping(value = "/updateFundingStatus")
    public void updateFundingStatus(@RequestBody FundingStatusRequest fundingStatusRequest){
        leadFundingService.updateFundingStatus(fundingStatusRequest);
    }

    @PostMapping(value="/importToServicing/{leadPK}")
    public Long importToServicing(@PathVariable(name = "leadPK")@Positive(message = "Please provide valid lead pk")  long leadPK,
                                  @RequestParam(name = "comment", required = false) String comment){
        return leadFundingService.importToServicing(leadPK, true, comment);
    }

    @GetMapping(value = "/getEsignRedirectUrlByLead/{leadPK}/{event}")
    public EsignRedirectInfo getEsignRedirectUrlByLead(@PathVariable(name = "leadPK")@Positive(message = "Please provide valid lead pk")  long leadPK, @PathVariable(name = "event") String eventTriggered){
        return esignRedirectService.getEsignRedirectUrlByLeadPk(leadPK, eventTriggered);
    }

    //LOGS
    @PostMapping("/getLogsForLead/{leadPk}")
    public Page<LosActivityLog> getLogsForLead(@PathVariable("leadPk") long leadPk,
            @RequestBody FilterRequestPage filterRequest) {
        List<String> merchantReferenceCodes = ThreadAttributes.getMerchantReferenceCodes();
        Page<LosActivityLog> activityLogs = losActivityLogsService.getAllActivityLogForLead(
                leadPk, filterRequest, merchantReferenceCodes);
        Collection<LogType> availableLogTypeOptions = losActivityLogsService.getActivityLogTypesForLead(
                leadPk, merchantReferenceCodes);
        return new PageWithEnumFilters<>(activityLogs, Map.of("logTypes", availableLogTypeOptions));
    }

    @PostMapping("/createOrUpdateLog")
    public LosActivityLog createOrUpdateLog(@RequestBody ActivityLogInfo activityLogInfo){
        if (activityLogInfo.getLogType() == LogType.REVIEW) {
            activityLogInfo.setCreationSource(LogCreationSource.USER_ACTION);
        } else {
            activityLogInfo.setCreationSource(LogCreationSource.MANUAL_ENTRY);
        }
        return loggingService.createOrUpdateActivityLog(activityLogInfo);
    }

    //ALERTS
    @GetMapping("/getAlertsForLead/{leadPk}")
    public List<LosAlert> getAlertsForLead(@PathVariable(name = "leadPk") long leadPk){
        return alertService.getActiveAlertsForLead(leadPk);
    }

    @GetMapping("/getAllAlerts")
    public Page<LosAlert> getAllAlerts(@RequestParam(required = false, defaultValue = "") String message,
                                       @RequestParam() @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                                       @RequestParam() @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
                                       Pageable pageable){
        return alertService.getAllActiveAlerts(message, from, to, pageable);
    }

    @PostMapping("/createOrUpdateAlert")
    public LosAlert createOrUpdateAlert(@RequestBody AlertInfo alertInfo){
        return alertService.createOrUpdate(alertInfo);
    }

    @GetMapping("/getCreditCards/{leadPk}")
    public List<LosCreditCard> getCreditCards(@PathVariable long leadPk){
        return ccService.getByLeadPk(leadPk);
    }

    @GetMapping("/getAutopayCreditCard/{leadPk}")
    public LosCreditCard getAutopayCreditCard(@PathVariable long leadPk) {
        return ccService.getAutoPayByLeadPk(leadPk);
    }

    @GetMapping("/getCCTransactions/{leadPk}")
    public List<LosCreditCardTransaction> getCCTransactions(@PathVariable long leadPk){
        return losCCTransactionService.getCreditCardTransactions(leadPk);
    }

    @PostMapping(value = "/resendLease/{leadPk}")
    public void resendLease(@PathVariable(name = "leadPk") long leadPk, @RequestParam String emailAddress) {
        storedDocService.resendLeaseForLead(leadPk, emailAddress);
    }

    @PostMapping(value = "/resendStoredDoc/{storedDocumentPk}")
    public void resendStoredDoc(@PathVariable(name = "storedDocumentPk") long storedDocumentPk, @RequestParam String emailAddress) {
        storedDocService.resendStoredDocForAccount(storedDocumentPk, emailAddress);
    }

    @PostMapping(value = "/changeLeadStatus")
    public LeadStatusChangeResponse changeLeadStatus(@RequestBody LeadStatusChangeRequest request){
        return changeLeadStatusService.changeLeadStatus(request);
    }

    @PostMapping(value = "/modifyInvoiceForLead/{leadPk}")
    public ModifyInvoiceResponse modifyInvoiceForLead(@PathVariable(name = "leadPk") long leadPk){
        return modifyInvoiceService.modifyInvoice(leadPk);
    }

    @PostMapping(value = "/overrideApprovalAmount")
    public LeadApprovalAmountOverrideResponse overrideApprovalAmount(@RequestBody LeadApprovalAmountOverrideRequest request) {
        return changeApprovalAmountService.overrideApprovalAmount(request);
    }

    @PostMapping(value = "/changeMerchant")
    public ChangeMerchantResponse changeMerchantForLead(@RequestParam(value = "leadPk") long leadPk, @RequestParam(value = "merchantPk") long merchantPk) {
        return changeMerchantService.changeMerchant(leadPk, merchantPk);
    }

    @PostMapping(value = "/updateBankruptcyInfo")
    public LeadInfo updateBankruptcyInfo(@RequestBody LeadInfo leadInfo) {
        return leadService.updateBankruptcyInfo(leadInfo);
    }

    @PostMapping(value = "/toggleAlerts/{leadPk}/{showAlerts}")
    public LeadInfo toggleAlertsForLead(@PathVariable(value = "leadPk")@Positive(message = "Please provide a valid lead pk") long leadPk,
                                        @PathVariable(value = "showAlerts") boolean showAlerts) {
        return leadService.toggleAlertsForLead(leadPk, showAlerts);
    }

    @GetMapping(value = "/merchantRefCodeExists/{merchantRefCode}")
    public boolean checkMerchantRefCodeExists(@PathVariable(name = "merchantRefCode") String merchantRefCode) {
        return merchantService.checkMerchantRefCodeExists(merchantRefCode);
    }

    @PostMapping(value = "/runMelissaData")
    public AddressVerification runMelissaData(@RequestBody AddressInfo addressInfo) {
        return addressVerificationService.runMelissaData(addressInfo);
    }

    @GetMapping(value = "/findMelissaDataByLead/{leadPk}")
    public AddressVerification findByLeadPk(@PathVariable(name = "leadPk") long leadPk) {
        return addressVerificationService.getByLeadPk(leadPk);
    }

    @PostMapping("/sendBankVerificationDecline/{leadPk}")
    public void sendBankVerificationDeclinedEmail(@PathVariable(name = "leadPk")@Positive(message = "Please provide valid leadPk") long leadPk) {
        leadService.sendBankVerificationDeclinedEmail(leadPk);
    }

    @PostMapping("/sendFundingReport")
    public String sendFundingReport(@RequestBody FundingReportRequest request) {
        AtomicReference<String> error = new AtomicReference<>("Errors in sendFundingReport:\n");
        leadService.sendFundingReport(request.getMerchantPks(), request.getFrequency(), error);
        return error.get();
    }

    @PostMapping("/getMerchantRebateAmount")
    public MerchantRebateResults getMerchantRebateAmount(@RequestBody MerchantRebateRequest request) {
        return leadService.getRebateAmount(request);
    }

    @PostMapping("/addNewLease")
    public InvoiceInformation addLease(@RequestBody InvoiceInformation invoiceInformation) {
        return addLeaseService.addLease(invoiceInformation);
    }

    @GetMapping(value = "/getRecordingInfoForLead/{leadPk}")
    public List<LeadRecording> getRecordingInfoForLead(@PathVariable("leadPk") long leadPk) {
        return leadRecordingService.findByLeadPk(leadPk);
    }

    @PostMapping(value = "/storeRecordingInfo")
    public void storeRecordingInfo(@RequestBody RecordingInfo recordingInfo) {
        leadRecordingService.storeRecordingInfo(recordingInfo);
    }
    @PostMapping("/sendTrustpilotInvitation/{leadPk}")
    public Boolean sendTrustpilotInvitation(@PathVariable(name = "leadPk") long leadPk) {
        return trustpilotService.createLosInvitation(leadPk);
    }

    @PostMapping("/refreshTrustpilotAccessKey")
    public String refreshTrustpilotAccessKey() {
        return trustpilotService.refreshAccessToken();
    }

    @GetMapping("/getLastThreeCCTransactions/{leadPk}")
    public List<LosCreditCardTransaction> getLastThreeCCTransactionsForLead(@PathVariable long leadPk) {
        return ccTransactionService.getLastThreeCCTransactionsForLead(leadPk);
    }

    @GetMapping(value = "/getLeadStatus")
    public Map<String, String> getLeadStatus() {
        return leadService.leadStatusToMap();
    }

    @PostMapping(value = "/blackListAllItemsForLead")
    public void createOrUpdateBlackListItem(@RequestParam(value = "leadPk") long leadPk) {
        leadService.blackListAllItemsForLead(leadPk);
    }

    @PostMapping(value = "/initiateProtectionPlanOnLeads")
    public List<ProtectionPlanInfo> initiateProtectionPlanOnLeads(@RequestParam(value = "leadPks") String leadPks) {
        return startProtectionPlanService.initiateProtectionPlanOnLeads(leadPks);
    }

    @PostMapping(value = "/cancelProtectionPlanOnLead")
    public ProtectionPlanInfo cancelProtectionPlanOnLead(@RequestParam(value = "leadPk") long leadPk) {
        return cancelProtectionPlanService.cancelProtectionPlan(leadPk);
    }
}

public class CustomerPortalController {

    private final SvCustomerService customerService;

    private final PaymentService paymentService;

    private final CorrespondenceTrackingService correspondenceTrackingService;

    private final SupportTicketService supportTicketService;

    @PostMapping(value="/authenticateCustomer")
    public CustomerLoginResult authenticateCustomer(@RequestBody @NonNull CustomerLoginRequest customerLoginRequest){
        return customerService.authenticateCustomer(customerLoginRequest);
    }

    @PostMapping(value="/sendVerificationCode/{phoneOrEmail}")
    public void sendVerificationCode(@PathVariable String phoneOrEmail, @RequestParam(name = "company") Company company){
        customerService.sendVerificationCode(phoneOrEmail, company);
    }

    @PostMapping(value="/verifyCode/{phoneOrEmail}/{code}")
    public CustomerLoginResult verifyCode(@PathVariable(name = "phoneOrEmail") String phoneOrEmail, @PathVariable(name = "code") String code){
        return customerService.verifyCode(phoneOrEmail, code);
    }
    @GetMapping(value="/getAllCustomerPayments/{accountPk}")
    public List<CustomerPayment> getAllCustomerPayments(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk")  long accountPk){
        return paymentService.getAllCustomerPaymentsForAccount(accountPk);
    }

    @PostMapping(value="/createOrUpdateCustomerPayment")
    public CustomerPayment createOrUpdateCustomerPayment(@RequestBody CustomerPayment customerPayment){
        return paymentService.createOrUpdateCustomerPayment(customerPayment);
    }

    @PostMapping(value="/createOrUpdateCorrespondenceTracking")
    public void createOrUpdateCorrespondenceTracking(@RequestBody CorrespondenceTrackingInfo info) {
        correspondenceTrackingService.createOrUpdate(info);
    }

    @GetMapping("/getZendeskEmailCategories")
    public List<SupportTicketService.CategoryDTO> getZendeskEmailCategories() {
        return supportTicketService.getZendeskEmailCategories();
    }

    @PostMapping("/submitSupportTicket")
    public ResponseEntity<Map<String, Object>> submitSupportTicket(
            @RequestBody @Valid SupportTicketRequest request) {
        try {
            supportTicketService.submitSupportTicket(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Support ticket submitted successfully"));
        } catch (SvcException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("[CustomerPortalController][submitSupportTicket] Unexpected error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "An unexpected error occurred. Please try again later."));
        }
    }

}

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

--
### Scenario 1
```markdown
- Given an active primary account exists with the provided phone number
- When a POST request is sent to /uown/tms/v1/accounts/search with the phone field filled
- Then the API should return status 200
- And the response should contain a list of AccountProfile
- And all returned records must have accountStatus ACTIVE
- And the customer data must include firstName, lastName, last4Ssn, dob, zip, phone, and email
```

![Screenshot_at_Feb_02_05-33-36](/uploads/c5f886c7a9d5789267b0711c63e2e623/Screenshot_at_Feb_02_05-33-36.png){width=780 height=600}
![Screenshot_at_Feb_02_05-34-02](/uploads/e367e2001cdfc43d596bc940faeb33a8/Screenshot_at_Feb_02_05-34-02.png){width=900 height=274}
![Screenshot_at_Feb_02_05-35-10](/uploads/96502e7c412d0c4c7ab803357f2a88c8/Screenshot_at_Feb_02_05-35-10.png){width=900 height=66}
![Screenshot_at_Feb_02_05-42-41](/uploads/e61aa01d582ba1631ee0a71fd7eeb777/Screenshot_at_Feb_02_05-42-41.png){width=900 height=65}
![Screenshot_at_Feb_02_05-42-54](/uploads/454f238d48018cd34f9d1970c1153ca5/Screenshot_at_Feb_02_05-42-54.png){width=900 height=81}
![Screenshot_at_Feb_02_05-43-07](/uploads/4300f7bb7d35e497c73220d1163a26e3/Screenshot_at_Feb_02_05-43-07.png){width=900 height=68}
![Screenshot_at_Feb_02_05-43-17](/uploads/9e4918cf2d9e98ecc6da19ffcabbfcf3/Screenshot_at_Feb_02_05-43-17.png){width=900 height=67}

**PASS**

---

### Scenario 2:
```markdown
- Given an active primary account exists with the provided last4SSN and date of birth
- When a POST request is sent to /uown/tms/v1/accounts/search with last4SSN and dob filled
- Then the API should return status 200
- And the response should contain a list of AccountProfile matching the given criteria
```

![Screenshot_at_Feb_02_06-25-46](/uploads/9105572201f12263cbba0bd45daa13d2/Screenshot_at_Feb_02_06-25-46.png){width=865 height=600}
![Screenshot_at_Feb_02_06-26-57](/uploads/bd6c82202d6a0fe37cc4735dc640342e/Screenshot_at_Feb_02_06-26-57.png){width=900 height=44}
![Screenshot_at_Feb_02_06-27-15](/uploads/9ab1eb18893b4c3a79af14cd32ceed44/Screenshot_at_Feb_02_06-27-15.png){width=900 height=437}
![Screenshot_at_Feb_02_06-27-47](/uploads/ae5526739145a6f6ef215ca889ff69d9/Screenshot_at_Feb_02_06-27-47.png){width=885 height=600}

**PASS**

---

### Scenario 3:
```markdown
- Given an active primary account matches the provided phone, last4SSN, and dob
- When a POST request is sent to /uown/tms/v1/accounts/search with all fields filled
- Then the API should return only accounts that match all non-null criteria
- And all returned accounts must be PRIMARY and ACTIVE
```

![Screenshot_at_Feb_02_06-46-27](/uploads/8845b67c29cc5d0cdb87957ed20703ca/Screenshot_at_Feb_02_06-46-27.png){width=867 height=600}

**PASS**

---

### Scenario 4:
```markdown
- When a POST request is sent to /uown/tms/v1/accounts/search without phone, last4SSN, and dob
- Then the API should return status 400
- And the response should contain a message stating that at least one identifier is required
```
![Screenshot_at_Feb_02_06-48-23](/uploads/bd20faf3f5ff19dda7f1a9a712362040/Screenshot_at_Feb_02_06-48-23.png){width=900 height=458}

**PASS**

---

### Scenario 5:
```markdown
- When a POST request is sent to /uown/tms/v1/accounts/search with phone set as blank
- And last4SSN and dob are not provided
- Then the API should return status 400
- And the response should indicate a parameter validation error
```
![Screenshot_at_Feb_02_06-49-04](/uploads/b516c6811606a2711433a182405a4ed5/Screenshot_at_Feb_02_06-49-04.png){width=898 height=471}
![Screenshot_at_Feb_02_06-49-44](/uploads/686db5c33238f6a56d9c47758e17d567/Screenshot_at_Feb_02_06-49-44.png){width=899 height=455}
![Screenshot_at_Feb_02_06-50-07](/uploads/50c2fd368fe5e337aacc8b07307b0a39/Screenshot_at_Feb_02_06-50-07.png){width=895 height=464}
![Screenshot_at_Feb_02_06-50-22](/uploads/a07a2ac13edffe0db552d8d166af708e/Screenshot_at_Feb_02_06-50-22.png){width=896 height=461}

**PASS**

---

### Scenario 6:
```markdown
- Given more than five active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 409
- And the response should contain the message "Too many accounts found"
- And the response body must contain status, error, message, and timestamp
```

![Screenshot_at_Feb_02_06-30-47](/uploads/29a03df05abcfba5c55ad44db7bafca9/Screenshot_at_Feb_02_06-30-47.png){width=900 height=218}
![Screenshot_at_Feb_02_06-31-07](/uploads/bc15b80e12cfac8a8937645a04b8cb75/Screenshot_at_Feb_02_06-31-07.png){width=898 height=446}

**PASS**

---

### Scenario 7:
```markdown
- Given exactly five active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the response should contain exactly five records in content
- And the size field should reflect the total number of results found
```

![Screenshot_at_Feb_02_08-15-17](/uploads/91af7c92b231a72256f2ca2c5d073434/Screenshot_at_Feb_02_08-15-17.png){width=828 height=600}
![Screenshot_at_Feb_02_08-15-27](/uploads/b49d07a3a03cf41d3d1418e36c840330/Screenshot_at_Feb_02_08-15-27.png){width=900 height=114}

**PASS**

---

### Scenario 8:
```markdown
- Given no active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the response should contain an empty list
- And the size field must be equal to zero
```

**PASS**

---

### Scenario 9:
```markdown
- Given multiple active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the size field must be greater than zero
- And the size field must represent the total number of accounts found in the system
- And the content list size must be less than or equal to five
```
    * The size field does not reflect the actual total number of accounts when there are more than 10 records, because the search is limited by a fixed pagination (PageRequest.of(0, 10)) and the validation relies on contents.size(). As a result, scenarios that expect size > 10 are not supported by the current implementation.
    
![Screenshot_at_Feb_02_06-56-24](/uploads/a20928a65118906421d2783523a2ccbf/Screenshot_at_Feb_02_06-56-24.png){width=896 height=460}
![Screenshot_at_Feb_02_06-56-56](/uploads/ec06a2110b2225133aa9c1880fd8543b/Screenshot_at_Feb_02_06-56-56.png){width=900 height=211}
![Screenshot_at_Feb_02_06-59-35](/uploads/ed696a791f003c6712feafb363b52449/Screenshot_at_Feb_02_06-59-35.png){width=899 height=453}
![Screenshot_at_Feb_02_06-59-43](/uploads/2c659e3bec163a0e35c9960a8516f744/Screenshot_at_Feb_02_06-59-43.png){width=900 height=355}
![Screenshot_at_Feb_02_08-12-25](/uploads/4a72e4615eab82ef02bbcfe408049f9a/Screenshot_at_Feb_02_08-12-25.png){width=900 height=371}
![Screenshot_at_Feb_02_08-12-37](/uploads/f0194baec7680b02fb6f3cfb2fae74c0/Screenshot_at_Feb_02_08-12-37.png){width=900 height=161}
![Screenshot_at_Feb_02_08-15-17](/uploads/2f1bec1523ade2b731cd4a8b18257af3/Screenshot_at_Feb_02_08-15-17.png){width=828 height=600}

**PASS**

---

### Scenario 10:
```markdown
- Given inactive accounts exist that match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API must not return accounts with status different from ACTIVE
```

**PASS**

---

### Scenario 11:
```markdown
- Given secondary customers exist associated with accounts
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return only accounts whose customer type is PRIMARY
```

**PASS**

---

### Scenario 12:
```markdown
- Given an active primary account is found
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And each item in the content list must not contain the totalResults field
```


**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

--
### Scenario 1:
```markdown
- Given an active primary account exists with the provided phone number
- When a POST request is sent to /uown/tms/v1/accounts/search with the phone field filled
- Then the API should return status 200
- And the response should contain a list of AccountProfile
- And all returned records must have accountStatus ACTIVE
- And the customer data must include firstName, lastName, last4Ssn, dob, zip, phone, and email
```

Screenshot

**PASS**

---

### Scenario 2:
```markdown
- Given an active primary account exists with the provided last4SSN and date of birth
- When a POST request is sent to /uown/tms/v1/accounts/search with last4SSN and dob filled
- Then the API should return status 200
- And the response should contain a list of AccountProfile matching the given criteria
```

Screenshot

**PASS**

---

### Scenario 3:
```markdown
- Given an active primary account matches the provided phone, last4SSN, and dob
- When a POST request is sent to /uown/tms/v1/accounts/search with all fields filled
- Then the API should return only accounts that match all non-null criteria
- And all returned accounts must be PRIMARY and ACTIVE
```

Screenshot

**PASS**

---

### Scenario 4:
```markdown
- When a POST request is sent to /uown/tms/v1/accounts/search without phone, last4SSN, and dob
- Then the API should return status 400
- And the response should contain a message stating that at least one identifier is required
```

Screenshot

**PASS**

---

### Scenario 5:
```markdown
- When a POST request is sent to /uown/tms/v1/accounts/search with phone set as blank
- And last4SSN and dob are not provided
- Then the API should return status 400
- And the response should indicate a parameter validation error
```

Screenshot

**PASS**

---

### Scenario 6:
```markdown
- Given more than five active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 409
- And the response should contain the message "Too many accounts found"
- And the response body must contain status, error, message, and timestamp
```

Screenshot

**PASS**

---

### Scenario 7:
```markdown
- Given exactly five active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the response should contain exactly five records in content
- And the size field should reflect the total number of results found
```

Screenshot

**PASS**

---

### Scenario 8:
```markdown
- Given no active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the response should contain an empty list
- And the size field must be equal to zero
```

Screenshot

**PASS**

---

### Scenario 9:
```markdown
- Given multiple active primary accounts match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And the size field must be greater than zero
- And the size field must represent the total number of accounts found in the system
- And the content list size must be less than or equal to five
```
    * The size field does not reflect the actual total number of accounts when there are more than 10 records, because the search is limited by a fixed pagination (PageRequest.of(0, 10)) and the validation relies on contents.size(). As a result, scenarios that expect size > 10 are not supported by the current implementation.

Screenshot

**PASS**

---

### Scenario 10:
```markdown
- Given inactive accounts exist that match the provided criteria
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API must not return accounts with status different from ACTIVE
```

Screenshot

**PASS**

---

### Scenario 11:
```markdown
- Given secondary customers exist associated with accounts
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return only accounts whose customer type is PRIMARY
```

Screenshot

**PASS**

---

### Scenario 12:
```markdown
- Given an active primary account is found
- When a POST request is sent to /uown/tms/v1/accounts/search
- Then the API should return status 200
- And each item in the content list must not contain the totalResults field
```

Screenshot

**PASS**

---
