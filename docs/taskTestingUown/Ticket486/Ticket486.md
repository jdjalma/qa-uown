---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/486


UOWN | Servicing | Automatically propagate the DNC flag to all accounts with the same phone number


Synopsis

The system includes a DNC (Do Not Call) feature that allows users to mark an account indicating that the customer does not wish to receive phone calls. However, a single phone number can be linked to multiple accounts. Currently, enabling the DNC flag in one account does not propagate to other accounts that share the same number. This ticket proposes implementing logic so that once a number is marked as DNC, the system automatically applies this flag to all accounts associated with that same phone number.


Business Objective
Reduce agent rework, increase operational efficiency, and avoid unintended outbound calls to customers who have already opted out. Automatic propagation of the DNC flag also improves compliance and mitigates legal risks related to unauthorized calling attempts.


Feature Request | Business Requirements
1. Automatic propagation of the DNC flag
      When the DNC flag is enabled for an account, the system must identify all other accounts that have the same phone number.
      The DNC flag must be automatically applied to these additional accounts.
      Propagate the same funcionality in Origination Portal.


# Testing Steps

## Overview
Test the `updateDnc` and `updateDnt` endpoints that allow updating Do Not Call and Do Not Text flags for phone numbers. Changes automatically propagate to all phone records with the same number.

## Portal Testing

### Prerequisites
- Access to Servicing portal with `create_or_update_primary_customer_contact_info` permission
- Account with at least one phone number (mobile, home, or work)

### Test Steps

1. **Navigate to Customer Information**
   - Go to Servicing → Search for an account → Open Customer Information page

2. **Test DNC Update**
   - In Primary Contact panel, toggle "Do Not Call" checkbox for any phone type (false to true)
   - Provide reason when prompted
   - **Expected**: Success toast: "Do Not Call flag updated successfully"
   - Verify the checkbox reflects the new state
   - Verify all phones with the same number have DNC updated

3. **Test DNT Update**
   - In Primary Contact panel, toggle "Do Not Text" checkbox for any phone type
   - Provide reason when prompted
   - **Expected**: Success toast: "Do Not Text flag updated successfully"
   - Verify the checkbox reflects the new state
   - Verify all phones with the same number have DNT updated

4. **Test Error Scenarios**
   - Attempt to update DNC/DNT when phone is missing
   - **Expected**: Error toast: "Phone not found"

## API Testing

### Endpoints
- `POST /uown/svc/updateDnc`
- `POST /uown/svc/updateDnt`


### Test Cases

#### 1. Enable DNC
```bash
POST /uown/svc/updateDnc
{
  "phonePK": <phonePK>,
  "doNotCall": true,
  "reasonForDnc": "Customer requested no calls"
}
```
**Expected**: Status 200, phone DNC flag set to true, all matching phones updated

#### 2. Disable DNC
```bash
POST /uown/svc/updateDnc
{
  "phonePK": <phonePK>,
  "doNotCall": false
}
```
**Expected**: Status 200, phone DNC flag set to false, all matching phones updated

#### 3. Enable DNT
```bash
POST /uown/svc/updateDnt
{
  "phonePK": <phonePK>,
  "doNotText": true,
  "reasonForDnt": "Customer requested no texts"
}
```
**Expected**: Status 200, phone DNT flag set to true, all matching phones updated

#### 4. Disable DNT
```bash
POST /uown/svc/updateDnt
{
  "phonePK": <phonePK>,
  "doNotText": false
}
```
**Expected**: Status 200, phone DNT flag set to false, all matching phones updated

## Verification Checklist
- [ ] Success toast appears on successful update
- [ ] Error toast appears on failure
- [ ] DNC/DNT flags update correctly in UI
- [ ] Changes propagate to all phones with same number
- [ ] Activity log created for DNC/DNT changes
- [ ] API returns correct status codes
- [ ] Independent flags (DNC and DNT don't affect each other)

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

## **UOWN | Servicing | Propagação automática do flag DNC para todas as contas com o mesmo número de telefone**

### **Sinopse**

O sistema possui a funcionalidade **DNC (Do Not Call / Não Ligar)**, que permite aos usuários marcar uma conta indicando que o cliente não deseja receber ligações telefônicas. No entanto, um mesmo número de telefone pode estar vinculado a múltiplas contas. Atualmente, ao habilitar o flag DNC em uma conta, essa configuração não é propagada para outras contas que compartilham o mesmo número.

Este ticket propõe a implementação de uma lógica para que, uma vez que um número seja marcado como DNC, o sistema aplique automaticamente esse flag a todas as contas associadas a esse mesmo número de telefone.

---

### **Objetivo de Negócio**

Reduzir retrabalho dos agentes, aumentar a eficiência operacional e evitar chamadas de saída não intencionais para clientes que já optaram por não receber ligações. A propagação automática do flag DNC também melhora a conformidade regulatória e mitiga riscos legais relacionados a tentativas de contato não autorizadas.

---

### **Solicitação de Funcionalidade | Requisitos de Negócio**

1. **Propagação automática do flag DNC**

   * Quando o flag DNC for habilitado para uma conta, o sistema deve identificar todas as outras contas que possuem o mesmo número de telefone.
   * O flag DNC deve ser aplicado automaticamente a essas contas adicionais.
   * Propagar a mesma funcionalidade também no **Portal de Originação**.

---

## **Passos de Teste**

### **Visão Geral**

Testar os endpoints `updateDnc` e `updateDnt`, que permitem atualizar os flags **Do Not Call** e **Do Not Text** para números de telefone. As alterações devem ser automaticamente propagadas para todos os registros de telefone que possuam o mesmo número.

---

## **Testes no Portal**

### **Pré-requisitos**

* Acesso ao portal de **Servicing** com a permissão `create_or_update_primary_customer_contact_info`
* Conta com pelo menos um número de telefone (celular, residencial ou comercial)

---

### **Passos de Teste**

1. **Navegar até Customer Information**

   * Acessar **Servicing → Buscar uma conta → Abrir a página Customer Information**

2. **Testar atualização de DNC**

   * No painel **Primary Contact**, ativar o checkbox **“Do Not Call”** para qualquer tipo de telefone (de false para true)
   * Informar o motivo quando solicitado
   * **Esperado**: Toast de sucesso: *“Do Not Call flag updated successfully”*
   * Verificar se o checkbox reflete o novo estado
   * Verificar se todos os telefones com o mesmo número tiveram o DNC atualizado

3. **Testar atualização de DNT**

   * No painel **Primary Contact**, ativar o checkbox **“Do Not Text”** para qualquer tipo de telefone
   * Informar o motivo quando solicitado
   * **Esperado**: Toast de sucesso: *“Do Not Text flag updated successfully”*
   * Verificar se o checkbox reflete o novo estado
   * Verificar se todos os telefones com o mesmo número tiveram o DNT atualizado

4. **Testar cenários de erro**

   * Tentar atualizar DNC/DNT quando o telefone estiver ausente
   * **Esperado**: Toast de erro: *“Phone not found”*

---

## **Testes via API**

### **Endpoints**

* `POST /uown/svc/updateDnc`
* `POST /uown/svc/updateDnt`

---

### **Casos de Teste**

#### **1. Habilitar DNC**

```bash
POST /uown/svc/updateDnc
{
  "phonePK": <phonePK>,
  "doNotCall": true,
  "reasonForDnc": "Cliente solicitou não receber ligações"
}
```

**Esperado**: Status 200, flag DNC do telefone definida como true, todos os telefones correspondentes atualizados

---

#### **2. Desabilitar DNC**

```bash
POST /uown/svc/updateDnc
{
  "phonePK": <phonePK>,
  "doNotCall": false
}
```

**Esperado**: Status 200, flag DNC do telefone definida como false, todos os telefones correspondentes atualizados

---

#### **3. Habilitar DNT**

```bash
POST /uown/svc/updateDnt
{
  "phonePK": <phonePK>,
  "doNotText": true,
  "reasonForDnt": "Cliente solicitou não receber mensagens"
}
```

**Esperado**: Status 200, flag DNT do telefone definida como true, todos os telefones correspondentes atualizados

---

#### **4. Desabilitar DNT**

```bash
POST /uown/svc/updateDnt
{
  "phonePK": <phonePK>,
  "doNotText": false
}
```

**Esperado**: Status 200, flag DNT do telefone definida como false, todos os telefones correspondentes atualizados

---

## **Checklist de Verificação**

* [ ] Toast de sucesso exibido após atualização bem-sucedida
* [ ] Toast de erro exibido em caso de falha
* [ ] Flags DNC/DNT atualizados corretamente na interface
* [ ] Alterações propagadas para todos os telefones com o mesmo número
* [ ] Registro de atividade criado para alterações de DNC/DNT
* [ ] API retorna os códigos de status corretos
* [ ] Flags independentes (DNC e DNT não afetam um ao outro)

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 2 arquivos
+
5
−
5
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -30,7 +30,7 @@
    "@seontechnologies/seon-id-verification": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.395",
    "@uownleasing/common-ui": "0.0.396",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1660,10 +1660,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.395":
  version "0.0.395"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.395.tgz#38063164256df29150654045f3e6e9cc06c97ecc"
  integrity sha512-Mno5l2CyIh8Vke+ngF20E2l0pm9EPTZjt7xeBsFcH6RfmBT42wR6ToExPJsNKn29J8XLWVD/MUYFJVoOc2LwGA==
"@uownleasing/common-ui@0.0.396":
  version "0.0.396"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.396.tgz#65306f058e315afb9f98d4ab79d94a6955d145d4"
  integrity sha512-7c/N8K6zPhe+YonDiu5JH3nUkVFE/ivqeU7wIL8bxSmLgi5ceQdxF2ELZR6q997pZ40BHukpAxIDenbFTzyz7A==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---


 1 arquivo
+
88
−
8
 src/main/java/com/uownleasing/los/common/service/LosPhoneService.java 
+
88
−
8

Visualizado
@@ -23,26 +23,82 @@ public class LosPhoneService {

    public LosPhone createOrUpdatePhone(PhoneInfo phoneInfo) {
        LosCustomer customer = losCustomerRepo.locateByPk(phoneInfo.getCustomerPK());
        LosPhone phone ;
        if(phoneInfo.getPhonePK() == 0L && phoneInfo.getPhoneType() != PhoneType.OTHER){
        LosPhone phone = findOrCreatePhone(phoneInfo, customer);
        DncValues oldDncValues = captureOldDncValues(phone);
        
        updatePhoneEntity(phone, phoneInfo, customer);
        LosPhone savedPhone = phoneRepo.save(phone);
        
        propagateDncIfNeeded(phoneInfo, oldDncValues, savedPhone.getPk());
        
        return savedPhone;
    }

    private LosPhone findOrCreatePhone(PhoneInfo phoneInfo, LosCustomer customer) {
        if (phoneInfo.getPhonePK() == 0L && phoneInfo.getPhoneType() != PhoneType.OTHER) {
            List<LosPhone> phonesByType = getPhonesByCustomerAndPhoneType(customer.getPk(), phoneInfo.getPhoneType());
            if(phonesByType != null && !phonesByType.isEmpty()){
            if (!CollectionUtils.isEmpty(phonesByType)) {
                phoneInfo.setPhonePK(phonesByType.get(0).getPk());
            }
        }
        if(phoneInfo.getPhonePK() > 0) {
            phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
        
        if (phoneInfo.getPhonePK() > 0) {
            LosPhone phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
            customer.getLosPhones().remove(phone);
            customer.getLosLead().getLosPhones().remove(phone);
        }else{
            phone = new LosPhone();
            return phone;
        }
        
        return new LosPhone();
    }

    private record DncValues(Boolean oldDoNotCall, Boolean oldDoNotText) {
    }

    private DncValues captureOldDncValues(LosPhone phone) {
        if (phone.getPhoneInfo() == null) {
            return new DncValues(null, null);
        }
        return new DncValues(
            phone.getPhoneInfo().getDoNotCall(),
            phone.getPhoneInfo().getDoNotText()
        );
    }

    private void updatePhoneEntity(LosPhone phone, PhoneInfo phoneInfo, LosCustomer customer) {
        phone.setPhoneInfo(phoneInfo);
        phone.setLosCustomer(customer);
        phone.setLosLead(customer.getLosLead());
        customer.getLosLead().getLosPhones().add(phone);
        customer.getLosPhones().add(phone);
        return phoneRepo.save(phone);
    }

    private void propagateDncIfNeeded(PhoneInfo phoneInfo, DncValues oldDncValues, Long excludePhonePk) {
        if (phoneInfo.getAreaCode() == null || phoneInfo.getPhoneNumber() == null) {
            return;
        }
        
        Boolean oldDoNotCall = oldDncValues.oldDoNotCall();
        Boolean newDoNotCall = phoneInfo.getDoNotCall();
        boolean dncChanged = (oldDoNotCall == null && Boolean.TRUE.equals(newDoNotCall)) ||
                            (oldDoNotCall != null && !oldDoNotCall.equals(newDoNotCall));
        
        Boolean oldDoNotText = oldDncValues.oldDoNotText();
        Boolean newDoNotText = phoneInfo.getDoNotText();
        boolean dntChanged = (oldDoNotText == null && Boolean.TRUE.equals(newDoNotText)) ||
                             (oldDoNotText != null && !oldDoNotText.equals(newDoNotText));
        
        if (dncChanged || dntChanged) {
            propagateDncFlagsByPhoneNumber(
                phoneInfo.getAreaCode(),
                phoneInfo.getPhoneNumber(),
                phoneInfo.getDoNotCall(),
                phoneInfo.getDoNotText(),
                phoneInfo.getReasonForDnc(),
                phoneInfo.getReasonForDnt(),
                excludePhonePk
            );
        }
    }

    public List<LosPhone> updateByPhoneNumber(PhoneInfo phoneInfo, String areaCode, Long phoneNumber) {
@@ -72,4 +128,28 @@ public class LosPhoneService {
        return CollectionUtils.isNotEmpty(phones) ? phones : Collections.emptyList();
    }

    private void propagateDncFlagsByPhoneNumber(String areaCode, Long phoneNumber, 
                                               Boolean doNotCall, Boolean doNotText,
                                               String reasonForDnc, String reasonForDnt,
                                               Long excludePhonePk) {
        List<LosPhone> phones = phoneRepo.findAllByPhoneInfo_AreaCodeAndPhoneInfo_PhoneNumber(areaCode, phoneNumber);
        if (CollectionUtils.isNotEmpty(phones)) {
            for(LosPhone phone : phones) {
                // Skip the phone that triggered the change
                if(excludePhonePk != null && phone.getPk() == excludePhonePk) {
                    continue;
                }
                
                PhoneInfo existingPhoneInfo = phone.getPhoneInfo();
                if(existingPhoneInfo != null) {
                    existingPhoneInfo.setDoNotCall(doNotCall);
                    existingPhoneInfo.setDoNotText(doNotText);
                    existingPhoneInfo.setReasonForDnc(reasonForDnc);
                    existingPhoneInfo.setReasonForDnt(reasonForDnt);
                    phoneRepo.save(phone);
                }
            }
        }
    }

}

---


 2 arquivos
+
6
−
1
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src/lib/donot
‎contact-modal‎

inde
‎x.tsx‎
+5 -0

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/donotcontact-modal/index.tsx 
+
5
−
0

Visualizado
@@ -144,6 +144,11 @@ const DoNotContactModal = ({
          label="Reason"
          placeholder={`The reason for ${dnc}`}
        />
        {dncType === 'doNotCallMobile' && (
Priyanka Namburu
Priyanka Namburu
@pnamburu
1 semana atrás
Owner
dncType === 'doNotCallMobile'??

Fernando Martins
Fernando Martins
@fernandogmartins
1 semana atrás
Autor
Maintainer
This is a previously implemented logic that's used to trigger different modals. The doNotCallMobile one identifies the DNC

![alt text](image.png)

Responder…
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d' }}>
            * This will affect all accounts with this number
          </div>
        )}
      </Form>
    </Modal>
  );
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.395",
  "version": "0.0.396",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

---


 2 arquivos
+
5
−
5
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -29,7 +29,7 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.395",
    "@uownleasing/common-ui": "0.0.396",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1802,10 +1802,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.395":
  version "0.0.395"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.395.tgz#38063164256df29150654045f3e6e9cc06c97ecc"
  integrity sha512-Mno5l2CyIh8Vke+ngF20E2l0pm9EPTZjt7xeBsFcH6RfmBT42wR6ToExPJsNKn29J8XLWVD/MUYFJVoOc2LwGA==
"@uownleasing/common-ui@0.0.396":
  version "0.0.396"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.396.tgz#65306f058e315afb9f98d4ab79d94a6955d145d4"
  integrity sha512-7c/N8K6zPhe+YonDiu5JH3nUkVFE/ivqeU7wIL8bxSmLgi5ceQdxF2ELZR6q997pZ40BHukpAxIDenbFTzyz7A==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---


 1 arquivo
+
62
−
12
 src/main/java/com/uownleasing/svc/common/service/PhoneService.java 
+
62
−
12

Visualizado
@@ -3,8 +3,6 @@ package com.uownleasing.svc.common.service;
import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.*;
import com.uownleasing.common.utils.*;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.db.repository.*;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvCustomer;
import com.uownleasing.svc.common.db.entity.SvPhone;
@@ -37,29 +35,81 @@ public class PhoneService {

    public SvPhone createOrUpdatePhone(PhoneInfo phoneInfo) {
        SvCustomer customer = customerRepo.locateByPk(phoneInfo.getCustomerPK());
        SvPhone phone ;
        if(phoneInfo.getPhonePK() <= 0){
            List<SvPhone> phones = phoneRepo.findAllByPhoneInfo_PhoneTypeAndCustomer_Pk(phoneInfo.getPhoneType(), phoneInfo.getCustomerPK());
            phones = CollectionUtils.isEmpty(phones) ? Collections.emptyList() : phones;
            if(phones != null && !phones.isEmpty()){
        SvPhone phone = findOrCreatePhone(phoneInfo, customer);
        
        updatePhoneEntity(phone, phoneInfo, customer);

        return phoneRepo.save(phone);
    }

    private SvPhone findOrCreatePhone(PhoneInfo phoneInfo, SvCustomer customer) {
        if (phoneInfo.getPhonePK() <= 0) {
            List<SvPhone> phones = phoneRepo.findAllByPhoneInfo_PhoneTypeAndCustomer_Pk(
                phoneInfo.getPhoneType(), phoneInfo.getCustomerPK());
            if (!CollectionUtils.isEmpty(phones)) {
                phoneInfo.setPhonePK(phones.get(0).getPk());
            }
        }
        if(phoneInfo.getPhonePK() > 0) {
            phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
        
        if (phoneInfo.getPhonePK() > 0) {
            SvPhone phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
            customer.getPhones().remove(phone);
            customer.getAccount().getPhones().remove(phone);
        }else{
            phone = new SvPhone();
            return phone;
        }
        
        return new SvPhone();
    }

    private void updatePhoneEntity(SvPhone phone, PhoneInfo phoneInfo, SvCustomer customer) {
        phone.setPhoneInfo(phoneInfo);
        phone.setCustomer(customer);
        phone.setAccount(customer.getAccount());
        customer.getAccount().getPhones().add(phone);
        customer.getPhones().add(phone);
        return phoneRepo.save(phone);
    }

    public SvPhone updateDnc(PhoneInfo phoneInfo) {
        SvPhone phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
        PhoneInfo existingPhoneInfo = phone.getPhoneInfo();
        
        String areaCode = existingPhoneInfo.getAreaCode();
        Long phoneNumber = existingPhoneInfo.getPhoneNumber();
        List<SvPhone> phones = phoneRepo.findAllByPhoneInfo_AreaCodeAndPhoneInfo_PhoneNumber(areaCode, phoneNumber);
        if (!CollectionUtils.isEmpty(phones)) {
            for (SvPhone p : phones) {
                PhoneInfo pInfo = p.getPhoneInfo();
                if (pInfo != null) {
                    pInfo.setDoNotCall(phoneInfo.getDoNotCall());
                    pInfo.setReasonForDnc(phoneInfo.getReasonForDnc());
                    phoneRepo.save(p);
                }
            }
        }
        
        return phone;
    }

    public SvPhone updateDnt(PhoneInfo phoneInfo) {
        SvPhone phone = phoneRepo.locateByPk(phoneInfo.getPhonePK());
        PhoneInfo existingPhoneInfo = phone.getPhoneInfo();
        
        String areaCode = existingPhoneInfo.getAreaCode();
        Long phoneNumber = existingPhoneInfo.getPhoneNumber();
        List<SvPhone> phones = phoneRepo.findAllByPhoneInfo_AreaCodeAndPhoneInfo_PhoneNumber(areaCode, phoneNumber);
        if (!CollectionUtils.isEmpty(phones)) {
            for (SvPhone p : phones) {
                PhoneInfo pInfo = p.getPhoneInfo();
                if (pInfo != null) {
                    pInfo.setDoNotText(phoneInfo.getDoNotText());
                    pInfo.setReasonForDnt(phoneInfo.getReasonForDnt());
                    phoneRepo.save(p);
                }
            }
        }
        
        return phone;
    }

    public List<SvPhone> updateByPhoneNumber(PhoneInfo phoneInfo, String areaCode, Long phoneNumber) {
        List<SvPhone> phones = phoneRepo.findAllByPhoneInfo_AreaCodeAndPhoneInfo_PhoneNumber(areaCode,phoneNumber);

---


 2 arquivos
+
11
−
1
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

rest
‎/svc‎

SvcAccountCo
‎ntroller.java‎
+10 -0

ser
‎vice‎

Five9Ser
‎vice.java‎
+1 -1

 src/main/java/com/uownleasing/svc/rest/svc/SvcAccountController.java 
+
10
−
0

Visualizado
@@ -211,6 +211,16 @@ public class SvcAccountController {
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
 src/main/java/com/uownleasing/svc/service/Five9Service.java 
+
1
−
1

Visualizado
@@ -64,7 +64,7 @@ public class Five9Service {
                boolean currentValue = Boolean.TRUE.equals(info.getDoNotText());
                if (currentValue != desiredValue) {
                    info.setDoNotText(desiredValue);
                    phoneService.createOrUpdatePhone(info);
                    phoneService.updateDnt(info);
                    updated++;
                }
            }

---


 3 arquivos
+
82
−
18
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src
‎/lib‎

donotcont
‎act-modal‎

inde
‎x.tsx‎
+60 -15

layouts/collapsable-
‎edit/primary-contact‎

inde
‎x.tsx‎
+21 -2

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/donotcontact-modal/index.tsx 
+
60
−
15

Visualizado
@@ -12,6 +12,16 @@ interface DoNotContactModalProps {
  handleSubmit?: (data: any) => Promise<number>;
  requireReason?: boolean;
  portalType?: PortalType;
  onDncUpdate?: (
    dncType: string,
    doNotCall: boolean,
    reasonForDnc?: string
  ) => Promise<number>;
  onDntUpdate?: (
    dncType: string,
    doNotText: boolean,
    reasonForDnt?: string
  ) => Promise<number>;
}

const DoNotContactModal = ({
@@ -21,6 +31,8 @@ const DoNotContactModal = ({
  handleSubmit,
  requireReason = false,
  portalType,
  onDncUpdate,
  onDntUpdate,
}: DoNotContactModalProps) => {
  const [dnc, setDnc] = useState(dncType);

@@ -110,6 +122,16 @@ const DoNotContactModal = ({
          checkbox.checked = true;
        }
        setIsModalOpen(false);

        const isDncType = dncType.startsWith('doNotCall');
        const isDntType = dncType.startsWith('doNotText');

        if (isDncType && onDncUpdate) {
          await onDncUpdate(dncType, true, formik?.values?.note);
        } else if (isDntType && onDntUpdate) {
          await onDntUpdate(dncType, true, formik?.values?.note);
        }

        if (handleSubmit) {
          await handleSubmit({
            ...updateContactFormik?.values,
@@ -119,21 +141,44 @@ const DoNotContactModal = ({
        }
      }}
      onCancelButton={async () => {
        await updateContactFormik.setFieldValue('doNotCallMobileReason', '');
        await updateContactFormik.setFieldValue('doNotCallMobile', false);
        await updateContactFormik.setFieldValue('doNotTextMobileReason', '');
        await updateContactFormik.setFieldValue('doNotTextMobile', false);
        await updateContactFormik.setFieldValue('doNotCallWorkReason', '');
        await updateContactFormik.setFieldValue('doNotCallWork', false);
        await updateContactFormik.setFieldValue('doNotTextWorkReason', '');
        await updateContactFormik.setFieldValue('doNotTextWork', false);
        await updateContactFormik.setFieldValue('doNotCallHomeReason', '');
        await updateContactFormik.setFieldValue('doNotCallHome', false);
        await updateContactFormik.setFieldValue('doNotTextHomeReason', '');
        await updateContactFormik.setFieldValue('doNotTextHome', false);
        await updateContactFormik.setFieldValue('doNotEmailPrimary', false);
        formik.resetForm();

        const checkbox = document.getElementById(dncType) as HTMLInputElement;
        checkbox.checked = false;
        if (checkbox) {
          checkbox.checked = false;
        }

        // Only reset the specific field that corresponds to the dncType being edited
        switch (dncType) {
          case 'doNotCallMobile':
            await updateContactFormik.setFieldValue('doNotCallMobileReason', '');
            await updateContactFormik.setFieldValue('doNotCallMobile', false);
            break;
          case 'doNotTextMobile':
            await updateContactFormik.setFieldValue('doNotTextMobileReason', '');
            await updateContactFormik.setFieldValue('doNotTextMobile', false);
            break;
          case 'doNotCallWork':
            await updateContactFormik.setFieldValue('doNotCallWorkReason', '');
            await updateContactFormik.setFieldValue('doNotCallWork', false);
            break;
          case 'doNotTextWork':
            await updateContactFormik.setFieldValue('doNotTextWorkReason', '');
            await updateContactFormik.setFieldValue('doNotTextWork', false);
            break;
          case 'doNotCallHome':
            await updateContactFormik.setFieldValue('doNotCallHomeReason', '');
            await updateContactFormik.setFieldValue('doNotCallHome', false);
            break;
          case 'doNotTextHome':
            await updateContactFormik.setFieldValue('doNotTextHomeReason', '');
            await updateContactFormik.setFieldValue('doNotTextHome', false);
            break;
          case 'doNotEmailPrimary':
            await updateContactFormik.setFieldValue('doNotEmailPrimaryReason', '');
            await updateContactFormik.setFieldValue('doNotEmailPrimary', false);
            break;
        }
      }}
    >
      <Form id="dncForm" onSubmit={formik.handleSubmit}>
@@ -144,7 +189,7 @@ const DoNotContactModal = ({
          label="Reason"
          placeholder={`The reason for ${dnc}`}
        />
        {dncType === 'doNotCallMobile' && (
        {(dncType === 'doNotCallMobile' || dncType === 'doNotTextMobile') && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#6c757d' }}>
            * This will affect all accounts with this number
          </div>

---


 5 arquivos
+
121
−
5
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

custom
‎er.tsx‎
+52 -0

pages/custome
‎r-information‎

[accou
‎nt].tsx‎
+59 -0

packag
‎e.json‎
+1 -1

serv
‎er.js‎
+5 -0

yarn
‎.lock‎
+4 -4

 domain/stores/customer.tsx 
+
52
−
0

Visualizado
@@ -825,6 +825,58 @@ export class CustomerStore extends BaseStore {
    return (response && response?.status) || 500;
  };

  @action
  updateDnc = async (phoneInfo: {
    phonePK: number;
    doNotCall: boolean;
    reasonForDnc?: string;
  }): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/svc/updateDnc',
      data: phoneInfo,
    });

    const accountPk = this.primaryCustomerContactInfo?.accountPk;
    if (accountPk) {
      await this.getPrimaryCustomerContactInfo(accountPk);
    }

    utilityStore?.setIsLoading(false);
    return {
      message: response?.message,
      status: response?.status || 500,
    };
  };

  @action
  updateDnt = async (phoneInfo: {
    phonePK: number;
    doNotText: boolean;
    reasonForDnt?: string;
  }): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/svc/updateDnt',
      data: phoneInfo,
    });

    const accountPk = this.primaryCustomerContactInfo?.accountPk;
    if (accountPk) {
      await this.getPrimaryCustomerContactInfo(accountPk);
    }

    utilityStore?.setIsLoading(false);
    return {
      message: response?.message,
      status: response?.status || 500,
    };
  };

  @action
  createOrUpdatePrimaryCustomerContactInfo = async (
    primaryCustomerContactInfoRequest: PrimaryContactPanelDataCollection,
 pages/customer-information/[account].tsx 
+
59
−
0

Visualizado
@@ -462,6 +462,9 @@ const CustomerInformation = (props: CustomerInformationProps) => {
      doNotTextHomeReason: home?.reasonForDnt || '',
      doNotEmailPrimary: emailObj?.doNotEmail,
      doNotEmailPrimaryReason: emailObj?.reasonForDnc || '',
      mobilePhonePK: mobile?.phonePK,
      workPhonePK: work?.phonePK,
      homePhonePK: home?.phonePK,
    };
  }, [customerStore.primaryCustomerContactInfo]);

@@ -670,6 +673,62 @@ const CustomerInformation = (props: CustomerInformationProps) => {
                  hasCreateOrUpdatePrimaryCustomerContactInfoPermission
                }
                portalType={PortalType.SERVICING}
                onDncUpdate={async (dncType: string, doNotCall: boolean, reasonForDnc?: string) => {
                  // Derive phonePK from dncType
                  let phonePK: number | undefined;
                  if (dncType === 'doNotCallMobile') {
                    phonePK = primaryContactPanelInfo.mobilePhonePK;
                  } else if (dncType === 'doNotCallWork') {
                    phonePK = primaryContactPanelInfo.workPhonePK;
                  } else if (dncType === 'doNotCallHome') {
                    phonePK = primaryContactPanelInfo.homePhonePK;
                  }
                  
                  if (!phonePK || phonePK <= 0) {
                    showToast('error', 'Phone not found');
                    return 400;
                  }
                  
                  const response = await customerStore.updateDnc({
                    phonePK,
                    doNotCall,
                    reasonForDnc,
                  });
                  if (response.status === 200) {
                    showToast('success', 'Do Not Call flag updated successfully');
                  } else {
                    showToast('error', 'Failed to update Do Not Call flag');
                  }
                  return response.status;
                }}
                onDntUpdate={async (dncType: string, doNotText: boolean, reasonForDnt?: string) => {
                  // Derive phonePK from dncType
                  let phonePK: number | undefined;
                  if (dncType === 'doNotTextMobile') {
                    phonePK = primaryContactPanelInfo.mobilePhonePK;
                  } else if (dncType === 'doNotTextWork') {
                    phonePK = primaryContactPanelInfo.workPhonePK;
                  } else if (dncType === 'doNotTextHome') {
                    phonePK = primaryContactPanelInfo.homePhonePK;
                  }
                  
                  if (!phonePK || phonePK <= 0) {
                    showToast('error', 'Phone not found');
                    return 400;
                  }
                  
                  const response = await customerStore.updateDnt({
                    phonePK,
                    doNotText,
                    reasonForDnt,
                  });
                  if (response.status === 200) {
                    showToast('success', 'Do Not Text flag updated successfully');
                  } else {
                    showToast('error', 'Failed to update Do Not Text flag');
                  }
                  return response.status;
                }}
              />
            )}
          </div>

---


 5 arquivos
+
121
−
5
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

custom
‎er.tsx‎
+52 -0

pages/custome
‎r-information‎

[accou
‎nt].tsx‎
+59 -0

packag
‎e.json‎
+1 -1

serv
‎er.js‎
+5 -0

yarn
‎.lock‎
+4 -4

 domain/stores/customer.tsx 
+
52
−
0

Visualizado
@@ -825,6 +825,58 @@ export class CustomerStore extends BaseStore {
    return (response && response?.status) || 500;
  };

  @action
  updateDnc = async (phoneInfo: {
    phonePK: number;
    doNotCall: boolean;
    reasonForDnc?: string;
  }): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/svc/updateDnc',
      data: phoneInfo,
    });

    const accountPk = this.primaryCustomerContactInfo?.accountPk;
    if (accountPk) {
      await this.getPrimaryCustomerContactInfo(accountPk);
    }

    utilityStore?.setIsLoading(false);
    return {
      message: response?.message,
      status: response?.status || 500,
    };
  };

  @action
  updateDnt = async (phoneInfo: {
    phonePK: number;
    doNotText: boolean;
    reasonForDnt?: string;
  }): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/svc/updateDnt',
      data: phoneInfo,
    });

    const accountPk = this.primaryCustomerContactInfo?.accountPk;
    if (accountPk) {
      await this.getPrimaryCustomerContactInfo(accountPk);
    }

    utilityStore?.setIsLoading(false);
    return {
      message: response?.message,
      status: response?.status || 500,
    };
  };

  @action
  createOrUpdatePrimaryCustomerContactInfo = async (
    primaryCustomerContactInfoRequest: PrimaryContactPanelDataCollection,
 pages/customer-information/[account].tsx 
+
59
−
0

Visualizado
@@ -462,6 +462,9 @@ const CustomerInformation = (props: CustomerInformationProps) => {
      doNotTextHomeReason: home?.reasonForDnt || '',
      doNotEmailPrimary: emailObj?.doNotEmail,
      doNotEmailPrimaryReason: emailObj?.reasonForDnc || '',
      mobilePhonePK: mobile?.phonePK,
      workPhonePK: work?.phonePK,
      homePhonePK: home?.phonePK,
    };
  }, [customerStore.primaryCustomerContactInfo]);

@@ -670,6 +673,62 @@ const CustomerInformation = (props: CustomerInformationProps) => {
                  hasCreateOrUpdatePrimaryCustomerContactInfoPermission
                }
                portalType={PortalType.SERVICING}
                onDncUpdate={async (dncType: string, doNotCall: boolean, reasonForDnc?: string) => {
                  // Derive phonePK from dncType
                  let phonePK: number | undefined;
                  if (dncType === 'doNotCallMobile') {
                    phonePK = primaryContactPanelInfo.mobilePhonePK;
                  } else if (dncType === 'doNotCallWork') {
                    phonePK = primaryContactPanelInfo.workPhonePK;
                  } else if (dncType === 'doNotCallHome') {
                    phonePK = primaryContactPanelInfo.homePhonePK;
                  }
                  
                  if (!phonePK || phonePK <= 0) {
                    showToast('error', 'Phone not found');
                    return 400;
                  }
                  
                  const response = await customerStore.updateDnc({
                    phonePK,
                    doNotCall,
                    reasonForDnc,
                  });
                  if (response.status === 200) {
                    showToast('success', 'Do Not Call flag updated successfully');
                  } else {
                    showToast('error', 'Failed to update Do Not Call flag');
                  }
                  return response.status;
                }}
                onDntUpdate={async (dncType: string, doNotText: boolean, reasonForDnt?: string) => {
                  // Derive phonePK from dncType
                  let phonePK: number | undefined;
                  if (dncType === 'doNotTextMobile') {
                    phonePK = primaryContactPanelInfo.mobilePhonePK;
                  } else if (dncType === 'doNotTextWork') {
                    phonePK = primaryContactPanelInfo.workPhonePK;
                  } else if (dncType === 'doNotTextHome') {
                    phonePK = primaryContactPanelInfo.homePhonePK;
                  }
                  
                  if (!phonePK || phonePK <= 0) {
                    showToast('error', 'Phone not found');
                    return 400;
                  }
                  
                  const response = await customerStore.updateDnt({
                    phonePK,
                    doNotText,
                    reasonForDnt,
                  });
                  if (response.status === 200) {
                    showToast('success', 'Do Not Text flag updated successfully');
                  } else {
                    showToast('error', 'Failed to update Do Not Text flag');
                  }
                  return response.status;
                }}
              />
            )}
          </div>

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Camadas impactadas

* UI (Common-UI + Servicing frontend)
* API REST (`/uown/svc/updateDnc`, `/uown/svc/updateDnt`)
* Backend Java:

  * LOS (`LosPhoneService`)
  * SVC (`PhoneService`)
* Integração Five9

---

# 1. Requisitos Funcionais Derivados (Testáveis)

## RF-01 — Atualização de DNC propaga por número

Quando o flag **Do Not Call** for atualizado em um telefone:

* O sistema **DEVE** localizar todos os telefones com o mesmo:

  * `areaCode`
  * `phoneNumber`
* O flag **doNotCall** deve ser aplicado a **todos eles**
* O motivo (`reasonForDnc`) também deve ser propagado

📌 Evidência no código:

* `LosPhoneService.propagateDncFlagsByPhoneNumber`
* `PhoneService.updateDnc`

---

## RF-02 — Atualização de DNT propaga por número

Quando o flag **Do Not Text** for atualizado:

* O sistema **DEVE** aplicar `doNotText` a todos os telefones com o mesmo número
* O motivo (`reasonForDnt`) deve ser propagado

📌 Evidência no código:

* `LosPhoneService.propagateDncFlagsByPhoneNumber`
* `PhoneService.updateDnt`

---

## RF-03 — Flags DNC e DNT são independentes

* Alterar **DNC** **NÃO** deve alterar **DNT**
* Alterar **DNT** **NÃO** deve alterar **DNC**

📌 Evidência:

* Métodos distintos (`updateDnc`, `updateDnt`)
* Tratamento lógico separado
* Comparação de estado antigo vs novo (`captureOldDncValues`)

---

## RF-04 — Atualização só propaga se houver mudança real

* Se o valor novo for igual ao valor antigo:

  * **NÃO deve ocorrer propagação**
* Se houver mudança (`false → true`, `true → false` ou `null → true`):

  * **DEVE propagar**

📌 Evidência:

```java
if (dncChanged || dntChanged) { ... }
```

---

# 4. Requisitos de Teste — API

## Endpoint: `POST /uown/svc/updateDnc`

### CT-API-01 — Ativar DNC

```json
{
  "phonePK": 123,
  "doNotCall": true,
  "reasonForDnc": "Customer requested"
}
```

* HTTP 200
* Propagação completa

---

### CT-API-02 — Desativar DNC

```json
{
  "phonePK": 123,
  "doNotCall": false
}
```

---

## Endpoint: `POST /uown/svc/updateDnt`

### CT-API-03 — Ativar DNT

```json
{
  "phonePK": 123,
  "doNotText": true,
  "reasonForDnt": "No SMS"
}
```

---

### CT-API-04 — Independência
* Atualizar DNC → validar DNT inalterado
* Atualizar DNT → validar DNC inalterado

---

### CT-API-05 — No-op
* Enviar payload idêntico ao estado atual
* Validar ausência de propagação

---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

* Do not call via interface

![Screenshot_at_Dec_12_09-38-22](/uploads/6f46dd1d52eb15813d0cca4ae750c344/Screenshot_at_Dec_12_09-38-22.png){width=866 height=600}
![Screenshot_at_Dec_12_09-38-46](/uploads/f7b4ed3e043e8f07715cebed7759a61e/Screenshot_at_Dec_12_09-38-46.png){width=900 height=446}
![Screenshot_at_Dec_12_09-39-51](/uploads/6d80892bf50ed0a1c5c94e39f51fd90a/Screenshot_at_Dec_12_09-39-51.png){width=900 height=444}
![Screenshot_at_Dec_12_09-58-06](/uploads/0dfb5fbdbcb4116819d162bd8e785839/Screenshot_at_Dec_12_09-58-06.png){width=415 height=600}

---

* Do Not Text via Interface 

![Screenshot_at_Dec_12_10-22-17](/uploads/b72b817c58ee24f7fd740449f30ad624/Screenshot_at_Dec_12_10-22-17.png){width=900 height=359}
![Screenshot_at_Dec_12_10-22-41](/uploads/d06b6cc5e48d0e5e5563d378c11b8529/Screenshot_at_Dec_12_10-22-41.png){width=536 height=340}
![Screenshot_at_Dec_12_10-40-06](/uploads/ab06a66825308c10e8272577fb0eeee2/Screenshot_at_Dec_12_10-40-06.png){width=757 height=358}
![Screenshot_at_Dec_12_10-40-27](/uploads/076ef96687c8eac9652d5196ac0d56a5/Screenshot_at_Dec_12_10-40-27.png){width=900 height=448}
![Screenshot_at_Dec_12_10-41-45](/uploads/f50c6f815a232d5c510d341879dfc7b2/Screenshot_at_Dec_12_10-41-45.png){width=900 height=424}
![Screenshot_at_Dec_12_10-45-55](/uploads/27b2f1c83dd4d55ee9b9c29f722a763f/Screenshot_at_Dec_12_10-45-55.png){width=739 height=314}
![Screenshot_at_Dec_12_10-46-06](/uploads/8d734c689c16cf3afeb7ec15ca2dff4f/Screenshot_at_Dec_12_10-46-06.png){width=448 height=203}
![Screenshot_at_Dec_12_10-46-13](/uploads/47949da5cbedf22c73a386c6da4bc3f1/Screenshot_at_Dec_12_10-46-13.png){width=558 height=249}
![Screenshot_at_Dec_12_10-46-21](/uploads/55e989d274d5d2fb23523d2ad6428051/Screenshot_at_Dec_12_10-46-21.png){width=587 height=248}
![Screenshot_at_Dec_12_10-46-36](/uploads/a196b5dc5875e9b59eca2622d862063d/Screenshot_at_Dec_12_10-46-36.png){width=485 height=240}
![Screenshot_at_Dec_12_10-47-05](/uploads/d7a781db57500c5d6b3e14e2a8e29c99/Screenshot_at_Dec_12_10-47-05.png){width=900 height=48}
![Screenshot_at_Dec_12_10-47-22](/uploads/4a413ead16e94b67bcd2286bd85fc43c/Screenshot_at_Dec_12_10-47-22.png){width=900 height=47}
![Screenshot_at_Dec_12_10-47-47](/uploads/b7b79dd35df933bf1cd6524cc20b8707/Screenshot_at_Dec_12_10-47-47.png){width=900 height=49}
![Screenshot_at_Dec_12_10-48-12](/uploads/287b90a069610fa77210abcf75185f7e/Screenshot_at_Dec_12_10-48-12.png){width=900 height=40}
![Screenshot_at_Dec_12_10-48-38](/uploads/d29b4894a6ef6a5195949c95511a8dbb/Screenshot_at_Dec_12_10-48-38.png){width=900 height=44}
![Screenshot_at_Dec_12_10-48-51](/uploads/655979f54ba9810d843acbd234490e19/Screenshot_at_Dec_12_10-48-51.png){width=900 height=47}

---

* Do Not Call via API

![Screenshot_at_Dec_12_11-39-22](/uploads/109e331a37b506c5e28277bea47b4404/Screenshot_at_Dec_12_11-39-22.png){width=864 height=600}
![Screenshot_at_Dec_12_11-40-13](/uploads/9ee99cf968c09285374206e9b08d551f/Screenshot_at_Dec_12_11-40-13.png){width=457 height=212}
![Screenshot_at_Dec_12_11-40-25](/uploads/4216a09c48307613efe3cc4df3f96fcb/Screenshot_at_Dec_12_11-40-25.png){width=529 height=240}
![Screenshot_at_Dec_12_11-40-35](/uploads/10e5dab5a96af957f3e9995e8e7da557/Screenshot_at_Dec_12_11-40-35.png){width=589 height=250}
![Screenshot_at_Dec_12_11-40-41](/uploads/2022fd66e100f62bceb3e12dc9fd0637/Screenshot_at_Dec_12_11-40-41.png){width=651 height=254}
![Screenshot_at_Dec_12_11-40-48](/uploads/7c5d57f088f0ffbe248e014e84e77f0d/Screenshot_at_Dec_12_11-40-48.png){width=441 height=215}

---

* Do Not Text via API

![Screenshot_at_Dec_12_14-31-15](/uploads/d5f7e954f55b56c51baa00802a675fa6/Screenshot_at_Dec_12_14-31-15.png){width=409 height=242}
![Screenshot_at_Dec_12_14-31-23](/uploads/090671c22121c48be69d8b7118776a2f/Screenshot_at_Dec_12_14-31-23.png){width=541 height=262}
![Screenshot_at_Dec_12_14-31-29](/uploads/b873336e7438dc393ccefefcb28fbfbe/Screenshot_at_Dec_12_14-31-29.png){width=541 height=226}
![Screenshot_at_Dec_12_14-31-35](/uploads/d1e8c6688ad04d3dc36078834351b95c/Screenshot_at_Dec_12_14-31-35.png){width=601 height=252}
![Screenshot_at_Dec_12_14-32-01](/uploads/714bdf2b740145d4348f0280fbf67bf3/Screenshot_at_Dec_12_14-32-01.png){width=470 height=238}
![Screenshot_at_Dec_12_14-33-05](/uploads/538b9219b6566e15b25ae3a8234b2d39/Screenshot_at_Dec_12_14-33-05.png){width=900 height=454}
![Screenshot_at_Dec_12_14-34-19](/uploads/b7fa6c7d6fc6cc2c077d4ee4cbff2ac1/Screenshot_at_Dec_12_14-34-19.png){width=577 height=255}
![Screenshot_at_Dec_12_14-34-33](/uploads/a694c63a9f808ce0def609d81cb3668b/Screenshot_at_Dec_12_14-34-33.png){width=516 height=205}
![Screenshot_at_Dec_12_14-34-45](/uploads/4860e0296c3e34b6eb960e31609bafcc/Screenshot_at_Dec_12_14-34-45.png){width=582 height=234}
![Screenshot_at_Dec_12_14-35-00](/uploads/b1dffc1cb3ce15d126ad41d128d04f61/Screenshot_at_Dec_12_14-35-00.png){width=462 height=245}
![Screenshot_at_Dec_12_14-34-08](/uploads/dce8cf19548e9b8eeab6c277d523fca0/Screenshot_at_Dec_12_14-34-08.png){width=402 height=234}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG


> ## Tests in stg

* Do not call via interface

![image](/uploads/056ca49479076677dca46b7ea057b2d4/image.png){width=535 height=313}
![image](/uploads/39136d52d63aaa3ad32f7450fa51bb18/image.png){width=900 height=446}
![image](/uploads/3924cc3c44515788f4daaec22417e3ab/image.png){width=900 height=459}
![image](/uploads/b24ee5d762e6154b61b106e1a2f20fbe/image.png){width=536 height=345}
![image](/uploads/8cef5370a400e67420f1e4d648403232/image.png){width=900 height=453}
![image](/uploads/202514417ec741c4896769a5d793a698/image.png){width=900 height=447}


---

* Do Not Text via Interface 

![image](/uploads/e06bf21028802bd98ff3d821977b0ca3/image.png){width=900 height=352}
![image](/uploads/8b1bd7fcdc9a1e2d5afe755fdd3bfe1a/image.png){width=900 height=440}
![image](/uploads/ee6dca72e7ca2c1a42a6704efd9eebc2/image.png){width=900 height=451}
![image](/uploads/97eb4c78daad2f84174555cfcc0e6a4b/image.png){width=549 height=315}
![image](/uploads/814be5fd5e7eca3fdc1f4dadd137d269/image.png){width=900 height=432}
![image](/uploads/eb63e3fc9599541af873eabd663a3696/image.png){width=531 height=274}

---

* Do Not Call via API

![image](/uploads/71f9e60268aa7ee6007c04694bc026dd/image.png){width=664 height=600}
![image](/uploads/d6719abdd269f560fa74e613151d060d/image.png){width=799 height=600}
![image](/uploads/0a7367b10053fc7e98ebe7a99b8a4ea7/image.png){width=751 height=600}
![image](/uploads/616c8d246e81bb852088545394a79fad/image.png){width=772 height=600}
![image](/uploads/bc748b342c07a6749f6378551d2b7f50/image.png){width=764 height=600}
![image](/uploads/228ef010285bbb9cefd1793c81b4606d/image.png){width=636 height=337}
![image](/uploads/ed28561b524dd8c726abff636eef7196/image.png){width=550 height=328}

---

* Do Not Text via API

![image](/uploads/a973faf7b98ee2db6b671ed2686e955e/image.png){width=768 height=600}
![image](/uploads/c6cd5ce53aa3e408b9ba42ba5a490bdc/image.png){width=767 height=600}
![image](/uploads/8631256d95c17615eaf30304d5cfbcbf/image.png){width=757 height=600}
![image](/uploads/29eb1e848c099d0bc51905e5fae9e8ec/image.png){width=543 height=339}
![image](/uploads/cb15c32a0997e332e9332001fa094c8b/image.png){width=549 height=307}

---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
