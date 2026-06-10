---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/443

UOWN | SVC | Change DueDate for Level AI API

Priyanka Namburu
@pnamburu
1 semana atrás
Owner
POST /uown/tms/v1/accounts/{accountPk}/next-due-date-adjustments.
Request body record should have dueDate, offset
Response should have nextDueDate.
Add adjustmentType enum (NEXT_DUE_DATE, SCHEDULE_SHIFT) to DueDateMoveInfo. Default to SCHEDULE_SHIFT
Now, we have to modify SvAccountService.moveAllDueDatesByDays method
Move this method to it's own service : MoveDueDatesService
Right before this line, check if the adjustment type is SCHEDULE_SHIFT. If yes, call this
List<SvReceivable> movedDueDates = receivableService.moveAllDueDatesByDays(dueDateMoveInfo.getAccountPk(), dueDateMoveInfo.getMovedFromDueDate(), dueDateMoveInfo.getMovedByDays(), changeEpo);
else
receivableService.moveNextDueDate() --> This should locate all the receivables on the given date and move them by the number of days.
Set the adjustment type in the controller to NEXT_DUE_DATE

Priyanka Namburu
@pnamburu
1 semana atrás
Owner
@Operation( summary = "Move next due date", description = "Adjusts the next scheduled receivable due date forward or backward by a specified number of days and returns the updated next due date record." ) @ApiResponses(value = { @ApiResponse( responseCode = "200", description = "Successfully moved the next due date", content = @Content( mediaType = "application/json", schema = @Schema(implementation = NextDueDateRecord.class) ) ), @ApiResponse( responseCode = "400", description = "Invalid input (e.g., negative shift days, invalid account)", content = @Content( mediaType = "application/json", examples = @ExampleObject(value = "{"timestamp":"2026-02-02T12:00:00Z","status":400,"error":"Bad Request","message":"Invalid shift days or account PK","path":"/accounts/123/next-due-date-adjustment"}") ) ), @ApiResponse( responseCode = "404", description = "Account not found", content = @Content( mediaType = "application/json", examples = @ExampleObject(value = "{"timestamp":"2026-02-02T12:00:00Z","status":404,"error":"Not Found","message":"Account not found","path":"/accounts/123/next-due-date-adjustment"}") ) ) }) @PostMapping("/accounts/{accountPk}/next-due-date-adjustment") public NextDueDateRecord moveNextDueDate( @Parameter(description = "Primary key of the account", required = true, example = "12345") @PathVariable long accountPk, @Parameter(description = "Number of days to shift the next due date (positive = forward, negative = backward)", required = true, example = "5") @RequestParam int shiftDays ) { DueDateMoveInfo info = new DueDateMoveInfo(); info.setAccountPk(accountPk); info.setMovedByDays(shiftDays); info.setAdjustmentType(AdjustmentType.NEXT_DUE_DATE);
return tmsService.moveNextDueDate(info); // returns record
}

Priyanka Namburu
@pnamburu
1 semana atrás
Owner
see open-api doc sample. Adjust or rename as needed. This is for an external company.

Marcos Silvano
@marcos.pacheco.silva
3 dias atrás
Maintainer
test instructions
new endpoint POST /v1/accounts/{accountPk}/next-due-date/adjustments
body
{"dueDate": "2026-02-02", "offset": 20}
The endpoint should modify the due date for a receivable by the specified offset value.
Expected response on success
{"accountPk": <accountPk>, "originalDueDate": "<date before modification>", "newDueDate": "<original data plus + offset value>"}

---------------------------------------------------------------------------------------------------------------------------------------------------------


# UOWN | SVC | Alteração de Data de Vencimento para API Level AI

## Requisitos

**Endpoint Principal:**
- `POST /uown/tms/v1/accounts/{accountPk}/next-due-date-adjustments`
- **Request body** deve conter: `dueDate`, `offset`
- **Response** deve conter: `nextDueDate`

## Mudanças Necessárias

### 1. Adicionar Enum de Tipo de Ajuste
- Adicionar `adjustmentType` enum (`NEXT_DUE_DATE`, `SCHEDULE_SHIFT`) ao `DueDateMoveInfo`
- Padrão: `SCHEDULE_SHIFT`

### 2. Refatorar SvAccountService
- Mover o método `moveAllDueDatesByDays` do `SvAccountService` para um novo serviço: `MoveDueDatesService`
- Modificar a lógica antes da chamada de `receivableService.moveAllDueDatesByDays`:
  - **Se** `adjustmentType == SCHEDULE_SHIFT`: chamar `receivableService.moveAllDueDatesByDays()`
  - **Senão**: chamar `receivableService.moveNextDueDate()` → deve localizar todos os recebíveis na data fornecida e movê-los pelo número de dias especificado

### 3. Controller
- Definir `adjustmentType` como `NEXT_DUE_DATE` no controller

## Exemplo de Implementação do Controller

```java
@Operation(
    summary = "Mover próxima data de vencimento",
    description = "Ajusta a próxima data de vencimento de recebível agendada para frente ou para trás por um número especificado de dias e retorna o registro da próxima data de vencimento atualizada."
)
@ApiResponses(value = {
    @ApiResponse(
        responseCode = "200",
        description = "Próxima data de vencimento movida com sucesso",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = NextDueDateRecord.class)
        )
    ),
    @ApiResponse(
        responseCode = "400",
        description = "Entrada inválida (ex: dias de deslocamento negativos, conta inválida)",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(value = "{\"timestamp\":\"2026-02-02T12:00:00Z\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Invalid shift days or account PK\",\"path\":\"/accounts/123/next-due-date-adjustment\"}")
        )
    ),
    @ApiResponse(
        responseCode = "404",
        description = "Conta não encontrada",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(value = "{\"timestamp\":\"2026-02-02T12:00:00Z\",\"status\":404,\"error\":\"Not Found\",\"message\":\"Account not found\",\"path\":\"/accounts/123/next-due-date-adjustment\"}")
        )
    )
})
@PostMapping("/accounts/{accountPk}/next-due-date-adjustment")
public NextDueDateRecord moveNextDueDate(
    @Parameter(description = "Chave primária da conta", required = true, example = "12345")
    @PathVariable long accountPk,
    @Parameter(description = "Número de dias para deslocar a próxima data de vencimento (positivo = para frente, negativo = para trás)", required = true, example = "5")
    @RequestParam int shiftDays
) {
    DueDateMoveInfo info = new DueDateMoveInfo();
    info.setAccountPk(accountPk);
    info.setMovedByDays(shiftDays);
    info.setAdjustmentType(AdjustmentType.NEXT_DUE_DATE);
    
    return tmsService.moveNextDueDate(info);
}
```

## Instruções de Teste

**Novo endpoint:** `POST /v1/accounts/{accountPk}/next-due-date/adjustments`

**Body:**
```json
{
  "dueDate": "2026-02-02",
  "offset": 20
}
```

**Comportamento esperado:**
- O endpoint deve modificar a data de vencimento de um recebível pelo valor de offset especificado

**Resposta esperada em caso de sucesso:**
```json
{
  "accountPk": <accountPk>,
  "originalDueDate": "<data antes da modificação>",
  "newDueDate": "<data original + valor do offset>"
}
```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


src/main/java/com/uownleasing/svc/common/db/repository/SvReceivableRepo.java
     "order by r.receivableInfo.dueDate asc")
    List<SvReceivable> findAllActiveReceivablesOnAndAfter(long accountPk, Boolean allReceivables, LocalDate receivableDueDate);

    @Query("""
            select r from SvReceivable r where r.account.pk = :accountPk
            and r.receivableInfo.status = 'ACTIVE' and r.receivableInfo.dueDate = :receivableDueDate
            """)
    List<SvReceivable> findActiveReceivableByDate(long accountPk, LocalDate receivableDueDate);

    @Query("select r from SvReceivable r where r.account.pk = :accountPk " +
            "and r.receivableInfo.status = 'ACTIVE' " +
            "and (r.receivableInfo.allocationStatus = 'UNPAID' or r.receivableInfo.allocationStatus = 'PARTIALLY_PAID')" +


src/main/java/com/uownleasing/svc/common/service/SvReceivableService.java
 public List<SvReceivable> createReceivablesForAccount(List<ReceivableInfo> receivableInfos) {
        List<SvReceivable> svReceivables = new ArrayList<>();
        if(CollectionUtils.isEmpty(receivableInfos)){
        if (CollectionUtils.isEmpty(receivableInfos)) {
            log.warn("[SvReceivableService][createReceivablesForAccount] Cannot create receivables on account. Input receivableInfos is empty");
            return svReceivables;
        }
@@ -122,13 +122,7 @@ public class SvReceivableService {
        if (toBeMoved != null && !toBeMoved.isEmpty()) {
            for (SvReceivable svReceivable : toBeMoved) {
                if (svReceivable.getReceivableInfo().getReceivableType() != ReceivableType.EARLY_PAY_OFF || changeEpo) {
                    ReceivableInfo oldReceivableInfo = new ReceivableInfo();
                    BeanUtils.copyProperties(svReceivable.getReceivableInfo(), oldReceivableInfo);
                    svReceivable.getReceivableInfo()
                            .setDueDate(svReceivable.getReceivableInfo().getDueDate().plusDays(addNumberOfDays));
                    newReceivables.add(receivableRepo.save(svReceivable));
                    log.info("OldReceivable Info {} ; NewReceivable Info {}", oldReceivableInfo,
                            svReceivable.getReceivableInfo());
                    newReceivables.add(moveReceivableDueDate(addNumberOfDays, svReceivable));
                }
            }
        }
@@ -136,6 +130,13 @@ public class SvReceivableService {
        return newReceivables;
    }

    public List<SvReceivable> moveNextDueDate(long accountPk, LocalDate fromDueDate, Integer offset) {
        List<SvReceivable> receivables = findActiveReceivableByDate(accountPk, fromDueDate);
        return receivables.stream()
                .filter(svReceivable -> svReceivable.getReceivableInfo().getReceivableType() != ReceivableType.EARLY_PAY_OFF)
                .map(svReceivable -> moveReceivableDueDate(offset, svReceivable)).toList();
    }

    public List<SvReceivable> moveAllDueDatesForNewTerm(long accountPk, LocalDate fromDueDate, LocalDate toDueDate,
                                                        Frequency newTerm) {
        List<ReceivableInfo> newReceivables = new ArrayList<>();
@@ -177,9 +178,9 @@ public class SvReceivableService {

    public LocalDate getNextDueDate(Long accountPk, LocalDate nextReceivableDate, Frequency term, LocalDate firstDate, LocalDate secondDate) {

        if(Frequency.SEMI_MONTHLY.equals(term) && (firstDate == null || secondDate == null)){
        if (Frequency.SEMI_MONTHLY.equals(term) && (firstDate == null || secondDate == null)) {
            SvEmployment employment = employmentService.getPrimaryEmploymentByAccountPK(accountPk);
            if(employment != null){
            if (employment != null) {
                firstDate = employment.getEmploymentInfo().getLastPayDate();
                secondDate = employment.getEmploymentInfo().getNextPayDate();
            }
@@ -273,6 +274,10 @@ public class SvReceivableService {
        return receivableRepo.findAllActiveReceivablesOnAndAfter(accountPk, dueDate == null, dueDate);
    }

    public List<SvReceivable> findActiveReceivableByDate(long accountPk, LocalDate dueDate) {
        return receivableRepo.findActiveReceivableByDate(accountPk, dueDate);
    }

    public List<SvReceivable> getUnpaidOrPartiallyPaidReceivablesOnOrAfter(long accountPk, LocalDate dueDate) {
        return receivableRepo.findUnpaidOrPPActiveReceivablesOnAndAfter(accountPk, dueDate == null, dueDate);
    }
@@ -349,4 +354,15 @@ public class SvReceivableService {
        }
        log.info("NextDueDate {}", nextDueDate);
    }

    private SvReceivable moveReceivableDueDate(Integer addNumberOfDays, SvReceivable svReceivable) {
        ReceivableInfo oldReceivableInfo = new ReceivableInfo();
        BeanUtils.copyProperties(svReceivable.getReceivableInfo(), oldReceivableInfo);
        svReceivable.getReceivableInfo()
                .setDueDate(svReceivable.getReceivableInfo().getDueDate().plusDays(addNumberOfDays));
        var updatedReceivable = receivableRepo.save(svReceivable);
        log.info("OldReceivable Info {} ; NewReceivable Info {}", oldReceivableInfo,
                updatedReceivable.getReceivableInfo());
        return updatedReceivable;
    }
}


src/main/java/com/uownleasing/svc/pojo/embeddable/DueDateMoveInfo.java
package com.uownleasing.svc.pojo.embeddable;


import com.uownleasing.svc.tms.DueDateAdjustmentType;
import lombok.*;

import javax.persistence.*;
import java.time.*;

@Getter
@Setter
@ToString
@Embeddable
public class DueDateMoveInfo {
    @Transient
    private long dueDateMovesPk;

    @NonNull
    private Long accountPk;

    private String agentUsername;

    private LocalDate movedFromDueDate;

    private Integer movedByDays;

    private Boolean isFpdChange = false;

    @Enumerated(EnumType.STRING)
    private DueDateAdjustmentType adjustmentType = DueDateAdjustmentType.SCHEDULE_SHIFT;
}



src/main/java/com/uownleasing/svc/rest/svc/SvcReceivableController.java
package com.uownleasing.svc.rest.svc;

import com.uownleasing.common.enumeration.ReceivableType;
import com.uownleasing.common.pojo.*;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.db.entity.*;
import com.uownleasing.svc.pojo.embeddable.*;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.RewindReplayService;
import com.uownleasing.svc.tms.DueDateAdjustmentType;
import com.uownleasing.svc.tms.MoveDueDatesService;
import lombok.*;
import org.springframework.format.annotation.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.*;
import java.time.*;
import java.util.*;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/svc", produces = MediaType.APPLICATION_JSON_VALUE)
public class SvcReceivableController {

    private final SvAccountService accountService;

    private final SvReceivableService receivableService;

    private final UownReceivableService uownReceivableService;

    private final UownAllocationService allocationService;

    private final RewindReplayService rewindReplayService;

    private final DueDateMoveService dueDateMoveService;

    private final UownAllocationService uownAllocationService;

    private final PostPaymentService postPaymentService;

    private final RewindPaymentsService rewindPaymentsService;

    private final NextDueReceivableService nextDueReceivableService;

    private final PastDueReceivableService pastDueReceivableService;

    private final MoveDueDatesService moveDueDatesService;

    @GetMapping("/getAllReceivables/{accountPk}")
    public List<SvReceivable> getAllReceivables(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return receivableService.getAllReceivables(accountPk);
    }

    @GetMapping("/getAllActiveReceivables/{accountPk}")
    public List<SvReceivable> getAllActiveReceivables(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return receivableService.getActiveReceivablesOrderByDueDate(accountPk);
    }

    @GetMapping("/getNextReceivable/{accountPk}")
    public SvReceivable getNextReceivable(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return receivableService.getNextReceivable(accountPk);
    }

    @GetMapping("/getNextDueAmount/{accountPk}")
    public BigDecimal getNextDueAmount(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return nextDueReceivableService.getNextDueAmount(accountPk);
    }

    @GetMapping("/getPastDueAmount/{accountPk}")
    public BigDecimal getPastDueAmount(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return pastDueReceivableService.getPastDueAmount(accountPk);
    }

    @GetMapping("/getNextDueAmountAfter/{accountPk}")
    public BigDecimal getNextDueAmountAfter(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return nextDueReceivableService.getNextDueAmountAfterToday(accountPk);
    }

    @GetMapping("/getNextRegularReceivable/{accountPk}")
    public SvReceivable getNextRegularReceivable(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return nextDueReceivableService.getNextRegularReceivable(accountPk);
    }

    @GetMapping("/getNextReceivableAfterDueDate/{accountPk}")
    public SvReceivable getNextReceivable(@PathVariable(name = "accountPk") @NonNull Long accountPk, @RequestParam(name = "dueDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) @NonNull LocalDate dueDate){
        return receivableService.getNextReceivableAfterDueDate(accountPk, dueDate);
    }

    @GetMapping("/getFutureRegularReceivable/{accountPk}")
    public SvReceivable getFutureRegularReceivable(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return nextDueReceivableService.getFutureNextUnpaidRegularReceivable(accountPk);
    }

    @GetMapping("/getNextUnpaidRegularReceivable/{accountPk}")
    public SvReceivable getNextUnpaidRegularReceivable(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return nextDueReceivableService.getNextUnpaidRegularReceivable(accountPk);
    }

    @GetMapping("/getUnpaidOrPartiallyPaidReceivables/{accountPk}")
    public List<SvReceivable> getUnpaidOrPartialPaidReceivables(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return receivableService.getUnpaidOrPartiallyPaidReceivables(accountPk);
    }

    @PostMapping("/createOrUpdateReceivable")
    public SvReceivable createOrUpdateReceivable(@RequestBody ReceivableInfo receivableInfo){
        return receivableService.createOrUpdateReceivable(receivableInfo);
    }

    @GetMapping("/getReceivableType")
    public List<ReceivableType> getReceivableType(){
        return uownReceivableService.getReceivableType();
    }

    @PostMapping("/moveDueDatesByDays/{accountPk}")
    public List<SvReceivable> moveAllDueDatesByDays(@PathVariable @NonNull Long accountPk,
                                                    @RequestParam(name = "fromDueDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDueDate,
                                                    @RequestParam @NonNull Integer moveNumberOfDays){
        DueDateMoveInfo dueDateMoveInfo = new DueDateMoveInfo();
        dueDateMoveInfo.setAccountPk(accountPk);
        dueDateMoveInfo.setMovedFromDueDate(fromDueDate);
        dueDateMoveInfo.setMovedByDays(moveNumberOfDays);
        dueDateMoveInfo.setAdjustmentType(DueDateAdjustmentType.SCHEDULE_SHIFT);
        return moveDueDatesService.moveAllDueDatesByDays(dueDateMoveInfo);
    }

    @GetMapping("/getDueDateMovesForAccount{accountPk}")
    public List<DueDateMoves> getDueDateMovesForAccount(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return dueDateMoveService.getForAccount(accountPk);
    }

    @PostMapping("/reallocatePaymentToReceivables/{paymentPk}")
    public List<SvAllocation> reallocatePaymentToReceivables(@PathVariable(name = "paymentPk") @NonNull Long paymentPk, @RequestParam List<Long> receivablePks){
        return allocationService.allocatePaymentToReceivables(paymentPk, receivablePks, true);
    }

    @PostMapping("/allocatePaymentToAccount/{paymentPk}")
    public List<SvAllocation> allocatePaymentToAccount(@PathVariable(name = "paymentPk") @NonNull Long paymentPk){
        return postPaymentService.postPaymentToAccount(paymentPk);
    }

    @PostMapping("/regenerateAccountSchedule")
    public SvSchedSummary regenerateAccountSchedule(@RequestBody @NonNull SchedSummaryInfo schedSummaryInfo){
        return uownReceivableService.regenerateAccountSchedule(schedSummaryInfo);
    }

    @GetMapping("/collectNewTaxRateAccounts")
    public List<AccountTaxRate> collectNewTaxRateAccounts(@RequestParam(required = false, value = "emails") List<String> emails,
                                                          @RequestParam(required = false, value = "accountPks") List<Long> accountPks) {
        return accountService.collectNewTaxRateAccounts(emails, accountPks);
    }

    @PostMapping("/correctTaxForAccounts")
    public List<SvReceivable> correctTaxForAccounts(@RequestBody @NonNull List<Long> accountPks) {
        return accountService.correctTaxForAccounts(accountPks);
    }

    @PostMapping("/rewindAllPayments/{accountPk}")
    public List<SvPayment> rewindAllPayments(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return rewindPaymentsService.rewindAllPaymentsOnAccount(accountPk);
    }

    @PostMapping("/rewindAndReplayAccount/{accountPk}")
    public List<SvAllocation> rewindAndReplayAccount(@PathVariable(name = "accountPk") @NonNull Long accountPk){
        return rewindReplayService.rewindAndReplayAccount(accountPk);
    }

    @PostMapping("/rewindAndReplayPayment/{paymentPk}")
    public List<SvAllocation> rewindAndReplayPayment(@PathVariable(name = "paymentPk") @NonNull Long paymentPk){
        return rewindReplayService.rewindAndReplayPayment(paymentPk);
    }

    @PostMapping("/reallocateFromReceivable")
    public void reallocateFromReceivable(@RequestBody @NonNull ReallocationRequest reallocationRequest){
        uownAllocationService.reallocateFromReceivable(reallocationRequest);
    }
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
import com.uownleasing.svc.tms.DueDateAdjustmentType;
import com.uownleasing.svc.tms.MoveDueDatesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "TMS", description = "Telephony Management System API")
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/tms", produces = MediaType.APPLICATION_JSON_VALUE)
public class TmsController {

    private final TmsService tmsService;
    private final LoggingService loggingService;
    private final MoveDueDatesService moveDueDatesService;

    @Operation(summary = "Get account summary", description = "Retrieves comprehensive account details including balance and status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TmsAccountSummary.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"timestamp\":\"2026-01-23T12:49:56.873+00:00\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Bad Request\",\"path\":\"/uown/tms/getAccountSummary/{accountPk}\"}")))
    })
    @GetMapping("/getAccountSummary/{accountPk}")
    public TmsAccountSummary getAccountSummary(
            @Parameter(description = "Account primary key", required = true) @PathVariable(name = "accountPk") @Positive(message = "Please provide valid account pk") long accountPk) {
        return tmsService.getAccountSummary(accountPk);
    }

    @Operation(summary = "Update account", description = "Updates account information with provided summary data")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TmsAccountSummary.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"timestamp\":\"2026-01-23T12:49:56.873+00:00\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Bad Request\",\"path\":\"/uown/tms/updateAccount\"}")))
    })
    @PostMapping("/updateAccount")
    public void updateAccount(
            @Parameter(description = "Account summary data to update", required = true) @RequestBody TmsAccountSummary accountSummary) {
        tmsService.updateAccount(accountSummary);
    }

    @Operation(summary = "Move due dates", description = "Adjusts receivable due dates forward or backward by specified number of days")
    @PostMapping("/moveDueDatesByDays/{accountPk}")
    public List<SvReceivable> moveAllDueDatesByDays(
            @Parameter(description = "Account primary key", required = true) @PathVariable(name = "accountPk") @NonNull Long accountPk,
            @Parameter(description = "Starting due date (optional, moves all if not specified)") @RequestParam(name = "fromDueDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDueDate,
            @Parameter(description = "Number of days to move (positive for forward, negative for backward)", required = true) @RequestParam @NonNull Integer moveNumberOfDays) {
        DueDateMoveInfo dueDateMoveInfo = new DueDateMoveInfo();
        dueDateMoveInfo.setAccountPk(accountPk);
        dueDateMoveInfo.setMovedFromDueDate(fromDueDate);
        dueDateMoveInfo.setMovedByDays(moveNumberOfDays);
        dueDateMoveInfo.setAdjustmentType(DueDateAdjustmentType.SCHEDULE_SHIFT);
        return moveDueDatesService.moveAllDueDatesByDays(dueDateMoveInfo);
    }

    @Operation(summary = "Get payoff amount", description = "Calculates the total amount required to pay off the account")
    @GetMapping("/getPayoffAmount/{accountPk}")
    public BigDecimal getPayoffAmount(
            @Parameter(description = "Account primary key", required = true) @PathVariable(name = "accountPk") @Positive(message = "Please provide valid account pk") long accountPk) {
        return tmsService.getPayOffAmount(accountPk);
    }

    @Operation(summary = "Get bank accounts", description = "Retrieves all active bank accounts associated with the account")
    @GetMapping("/getBankAccounts/{accountPk}")
    public List<SvBankAccount> getBankAccounts(
            @Parameter(description = "Account primary key", required = true) @PathVariable(name = "accountPk") @Positive(message = "Please provide valid account pk") long accountPk) {
        return tmsService.getActiveBankAccountByAccountPk(accountPk);
    }

    @Operation(summary = "Get credit cards", description = "Retrieves all tokenized credit cards on file for the account")
    @GetMapping("/getCreditCards/{accountPk}")
    public List<SvCreditCard> getCreditCards(
            @Parameter(description = "Account primary key", required = true) @PathVariable long accountPk) {
        return tmsService.getTokenizedCardsByAccountPk(accountPk);
    }

    @Operation(summary = "Process credit card payment", description = "Executes a single credit card payment transaction")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CCTransactionResult.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"timestamp\":\"2026-01-23T12:49:56.873+00:00\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Bad Request\",\"path\":\"/uown/tms/makeCreditCardPayment\"}")))
    })
    @PostMapping("/makeCreditCardPayment")
    public CCTransactionResult makeCreditCardPayment(
            @Parameter(description = "Credit card transaction information", required = true) @RequestBody CCTransactionInfo ccTransactionInfo) {
        return tmsService.runTransaction(ccTransactionInfo);
    }

    @Operation(summary = "Process multiple credit card payments", description = "Executes multiple credit card transactions for a payment arrangement")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TmsPaymentArrangement.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request", content = @Content(mediaType = "application/json", examples = @ExampleObject(value = "{\"timestamp\":\"2026-01-23T12:49:56.873+00:00\",\"status\":400,\"error\":\"Bad Request\",\"message\":\"Bad Request\",\"path\":\"/uown/tms/makeCreditCardPayments\"}")))
    })
    @PostMapping("/makeCreditCardPayments")
    public TmsPaymentArrangement makeCreditCardPayments(
            @Parameter(description = "Payment arrangement with multiple transactions", required = true) @RequestBody PaymentArrangement paymentArrangement) {
        return tmsService.runTransactions(paymentArrangement);
    }

    @Operation(summary = "Get autopay credit card", description = "Returns the credit card configured for automatic payments, if any")
    @ApiResponse(responseCode = "200", description = "Autopay credit card or null if none configured")
    @GetMapping("/getAutopayCreditCard/{accountPk}")
    public SvCreditCard getAutopayCreditCard(
            @Parameter(description = "Account primary key", required = true) @PathVariable long accountPk) {
        List<SvCreditCard> creditCards = tmsService.getTokenizedCardsByAccountPk(accountPk);
        if (CollectionUtils.isEmpty(creditCards)) {
            return null;
        }
        creditCards = creditCards.stream()
                .filter(cc -> cc.getCreditCardInfo().getAutoPay())
                .collect(Collectors.toList());
        if (CollectionUtils.isEmpty(creditCards)) {
            return null;
        }
        return creditCards.get(0);
    }

    @Operation(summary = "Process ACH payment", description = "Initiates an ACH (Automated Clearing House) bank payment")
    @ApiResponse(responseCode = "200", description = "ACH payment record with processing details")
    @PostMapping("/makeAchPayment")
    public SvACHPayment makeAchPayment(
            @Parameter(description = "ACH payment information", required = true) @RequestBody ACHPayment achPayment) {
        return tmsService.makeAchPayment(achPayment);
    }

    @Operation(summary = "Add activity log note", description = "Creates an activity log entry or note for the account")
    @ApiResponse(responseCode = "200", description = "Created activity log entry")
    @PostMapping("/addLogNote")
    public SvActivityLog addLogNote(
            @Parameter(description = "Log request with account PK, log type, and note", required = true) @RequestBody LogRequest logRequest) {
        return loggingService.createActivityLog(
                logRequest.getAccountPk(),
                logRequest.getLogType() == null && ThreadAttributes.getUsername().equalsIgnoreCase("skit.ai")
                        ? LogType.SKIT_CALL_LOG
                        : logRequest.getLogType(),
                logRequest.getLogNote(),
                ThreadAttributes.getUsername());
    }
}



src/main/java/com/uownleasing/svc/service/SvAccountService.java
package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.*;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.dms.common.db.entity.EmailQueue;
import com.uownleasing.dms.common.enumeration.AttachmentType;
import com.uownleasing.dms.common.enumeration.EmailBodyType;
import com.uownleasing.dms.common.enumeration.Location;
import com.uownleasing.dms.common.pojo.AttachmentInfo;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.db.repository.SvACHPaymentRepo;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.db.repository.SvPaymentRepo;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.AccountTaxRecord;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.entity.TaxForZip;
import com.uownleasing.svc.db.repository.AccountTaxRepo;
import com.uownleasing.svc.enumeration.MerchantType;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.RemainingApprovalAmountInfo;
import com.uownleasing.svc.pojo.TransactionDto;
import com.uownleasing.svc.pojo.rest.AccountTaxRate;
import com.uownleasing.svc.pojo.rest.FinancialInformation;
import com.uownleasing.svc.pojo.rest.InvoiceInformation;
import com.uownleasing.svc.pojo.rest.ScheduledPaymentsInformation;
import com.uownleasing.svc.service.tax.TaxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class SvAccountService extends AccountService {
    private final SchedSummaryService schedSummaryService;
    private final TaxService taxService;
    private final EmploymentService employmentService;
    private final BankAccountService bankAccountService;
    private final CustomerService customerService;
    private final MerchantService merchantService;
    private final SvItemService svItemService;
    private final SvAccountRepo svAccountRepo;

    private final SvReceivableService receivableService;

    private final SvPaymentService paymentService;
    private final SvCreditCardService ccService;
    private final SvInvoiceService invoiceService;
    private final SvItemService itemService;
    private final AddressService addressService;
    private final ConfigurationManagement configurationManagement;

    private final EmailQService emailQService;
    private final AccountTaxRepo accountTaxRepo;

    private final LoggingService loggingService;

    protected String configurationPath = "com.uownleasing.svc.service.SvAccountService.";
    private final SvACHPaymentRepo svACHPaymentRepo;
    private final SvPaymentRepo svPaymentRepo;

    private final AccountFinancialInfoService accountFinancialInfoService;
    private final SvSqlConfigService sqlConfigService;
    private final EntityManager entityManager;

    private final LeadManagementService leadManagementService;

    private final PostPaymentService postPaymentService;

    private final ObjectMapper objectMapper;
    private AccountTaxRecord calculateTaxRate(long accountPk) {
        return calculateTaxRate(svAccountRepo.findByPk(accountPk));
    }

    private AccountTaxRecord calculateTaxRate(SvAccount account) {
        if (account != null) {
            BigDecimal tax;
            AccountTaxRecord record = new AccountTaxRecord();

            Merchant merchant = merchantService.getMerchantByAccountPk(account.getAccountInfo().getAccountPk());
            MerchantInfo merchantInfo = null;
            if (merchant != null)
                merchantInfo = merchant.getMerchantInfo();

            try {
                if (merchantInfo != null && merchantInfo.getMerchantType() == MerchantType.INSTORE) {
                    tax = taxService.getTaxForZip(null, account.getPk(), merchantInfo.getLocationAddress1(), merchantInfo.getCity(),
                        merchantInfo.getState(), merchantInfo.getZipCode(), merchantInfo.getCountry(), merchantInfo.getRefMerchantCode());
                    record.setAccountPk(account.getPk());
                    record.setNewTaxRate(tax);
                    record.setAddress(merchantInfo.getLocationAddress1());
                    record.setCity(merchantInfo.getCity());
                    record.setState(merchantInfo.getState());
                    record.setZipcode(merchantInfo.getZipCode());
                    record.setCountry(merchantInfo.getCountry());
                } else {
                    AddressInfo addressInfo = addressService.getHomeAddressForPrimaryCustomerForAccount(account.getPk()).getAddressInfo();
                    tax = taxService.getTaxForZip(null, account.getPk(), addressInfo.getStreetAddress1(), addressInfo.getCity(),
                        addressInfo.getState(), addressInfo.getZipCode9(), addressInfo.getCountry(), merchantInfo == null ? null : merchantInfo.getRefMerchantCode());
                    record.setNewTaxRate(tax);
                    record.setAccountPk(account.getPk());
                    record.setAddress(addressInfo.getStreetAddress1());
                    record.setCity(addressInfo.getCity());
                    record.setState(addressInfo.getState());
                    record.setZipcode(addressInfo.getZipCode9());
                    record.setCountry(addressInfo.getCountry());
                }
                TaxForZip taxForZip = taxService.findTaxForZipInDB(record.getAddress(), record.getCity(), record.getState(), record.getZipcode(), record.getCountry());
                if (taxForZip != null) {
                    account.getAccountInfo().setTaxForZipPk(taxForZip.getPk());
                    record.setTaxForZipPk(taxForZip.getPk());
                }

                return record;
            } catch (Exception e) {
                log.error("Error calculating tax rate for {}", account, e);
            }
        }
        return null;
    }

    private void checkForNewTaxRate(List<AccountTaxRate> changed, List<String> fileInfo, SvAccount account) {
        AccountTaxRecord record = calculateTaxRate(account);
        SvReceivable receivable = account.getReceivables().iterator().next();
        BigDecimal oldTaxRate = account.getSchedSummary().getSchedSummaryInfo().getTaxRate();
        if (record != null && receivable != null) {
            if (oldTaxRate == null) {
                oldTaxRate = receivable.getReceivableInfo().getTaxRate();
                if (oldTaxRate == null)
                    oldTaxRate = BigDecimal.ZERO;
            }
            oldTaxRate = oldTaxRate.setScale(5, RoundingMode.HALF_DOWN);

            record.setNewTaxRate(record.getNewTaxRate().setScale(5, RoundingMode.HALF_DOWN));
            if (record.getNewTaxRate().compareTo(oldTaxRate) != 0) {
                AccountTaxRate accountTaxRate = new AccountTaxRate();
                accountTaxRate.setAccountPk(account.getPk());
                accountTaxRate.setOldTaxRate(oldTaxRate);
                accountTaxRate.setNewTaxRate(record.getNewTaxRate());

                String comment = String.format("Tax rate for %s should be %s instead of %s", account, record.getNewTaxRate(), oldTaxRate);
                accountTaxRate.setComment(comment);
                log.info(comment);
                changed.add(accountTaxRate);
                fileInfo.add(String.format("Account #: %d | Old Tax Rate: %s | New Tax Rate: %s",
                    account.getPk(), oldTaxRate, record.getNewTaxRate()));
            }
        }
    }

    public List<AccountTaxRate> collectNewTaxRateAccounts(List<String> emails, List<Long> accountPks) {
        List<AccountTaxRate> changed = new ArrayList<>();
        List<String> fileInfo = new ArrayList<>();

        if (accountPks != null) {
            for (Long accountPk : accountPks) {
                SvAccount account = svAccountRepo.findByPk(accountPk);
                if (account != null && account.getAccountInfo().getAccountStatus() == AccountStatus.ACTIVE)
                    checkForNewTaxRate(changed, fileInfo, account);
            }
        } else {
            throw new IllegalArgumentException("Required to specify accountPks");
        }

        if (!fileInfo.isEmpty()) {
            if (emails == null || emails.isEmpty()) {
                emails = List.of("sowjanya.kaligineedi@uownleasing.com, priyanka.namburu@uownleasing.com");
            }

            log.info("Creating email for accounts with new tax rates");
            EmailQueue email = new EmailQueue();
            email.setSubject("Accounts with New Tax Rates");
            email.setEmailBodyType(EmailBodyType.TEXT);
            email.setEmailBody("Dear User,\n\nAttached is the list of accounts with recalculated tax rates.");
            email.setToEmailAddresses(String.join(",", emails));
            email.setLocation(Location.SVC);

            if (SystemConfigurationManagement.isProduction()) {
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.email.uown", "CustomerService@uownleasing.com"));
            }else{
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.email.uown", "uown.dev@uownleasing.com"));
            }

            AttachmentInfo attachmentInfo = new AttachmentInfo();
            attachmentInfo.setAttachmentType(AttachmentType.TXT);

            attachmentInfo.setContent(("Accounts with New Tax Rates:\n\n" + String.join("\n", fileInfo)).getBytes(StandardCharsets.UTF_8));
            attachmentInfo.setName("Account Tax Rates");
            emailQService.createOrUpdateEmailQueue(email, List.of(attachmentInfo));
        }
        return changed;
    }

    public List<SvReceivable> correctTaxForAccounts(List<Long> accountPks, Function<String, Boolean> interruptFunc, String baseConfig) {
        List<SvReceivable> receivableList = new ArrayList<>();
        for (Long accountPk : accountPks) {
            if (interruptFunc != null && baseConfig != null && interruptFunc.apply(baseConfig)) break;
            SchedSummaryInfo summary = schedSummaryService.getSchedSummaryByAccount(accountPk).getSchedSummaryInfo();
            summary.setLastTaxUpdatedTime(LocalDateTime.now());

            log.info("[correctTaxForAccounts] Calculating tax rate for account {}", accountPk);
            AccountTaxRecord record = calculateTaxRate(accountPk);
            for (SvReceivable receivable : receivableService.getUnpaidReceivables(accountPk)) {
                if (receivable.getReceivableInfo().getReceivableType() == ReceivableType.EARLY_PAY_OFF ||
                    receivable.getReceivableInfo().getReceivableType() == ReceivableType.REGULAR_PAYMENT) {
                    ReceivableInfo oldInfo = receivable.getReceivableInfo();
                    try {
                        if (oldInfo.getTaxRate() == null && summary.getTaxRate() != null) {
                            oldInfo.setTaxRate(summary.getTaxRate());
                        } else if (oldInfo.getTaxRate() == null && summary.getTaxRate() == null) {
                            oldInfo.setTaxRate(BigDecimal.ZERO);
                        }

                        if (record == null) {
                            continue;
                        } else if (record.getNewTaxRate().setScale(5, RoundingMode.HALF_DOWN)
                            .compareTo(oldInfo.getTaxRate().setScale(5, RoundingMode.HALF_DOWN)) == 0) {
                            if (oldInfo.getTaxAmount().setScale(2, RoundingMode.HALF_EVEN).compareTo(
                                oldInfo.getBaseAmount().multiply(record.getNewTaxRate()).setScale(2, RoundingMode.HALF_EVEN)) == 0) {
                                oldInfo.setTaxForZipPk(record.getTaxForZipPk());
                                oldInfo.setTaxUpdated(LocalDateTime.now());
                                receivableService.createOrUpdateReceivable(oldInfo);
                                continue;
                            }
                        }
                        record.setOldTaxRate(oldInfo.getTaxRate());

                        ReceivableInfo info = new ReceivableInfo();
                        BeanUtils.copyProperties(oldInfo, info);
                        oldInfo.setStatus(ReceivableStatus.INACTIVE);
                        info.setReceivablePk(0);
                        info.setTaxRate(record.getNewTaxRate());
                        info.setTaxAmount(info.getBaseAmount().multiply(info.getTaxRate()));
                        info.setTotalAmount(info.getBaseAmount().add(info.getTaxAmount()));
                        info.setTaxForZipPk(record.getTaxForZipPk());
                        info.setTaxUpdated(LocalDateTime.now());

                        log.info("[correctTaxForAccounts] Saving date for receivables and record");
                        receivableService.createOrUpdateReceivable(oldInfo);
                        receivableList.add(receivableService.createOrUpdateReceivable(info));


                        loggingService.createActivityLog(accountPk, LogType.DATA_CHANGE,
                            String.format("Tax rate changed from %s to %s", oldInfo.getTaxRate(), info.getTaxRate()),
                            ThreadAttributes.getUsername());
                    } catch (Exception e) {
                        log.error("Error trying to correct tax for account {}", accountPk, e);
                    }
                } else {
                    receivable.getReceivableInfo().setTaxRate(BigDecimal.ZERO);
                    receivable.getReceivableInfo().setTaxUpdated(LocalDateTime.now());
                    receivableService.createOrUpdateReceivable(receivable.getReceivableInfo());
                }
            }
            if (record != null) {
                summary.setTaxRate(record.getNewTaxRate());
                accountTaxRepo.save(record);
            }
            schedSummaryService.createOrUpdateSchedSummary(summary);
        }
        return receivableList;
    }

    public List<SvReceivable> correctTaxForAccounts(List<Long> accountPks) {
        return correctTaxForAccounts(accountPks, null, null);
    }

    @Async
    @Transactional
    public CompletableFuture<String> correctTaxForAccountsAsync(List<Long> accountPks) {
        return CompletableFuture.supplyAsync(() -> {
            log.info("Running correctTaxForAccountsAsync for {} accounts", accountPks.size());
            correctTaxForAccounts(accountPks);
            return "";
        }).exceptionally(e -> {
            log.error("Error while running correctTaxForAccountsAsync", e);
            return e.getMessage();
        });
    }

    public Object getAccountData(long accountPk) {
        SvSqlConfig config = sqlConfigService.getSqlConfigBySqlName("getAccountData");
        if (config != null) {
            String sql = config.getSqlConfigInfo().getSqlQuery();
            sql = sql.replace(":accountPk", String.valueOf(accountPk));

            Query query = entityManager.createNativeQuery(sql);
            NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
            nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
            List<Map<String, Object>> result = nativeQuery.getResultList();
            if (CollectionUtils.isNotEmpty(result)) {
                return result.get(0);
            }
        }
        throw new SvcException("No account data found for account " + accountPk);
    }



    public void updateRatingLetterAndAutoPay(RatingLetter ratingLetter,List<AutoPayType> autoPayTypes, AccountInfo accountInfo) {
        accountFinancialInfoService.updateRatingLetterAndAutoPay(ratingLetter, autoPayTypes, accountInfo);
    }

    public void handleBankAccountUpdate(long accountPk, boolean delete, AccountInfo accountInfo) {
        accountFinancialInfoService.handleBankAccountUpdate(accountPk, delete, accountInfo);
    }

    public void handleCreditCardUpdate(long accountPk, boolean delete, AccountInfo accountInfo) {
        accountFinancialInfoService.handleCreditCardUpdate(accountPk, delete, accountInfo);
    }

    public FinancialInformation getFinancialInfoForAccount(long accountPk){
        FinancialInformation financialInformation = new FinancialInformation();
        financialInformation.setAccountPk(accountPk);

        SvEmployment employment = employmentService.getPrimaryEmploymentByAccountPK(accountPk);
        financialInformation.setEmploymentInfo(employment != null ? employment.getEmploymentInfo() : null);

        List<SvBankAccount> bankAccounts = bankAccountService.getActiveBankAccountByAccountPk(accountPk);
        financialInformation.setSvBankAccounts(bankAccounts != null && !bankAccounts.isEmpty() ? bankAccounts : null);

        List<SvCreditCard> SvCreditCards = ccService.findAllActiveCCByAccountPk(accountPk);
        //SvCreditCard svCreditCard = ccService.getAutoPayByAccountPk(accountPk);
        financialInformation.setSvCreditCards(SvCreditCards);
        return financialInformation;
    }


//    public List<CCInfo> getCCCards(List<SvCreditCard> SvCreditCards) {
//        List<CCInfo> ccInfos = new ArrayList<>();
//        for (SvCreditCard i : SvCreditCards) {
//            ccInfos.add(i.getCreditCardInfo());
//        }
//        return ccInfos;
//    }
//
//    public List<BankAccountInfo> getBankAccounts(List<SvBankAccount> svBankAccounts){
//        List<BankAccountInfo> bankAccountInfos=new ArrayList<>();
//        for (SvBankAccount i : svBankAccounts){
//            bankAccountInfos.add(i.getBankAccountInfo());
//        }
//        return bankAccountInfos;
//    }


    public ScheduledPaymentsInformation getScheduledPayments(long accountPk){
        ScheduledPaymentsInformation scheduledPaymentsInformation = new ScheduledPaymentsInformation();
        SvAccount account = getAccountByPK(accountPk);
        scheduledPaymentsInformation.setReceivableList(receivableService.getActiveReceivablesOrderByDueDate(accountPk));
        List<SvPayment> payments = paymentService.getAllPaymentsForAccount(accountPk);
        BigDecimal totalPaymentAmount = payments != null ? payments.stream().map(payment -> payment.getPaymentInfo().getPaymentAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add):BigDecimal.ZERO;
        SvSchedSummary schedSummary = schedSummaryService.getSchedSummaryByAccount(accountPk);
        scheduledPaymentsInformation.setContractBalance(schedSummary!=null?schedSummary.getSchedSummaryInfo().getTotalContractAmountWithTaxAndFees():BigDecimal.ZERO);
        scheduledPaymentsInformation.setRemainingBalance(scheduledPaymentsInformation.getContractBalance().subtract(totalPaymentAmount));
        return scheduledPaymentsInformation;

    }

    public AccountInfo getAccountInfoForAccount(long accountPk) {
        SvAccount account = getAccountByPK(accountPk);
        return account.getAccountInfo();
    }

    public AccountInfo createOrUpdateAccountInfo(AccountInfo accountInfo) {
        if (accountInfo.getAccountPk() > 0L) {
            SvAccount account = getAccountByPK(accountInfo.getAccountPk());
            AccountInfo info = account.getAccountInfo();

            if (accountInfo.getPastBankruptcy() != null) {
                info.setPastBankruptcy(accountInfo.getPastBankruptcy());
            }
            if (accountInfo.getCurrentOrFutureBankruptcy() != null) {
                info.setCurrentOrFutureBankruptcy(accountInfo.getCurrentOrFutureBankruptcy());
            }
        }

        createOrUpdateAccount(accountInfo);
        return accountInfo;
    }

    public void checkAndUpdateAchPayments(Long accountPk){
        CompletableFuture.runAsync(() -> {
            List<SvACHPayment> achPaymentsOriginal =  svACHPaymentRepo.getSvAchPaymentsRefunded(accountPk);
            for(SvACHPayment achPaymentOriginal:achPaymentsOriginal) {
                List<SvACHPayment> svAchPayments = svACHPaymentRepo.locateAchPaymentsByStatusAndAchType(ACHStatus.PENDING, ACHType.ACHCredit, achPaymentOriginal.getAchPayment().getPaymentPK());
                if (svAchPayments!=null && svAchPayments.size()>0) {
                    for (SvACHPayment svAchPayment : svAchPayments) {
                        ACHPayment achPayment = svAchPayment.getAchPayment();
                        achPayment.setStatus(ACHStatus.CANCELLED);
                        achPayment.addComment("ACH Refund Cancelled: Account status changed: CANCELLED → ACTIVE");
                        svACHPaymentRepo.save(svAchPayment);
                        loggingService.createActivityLog(accountPk, LogType.INFORMATION,
                            "ACH refund is being cancelled", ThreadAttributes.getUsername());
                    }
                    SvPayment svPayment = svPaymentRepo.locateByPk(achPaymentOriginal.getAchPayment().getPaymentPK());
                    svPayment.getPaymentInfo().setStatus(PaymentStatus.PAID);
                    postPaymentService.postPaymentToAccount(svPayment.getPk());
                    svPaymentRepo.save(svPayment);
                    achPaymentOriginal.getAchPayment().setStatus(ACHStatus.SETTLED);
                    svACHPaymentRepo.save(achPaymentOriginal);
                    loggingService.createActivityLog(accountPk, LogType.INFORMATION,
                        "Reposting payments", ThreadAttributes.getUsername());
                }
            }
        });
    }

    public AccountInfo toggleAlertsForAccount(long accountPk, boolean showAlerts) {
        AccountInfo info = getAccountInfoForAccount(accountPk);
        if (info == null)
            throw new IllegalArgumentException("Please provide a valid accountPk");

        info.setShowAlerts(showAlerts);
        return updateAccount(info).getAccountInfo();
    }

    public List<TransactionDto> getTransactions(long accountPk) {
        String sql = sqlConfigService.getSqlConfigBySqlName("getTransactions").getSqlConfigInfo().getSqlQuery();
        Query query = entityManager.createNativeQuery(sql).setParameter("accountPk", accountPk);
        ((NativeQueryImpl<?>) query).setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.registerModule(new Jdk8Module());
        List<?> results = query.getResultList();
        return results.stream()
            .map(o -> {
                try {
                    return objectMapper.readValue(objectMapper.writeValueAsString(o), TransactionDto.class);
                } catch (Exception e) {
                    log.error("Failure to map object to SvcTransaction.class", e);
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please contact Uown support");
                }
            }).toList();
    }

    public InvoiceInformation getInvoiceInformation(long accountPk) {
        InvoiceInformation invoiceInformation = new InvoiceInformation();
        invoiceInformation.setMerchantInfo(merchantService.getMerchantByAccountPk(accountPk).getMerchantInfo());
        SvInvoice invoice = invoiceService.getInvoiceForAccount(accountPk);
        invoiceInformation.setInvoiceInfo(invoice != null ? invoice.getInvoiceInfo() : null);
        invoiceInformation.setItemsForAccount(itemService.getAllItemsForAccount(accountPk));
        return invoiceInformation;
    }

    public void removeItemsOnAccount(long accountPk){
        svItemService.deleteItemsByAccountPk(accountPk);
    }

    public SvSchedSummary getSchedSummaryForAccount(long accountPk) {
        return schedSummaryService.getSchedSummaryByAccount(accountPk);
    }


    public SvAccount updateBankruptStatus(AccountInfo accountInfo) {
        SvAccount account=getAccountByPK(accountInfo.getAccountPk());
        if(accountInfo.getCurrentOrFutureBankruptcy()!=null) {
            account.getAccountInfo().setCurrentOrFutureBankruptcy(accountInfo.getCurrentOrFutureBankruptcy());
        }
        else{
            account.getAccountInfo().setCurrentOrFutureBankruptcy(false);
        }
        if(accountInfo.getPastBankruptcy()!=null) {
            account.getAccountInfo().setPastBankruptcy(accountInfo.getPastBankruptcy());
        }
        else{
            account.getAccountInfo().setPastBankruptcy(false);
        }
        updateAccount(account.getAccountInfo());
        loggingService.createActivityLog(accountInfo.getAccountPk(), LogType.DATA_CHANGE,
            "Updated Bankruptcy status, CurrentOrFutureBankruptcy: " +accountInfo.getCurrentOrFutureBankruptcy()
                + " pastBankruptcy: "+accountInfo.getPastBankruptcy(),ThreadAttributes.getUsername());
        return account;
    }

    public BigDecimal getProrateAmountForReturn(long accountPk, LocalDate onDate) {
        SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("getProrateAmount");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery();
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("accountPk", accountPk);
        query.setParameter("date", onDate);

        List<BigDecimal> dataList = query.getResultList();
        if (CollectionUtils.isNotEmpty(dataList)) {
            return dataList.get(0).setScale(2, RoundingMode.HALF_EVEN);
        }
        throw new SvcException("Unable to calculate prorate amount");
    }

    public RemainingApprovalAmountInfo getRemainingApprovalAmount(long accountPk) {
        RemainingApprovalAmountInfo approvalAmountInfo = new RemainingApprovalAmountInfo();
        approvalAmountInfo.setEligibleForReapproval(false);
        BigDecimal remainingApprovalAmount = BigDecimal.ZERO;
        String reasonString;
        String ssn = customerService.getPrimaryCustomer(accountPk).getCustomerInfo().getSsn();
        List<Object[]> results = leadManagementService.isEligibleForReapprovalCheck(ssn);

        if (CollectionUtils.isNotEmpty(results)) { // If there are previous delinquent accounts
            reasonString = "[getRemainingApproval] Amount: 0, reason(s): ";
            List<String> reasons = new ArrayList<>();
            for (Object[] result : results) {
                String userFriendlyText = ((String) result[1]).split(",")[1];
                reasons.add(userFriendlyText);
            }
            reasonString += String.join(", ", reasons);

            approvalAmountInfo.setMessage(reasonString);
            approvalAmountInfo.setReApprovalAmount(remainingApprovalAmount);

        } else { // Eligible for reapproval
            approvalAmountInfo = leadManagementService.getRemainingApprovalAmount(ssn);
        }
        if (!StringUtils.containsIgnoreCase(ThreadAttributes.getUsername(), "customer portal")) {
            loggingService.createActivityLog(accountPk, LogType.INFORMATION, null, null, approvalAmountInfo.getMessage(), ThreadAttributes.getUsername());
        }
        return approvalAmountInfo;
    }

    public List<String> getRatingLetters() {
        return Arrays.stream(RatingLetter.values())
            .sorted(Comparator.comparing(RatingLetter::name))
            .map(r -> r.name() + " - " + r.getRatingLetterDescription())
            .collect(Collectors.toList());
    }
}



src/main/java/com/uownleasing/svc/service/TmsService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.RatingLetter;
import com.uownleasing.common.enumeration.ReceivableType;
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
            getLastScheduledPaymentDate(tmsAccountSummary, accountPk);

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

    private void getLastScheduledPaymentDate(TmsAccountSummary tmsAccountSummary, long accountPk) {
        var receivables = receivableRepo.findActiveReceivableByType(accountPk, ReceivableType.REGULAR_PAYMENT);
        if (receivables != null && !receivables.isEmpty()) {
            tmsAccountSummary.setLastScheduledPaymentDate(receivables.get(receivables.size() - 1).getReceivableInfo().getDueDate());
        }
    }

    public CCTransactionResult runTransaction(CCTransactionInfo ccTransactionInfo) {
        try {
            ccTransactionInfo = ccTransactionService.runTransaction(ccTransactionInfo);
            return new CCTransactionResult(ccTransactionInfo);
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



src/main/java/com/uownleasing/svc/tms/DueDateAdjustmentResponse.java
package com.uownleasing.svc.tms;

import java.time.LocalDate;

public record DueDateAdjustmentResponse(long accountPk, LocalDate originalDueDate, LocalDate newDueDate) {
}



src/main/java/com/uownleasing/svc/tms/DueDateAdjustmentType.java
package com.uownleasing.svc.tms;

public enum DueDateAdjustmentType {
    NEXT_DUE_DATE,
    SCHEDULE_SHIFT
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
            .addValue("size", pageable.getPageSize());

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

import com.uownleasing.svc.pojo.embeddable.DueDateMoveInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Positive;

@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/tms", produces = MediaType.APPLICATION_JSON_VALUE)
public class InboundIVRController {

    private final IVRSearchService ivrSearchService;
    private final MoveDueDatesService moveDueDatesService;

    @Operation(summary = "Search accounts by customer identifiers",
        description = "Finds active primary accounts matching phone, SSN, or date of birth. Returns up to 5 results.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Accounts found successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search criteria"),
        @ApiResponse(responseCode = "409", description = "Too many accounts found (>5)")
    })
    @PostMapping("/v1/accounts/search")
    public FindAccountResponse searchAccount(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Search criteria with at least one identifier (phone, SSN, or DOB)",
            required = true
        )
        @RequestBody FindAccountRequest findAccountRequest) {
        Pageable pageable = PageRequest.of(0, 10);
        return ivrSearchService.findActivePrimaryAccountsBy(findAccountRequest, pageable);
    }

    @Operation(summary = "Adjust the next payment due date for an account",
        description = "Moves a payment due date forward by a specified number of days (0-30). " +
            "If no dueDate is specified, adjusts the first upcoming payment. Only the specified payment is moved.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment due date adjusted successfully. Returns updated due date information."),
        @ApiResponse(responseCode = "204", description = "No payment found matching the specified due date. No changes were made."),
        @ApiResponse(responseCode = "400", description = "Invalid request: validation failed, missing schedule summary, or invalid adjustment parameters"),
        @ApiResponse(responseCode = "404", description = "Account not found")
    })
    @PostMapping("/v1/accounts/{accountPk}/next-due-date/adjustments")
    public ResponseEntity<DueDateAdjustmentResponse> nextDueDateAdjustments(
        @Parameter(description = "Account primary key", required = true)
        @Positive(message = "Please provide valid account pk")
        @PathVariable long accountPk,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Adjustment parameters: dueDate (optional, if not specified defaults to the first upcoming payment), " +
                "offset (number of days to move forward, range: 0-30)",
            required = true
        )
        @Valid @RequestBody NextDueDateAdjustmentRequest nextDueDateAdjustment) {
        DueDateMoveInfo dueDateMoveInfo = new DueDateMoveInfo();
        dueDateMoveInfo.setAccountPk(accountPk);
        dueDateMoveInfo.setMovedFromDueDate(nextDueDateAdjustment.dueDate());
        dueDateMoveInfo.setMovedByDays(nextDueDateAdjustment.offset());
        dueDateMoveInfo.setAdjustmentType(DueDateAdjustmentType.NEXT_DUE_DATE);
        var resp = moveDueDatesService.moveDueDateByDays(dueDateMoveInfo);
        if (resp == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(resp);
    }
}



src/main/java/com/uownleasing/svc/tms/MoveDueDatesService.java
package com.uownleasing.svc.tms;

import com.uownleasing.common.pojo.SchedSummaryInfo;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvReceivable;
import com.uownleasing.svc.common.db.entity.SvSchedSummary;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.service.SvReceivableService;
import com.uownleasing.svc.pojo.embeddable.DueDateMoveInfo;
import com.uownleasing.svc.service.DueDateMoveService;
import com.uownleasing.svc.service.NextDueReceivableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;


@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class MoveDueDatesService {
    private final SvReceivableService receivableService;
    private final NextDueReceivableService nextDueReceivableService;
    private final DueDateMoveService dueDateMoveService;
    private final SvAccountRepo accountRepo;

    public DueDateAdjustmentResponse moveDueDateByDays(DueDateMoveInfo moveInfo) {
        var receivables = moveAllDueDatesByDays(moveInfo);
        if (receivables == null || receivables.isEmpty()) {
            return null;
        }
        return new DueDateAdjustmentResponse(moveInfo.getAccountPk(), moveInfo.getMovedFromDueDate(),
            receivables.get(0).getReceivableInfo().getDueDate());
    }

    public List<SvReceivable> moveAllDueDatesByDays(DueDateMoveInfo moveInfo) {
        long accountPk = moveInfo.getAccountPk();
        log.debug("Starting due date adjustment - accountPk: {}, adjustmentType: {}, offset: {} days, requestDueDate: {}",
            accountPk, moveInfo.getAdjustmentType(), moveInfo.getMovedByDays(), moveInfo.getMovedFromDueDate());

        SvAccount svAccount = accountRepo.findById(accountPk)
            .orElseThrow(() -> {
                log.warn("Account not found during due date adjustment: accountPk={}", accountPk);
                return new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    String.format("Cannot adjust due dates: Account %d not found", accountPk)
                );
            });

        SvSchedSummary svSched = Optional.ofNullable(svAccount.getSchedSummary())
            .orElseThrow(() -> {
                log.warn("Account has no schedule summary: accountPk={}", accountPk);
                return new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unable to process due date adjustment at this time"
                );
            });

        SchedSummaryInfo schedSummaryInfo = svSched.getSchedSummaryInfo();
        schedSummaryInfo.setDueDateMoves(Objects.requireNonNullElse(schedSummaryInfo.getDueDateMoves(), 0) + 1);

        // Determine the actual due date being moved (with validation)
        if (moveInfo.getMovedFromDueDate() == null) {
            moveInfo.setMovedFromDueDate(schedSummaryInfo.getFirstPaymentDueDate());
        }

        LocalDate dueDate = moveInfo.getMovedFromDueDate();
        log.debug("Moving from due date: {} by {} days for accountPk: {}", dueDate, moveInfo.getMovedByDays(), accountPk);

        // Check if this is a first payment due date change
        LocalDate firstPaymentDueDate = schedSummaryInfo.getFirstPaymentDueDate();
        if (firstPaymentDueDate != null && dueDate.isEqual(firstPaymentDueDate)) {
            LocalDate newFpd = dueDate.plusDays(moveInfo.getMovedByDays());
            schedSummaryInfo.setFirstPaymentDueDate(newFpd);
            moveInfo.setIsFpdChange(true);
            log.debug("First payment due date changed from {} to {} for accountPk: {}", firstPaymentDueDate, newFpd, accountPk);
        }

        List<SvReceivable> movedDueDates = switch (moveInfo.getAdjustmentType()) {
            case SCHEDULE_SHIFT -> receivableService.moveAllDueDatesByDays(
                accountPk, dueDate, moveInfo.getMovedByDays(), false);
            case NEXT_DUE_DATE -> receivableService.moveNextDueDate(
                accountPk, dueDate, moveInfo.getMovedByDays());
        };

        if (movedDueDates.isEmpty()) {
            log.debug("No receivable found matching expected due date for accountPk: {}", accountPk);
            return null;
        }

        SvReceivable receivable = nextDueReceivableService.getNextRegularReceivable(accountPk);
        if (receivable != null)
            svSched.getSchedSummaryInfo().setDelinquencyAsOfDate(receivable.getReceivableInfo().getDueDate());

        dueDateMoveService.createOrUpdate(moveInfo);

        log.debug("Due date adjustment completed successfully - accountPk: {}, movedReceivables: {}, isFpdChanged: {}, newDelinquencyDate: {}",
            accountPk, movedDueDates.size(), moveInfo.getIsFpdChange(),
            receivable != null ? receivable.getReceivableInfo().getDueDate() : "N/A");
        return movedDueDates;
    }
}



src/main/java/com/uownleasing/svc/tms/NextDueDateAdjustmentRequest.java
package com.uownleasing.svc.tms;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.time.LocalDate;

public record NextDueDateAdjustmentRequest(
    LocalDate dueDate,
    @Min(value = 0, message = "Offset must be >= 0 days")
    @Max(value = 30, message = "Offset must be <= 30 days")
    int offset
) {
}



src/main/resources/db/migration/V20260204091007__add_adjustment_type_column_to_due_date_moves_table.sql
-- =====================================================
-- Flyway Migration: V.sql
-- Created: Wed Feb  4 09:05:02 AM PST 2026
-- Description:
-- =====================================================

-- Add your SQL changes here
ALTER TABLE uown_due_date_moves
ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(255);

---------------------------------------------------------------------------------------------------------------------------------------------------------

Cenarios de teste:



## 1. Ajuste bem-sucedido da próxima data de vencimento com offset positivo

**Cenário:** Movo a próxima data de vencimento 20 dias para frente
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **E** existe um recebível ativo com dueDate "2026-02-18"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-18", "offset": 20}`
- **Então** eu recebo status 200
- **E** a resposta contém `{"accountPk": <accountPk>, "originalDueDate": "2026-02-18", "newDueDate": "2026-03-10"}`
- **E** o recebível foi movido 20 dias para frente

---

## 2. Ajuste da primeira data de vencimento (First Payment Due Date)

**Cenário:** Movo a primeira data de vencimento do cronograma
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **E** a primeira data de vencimento (FPD) é "2026-02-02"
- **E** existe um recebível com dueDate igual ao FPD
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": 15}`
- **Então** eu recebo status 200
- **E** a resposta contém newDueDate "2026-02-17"
- **E** o campo firstPaymentDueDate no SchedSummary foi atualizado para "2026-02-17"
- **E** o campo isFpdChange está marcado como true

---

## 3. Ajuste sem especificar dueDate

**Cenário:** Movo o pagamento sem especificar data
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"offset": 5}` (sem dueDate)
- **Então** eu recebo status 200
- **E** a resposta contém originalDueDate "2026-03-25"
- **E** a resposta contém newDueDate "2026-03-30"

---

## 4. Offset no limite máximo permitido (30 dias)

**Cenário:** Movo a data de vencimento com offset máximo
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **E** existe um recebível com dueDate "2026-02-02"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": 30}`
- **Então** eu recebo status 200
- **E** a resposta contém newDueDate "2026-03-04"

---

## 5. Offset no limite mínimo permitido (0 dias)

**Cenário:** Tento mover com offset zero
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **E** existe um recebível com dueDate "2026-02-02"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": 0}`
- **Então** eu recebo status 200
- **E** a resposta contém originalDueDate igual a newDueDate "2026-02-02"

---

## 6. Validação: offset negativo não é permitido

**Cenário:** Tento mover com offset negativo
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": -5}`
- **Então** eu recebo status 400
- **E** a mensagem de erro contém "Offset must be >= 0 days"

---

## 7. Validação: offset acima do máximo não é permitido

**Cenário:** Tento mover com offset maior que 30 dias
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": 31}`
- **Então** eu recebo status 400
- **E** a mensagem de erro contém "Offset must be <= 30 days"

---

## 8. Conta não encontrada

**Cenário:** Tento ajustar data de vencimento para conta inexistente
- **Dado que** eu uso um accountPk que não existe (ex: 999999)
- **Quando** eu envio POST para "/v1/accounts/999999/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-05-17", "offset": 5}`
- **Então** eu recebo status 404
- **E** a mensagem de erro contém "Account" e "not found"

---
## 10. Nenhum recebível encontrado na data especificada

**Cenário:** Tento mover data que não possui recebível
- **Dado que** eu tenho uma conta ativa com accountPk válido
- **E** não existe recebível com dueDate "2026-12-04"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-12-04", "offset": 30}`
- **Então** eu recebo status 204 (No Content)
- **E** nenhuma alteração foi realizada

---

## 11. Ajuste com tipo NEXT_DUE_DATE (apenas um recebível)

**Cenário:** Movo apenas o próximo recebível sem afetar o cronograma completo
- **Dado que** eu tenho uma conta com múltiplos recebíveis futuros
- **E** o próximo recebível tem dueDate "2026-02-18"
- **E** existem recebíveis posteriores em "2026-02-25" e "2026-03-04"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-18", "offset": 20}`
- **Então** eu recebo status 200
- **E** apenas o recebíveis de "2026-02-18" foi movido para "2026-03-10"
- **E** os recebíveis de "2026-02-25" e "2026-03-04" permanecem inalterados
- **E** o adjustmentType usado foi NEXT_DUE_DATE


---

## 13. Atualização da data de delinquência (delinquencyAsOfDate)

**Cenário:** Verifico que a data de delinquência é atualizada
- **Dado que** eu tenho uma conta ativa
- **E** o próximo recebível regular tem dueDate "2026-02-10"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-10", "offset": 15}`
- **Então** eu recebo status 200
- **E** o campo delinquencyAsOfDate foi atualizado para "2026-02-25"

---

## 14. Recebível do tipo EARLY_PAY_OFF não é movido

**Cenário:** Tento mover um recebível de quitação antecipada
- **Dado que** eu tenho uma conta com recebível tipo EARLY_PAY_OFF
- **E** o recebível EPO tem dueDate "2026-02-23"
- **Quando** eu envio POST para "/v1/accounts/{accountPk}/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-23", "offset": 5}`
- **Então** eu recebo status 204
- **E** o recebível EARLY_PAY_OFF não foi movido

---

## 15. Validação de accountPk inválido (não positivo)

**Cenário:** Tento usar accountPk inválido
- **Quando** eu envio POST para "/v1/accounts/0/next-due-date/adjustments"
- **E** o body contém `{"dueDate": "2026-02-02", "offset": 10}`
- **Então** eu recebo status 400
- **E** a mensagem de erro contém "Please provide valid account pk"

---


---------------------------------------------------------------------------------------------------------------------------------------------------------

Comentario gitlab:


## Tests in sandbox

---

### 1. Successful next due date shift with positive offset
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-02-18"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-18", "offset": 20}
- Then I receive status 200
- And the response contains {"accountPk": <accountPk>, "originalDueDate": "2026-02-18", "newDueDate": "2026-03-10"}
- And the receivable was moved 20 days forward

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 16678     | 2026-02-18  | 20     | 2026-03-10  |
```

Screeshot

**PASS**

---

### 2. First Payment Due Date (FPD) shift
```markdown
- Given I have an active account with a valid accountPk
- And the firstPaymentDueDate (FPD) is "2026-02-18"
- And there is a receivable with dueDate equal to the FPD
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-18", "offset": 15}
- Then I receive status 200
- And the response contains newDueDate "2026-03-10"
- And the SchedSummary.firstPaymentDueDate is updated to "2026-03-10"
- And isFpdChange is marked as true

Examples:
| AccountPk | DueDate     | Offset | NewFPD      |
|-----------|-------------|--------|-------------|
| 16678     | 2026-02-18  | 15     | 2026-03-10  |
```

Screeshot

**PASS**

---

### 3. Adjustment without specifying dueDate
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"offset": 5}
- Then I receive status 200
- And the response contains originalDueDate "2026-03-10"
- And the response contains newDueDate "2026-03-20"

Examples:
| AccountPk | Offset | OriginalDueDate | NewDueDate  |
|-----------|--------|-----------------|-------------|
| 16678     | 5      | 2026-03-10      | 2026-03-20  |
```

Screeshot

**PASS**

---

### 4. Offset at maximum allowed (30 days)
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-02-02"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-02", "offset": 30}
- Then I receive status 200
- And the response contains newDueDate "2026-03-04"

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 16678     | 2026-02-25  | 30     | 2026-03-27  |
```

Screeshot

**PASS**

---

### 5. Offset at minimum allowed (0 days)
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-02-02"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-02", "offset": 0}
- Then I receive status 200
- And the response contains originalDueDate equal to newDueDate "2026-02-02"

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 16678     | 2026-03-04  | 0      | 2026-03-04  |
```

Screeshot

**PASS**

---

### 6. Validation: negative offset not allowed
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-02", "offset": -5}
- Then I receive status 400
- And the error message contains "Offset must be >= 0 days"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 16678     | 2026-03-10  | -20     |
```

Screeshot

**PASS**

---

### 7. Validation: offset above maximum not allowed
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-02", "offset": 31}
- Then I receive status 400
- And the error message contains "Validation failed for object='nextDueDateAdjustmentRequest'"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 16678     | 2026-03-09  | 45     |
```

Screeshot

**PASS**

---

### 8. Account not found
```markdown
- Given I use a non-existing accountPk (e.g., 999999)
- When I POST to "/v1/accounts/999999/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-02", "offset": 10}
- Then I receive status 404
- And the error message contains "Account" and "not found"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 0    | 2026-05-17  | 5     |
```

Screeshot

**PASS**

---

### 9. No receivable found on the specified date
```markdown
- Given I have an active account with a valid accountPk
- And there is no receivable with dueDate "2026-12-04"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-12-04", "offset": 30}
- Then I receive status 204 (No Content)
- And no change is performed

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 16678     | 2026-04-12  | 30     |
```

Screeshot

**PASS**

---

### 10. NEXT_DUE_DATE adjustment (only one receivable moved)
```markdown
- Given I have an account with multiple future receivables
- And the next receivable has dueDate "2026-02-18"
- And there are later receivables on "2026-02-25" and "2026-03-04"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-18", "offset": 20}
- Then I receive status 200
- And only the receivable on "2026-02-18" is moved to "2026-03-10"
- And the receivables on "2026-02-25" and "2026-03-04" remain unchanged
- And the adjustmentType used was NEXT_DUE_DATE

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 16671     | 2026-02-18  | 20     | 2026-03-10  |
```

Screeshot

**PASS**

---

### 11. delinquencyAsOfDate is updated
```markdown
- Given I have an active account
- And the next regular receivable has dueDate "2026-02-10"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-10", "offset": 15}
- Then I receive status 200
- And the field delinquencyAsOfDate is updated to "2026-02-25"

Examples:
| AccountPk | DueDate     | Offset | ExpectedDelinquencyAsOf |
|-----------|-------------|--------|-------------------------|
| 16678     | 2026-03-04  | 05     | 2026-03-09             |
```

Screeshot

**PASS**

---

### 12. EARLY_PAY_OFF receivable is not moved
```markdown
- Given I have an account with a receivable of type EARLY_PAY_OFF
- And the EPO receivable has dueDate "2026-02-23"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-23", "offset": 5}
- Then I receive status 204 (No Content) if only EPO exists on that date
- And the EARLY_PAY_OFF receivable is not moved

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 16671     | 2026-05-17  | 5      |
```

Screeshot

**PASS**

---



-------------------------------------

## Tests in stg

---
### 1. Successful next due date shift with positive offset
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-03-02"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-03-02", "offset": 14}
- Then I receive status 200
- And the response contains {"accountPk": <accountPk>, "originalDueDate": "2026-02-18", "newDueDate": "2026-03-10"}
- And the receivable was moved 14 days forward

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 588998     | 2026-03-02  | 20     | 2026-03-10  |
```

![image](/uploads/41b3b1640f3527c2b35c2a5fb6346f17/image.png){width=900 height=474}
![image](/uploads/d89ff0d15c8d9344bbfb6849125d804a/image.png){width=793 height=408}
![image](/uploads/4a38519d83ce24a1d232d0d34a3dbf6a/image.png){width=900 height=468}

**PASS**

---
### 2. First Payment Due Date (FPD) shift
```markdown
- Given I have an active account with a valid accountPk
- And the firstPaymentDueDate (FPD) is "2026-02-23"
- And there is a receivable with dueDate equal to the FPD
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-02-23", "offset": 7}
- Then I receive status 200
- And the response contains newDueDate "2026-03-02"
- And the SchedSummary.firstPaymentDueDate is updated to "2026-03-02"
- And isFpdChange is marked as true

Examples:
| AccountPk | DueDate     | Offset | NewFPD      |
|-----------|-------------|--------|-------------|
| 588998    | 2026-02-23  | 7     | 2026-03-02  |
```


**PASS**

---
### 3. Adjustment without specifying dueDate
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"offset": 5}
- Then I receive status 200
- And the response contains originalDueDate "2026-03-02"
- And the response contains newDueDate "2026-03-07"

Examples:
| AccountPk | Offset | OriginalDueDate | NewDueDate  |
|-----------|--------|-----------------|-------------|
| 588998    | 5      | 2026-03-02      | 2026-03-07  |
```


**PASS**

---
### 4. Offset at maximum allowed (30 days)
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-03-07"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-03-07", "offset": 30}
- Then I receive status 200
- And the response contains newDueDate "2026-04-06"

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 588998    | 2026-03-07  | 30     | 2026-04-06  |
```



**PASS**

---
### 5. Offset at minimum allowed (0 days)
```markdown
- Given I have an active account with a valid accountPk
- And there is an active receivable with dueDate "2026-03-09"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- Then I receive status 200
- And the response contains originalDueDate equal to newDueDate

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 588998     | 2026-03-09  | 0      | 2026-03-09  |
```



**PASS**
Suggestion: skip logging when the offset is 0 days.

---
### 6. Validation: negative offset not allowed
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-03-09", "offset": -5}
- Then I receive status 400
- And the error message contains "Validation failed for object='nextDueDateAdjustmentRequest'. Error count: 1"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 588998     | 2026-03-09  | -5     |
```



**PASS**

---
### 7. Validation: offset above maximum not allowed
```markdown
- Given I have an active account with a valid accountPk
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-03-09", "offset": 31}
- Then I receive status 400
- And the error message contains "Validation failed for object='nextDueDateAdjustmentRequest'"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 588998     | 2026-03-09  | 31     |
```




**PASS**

---
### 8. Account not found
```markdown
- Given I use a non-existing accountPk (e.g., 5889998)
- When I POST to "/v1/accounts/0/next-due-date/adjustments" and "/v1/accounts/5889998/next-due-date/adjustments"
- Then I receive status 404
- And the error message contains "Account" and "not found"

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 5889998   | 2026-03-09  | 30     |
```



**PASS**

---
### 9. No receivable found on the specified date
```markdown
- Given I have an active account with a valid accountPk
- And there is no receivable with dueDate "2026-03-08"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- Then I receive status 204 (No Content)
- And no change is performed

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 588998    | 2026-03-08  | 30     |
```



**PASS**

---
### 10. NEXT_DUE_DATE adjustment (only one receivable moved)
```markdown
- Given I have an account with multiple future receivables
- And the next receivable has dueDate "2026-03-07"
- And there are later receivables on "2026-03-09" and "2026-03-16"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- And the body is {"dueDate": "2026-03-09", "offset": 30}
- Then I receive status 200
- And only the receivable on "2026-03-09" is moved to "2026-04-06"
- And the receivables on "2026-03-09" and "2026-03-16" remain unchanged
- And the adjustmentType used was NEXT_DUE_DATE

Examples:
| AccountPk | DueDate     | Offset | NewDueDate  |
|-----------|-------------|--------|-------------|
| 588998     | 2026-03-09  | 30     | 2026-04-06  |
```

**PASS**

---
### 11. delinquencyAsOfDate is updated
```markdown
- Given I have an active account
- And the next regular receivable has dueDate "2026-03-09"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- Then I receive status 200
- And the field delinquencyAsOfDate is updated to "2026-03-16"

Examples:
| AccountPk | DueDate     | Offset | ExpectedDelinquencyAsOf |
|-----------|-------------|--------|-------------------------|
| 588998     | 2026-03-09  | 30     | 2026-03-16             |
```



**PASS**

---
### 12. EARLY_PAY_OFF receivable is not moved
```markdown
- Given I have an account with a receivable of type EARLY_PAY_OFF
- And the EPO receivable has dueDate "2026-05-24"
- When I POST to "/v1/accounts/{accountPk}/next-due-date/adjustments"
- Then I receive status 204 (No Content) if only EPO exists on that date
- And the EARLY_PAY_OFF receivable is not moved

Examples:
| AccountPk | DueDate     | Offset |
|-----------|-------------|--------|
| 588998     | 2026-05-24  | 5      |
```



**PASS**

---