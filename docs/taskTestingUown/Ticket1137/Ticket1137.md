----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1137


UOWN | Origination | Send Application – Mobile Phone Field Accepts Letters and Special Characters


BUG:
In the Origination Portal, on the Send Application page, the Mobile Phone field incorrectly allows users to enter letters and special characters when the input begins with them.
In this scenario, the input mask is not applied, and the system only blocks invalid characters after a number has been entered.
If the user proceeds by clicking Next, an error message correctly appears indicating that the phone number must contain exactly 10 digits.
However, this behavior can cause confusion because users are initially allowed to type invalid characters.


FIX:
Adjust input validation so the Mobile Phone field only accepts numeric characters (0–9) from the first keystroke.
Ensure the input mask is always applied, even when the first entered character is invalid.
Prevent any non-numeric input (letters or special characters) in all cases.
Test across different browsers and devices to confirm consistent behavior.
Validate that the Next button continues to display an error message if fewer than 10 digits are entered.


Steps-to-Reproduce:
Go to the Send Application page in the Origination Portal.
In the Mobile Phone field, begin typing using letters or special characters.
Observe that these characters are accepted and that the mask is not applied.
If the input begins with a number, the mask works properly and letters/special characters are not accepted.
Click Next to proceed with an invalid phone number and observe the error message.


Expected Result:
The Mobile Phone field should never allow letters or special characters, regardless of the order of input, and the mask should always apply.

Actual Result:
When starting with letters or special characters, the field accepts invalid input and does not apply the mask.



TEST STEPS
Steps:
User is on either the Send Application or Complete Application page, you must test these two pages.
Locate the Mobile Phone input field.
Try typing a letter (e.g., “a”).
Try typing a special character (e.g., “@”).
Try typing a number (e.g., “5”).

Expected Results:
Steps 3 and 4: No input should appear in the field (letters and special characters are blocked).
Step 5: The number should appear correctly.
The input mask (e.g., (XXX) XXX-XXXX) should be applied starting from the first numeric character.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

 3 arquivos
+
91
−
9
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

modals/confi
‎rmation-modal‎

inde
‎x.tsx‎
+9 -4

program-set
‎tings-table‎

inde
‎x.tsx‎
+20 -3

pages/prog
‎ramSettings‎

inde
‎x.tsx‎
+62 -2

 components/modals/confirmation-modal/index.tsx 
+
9
−
4

Visualizado
import React from 'react';
import React, {ReactNode} from 'react';
import {Modal} from '@uownleasing/common-ui';

interface ConfirmationModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handleSubmit: () => void;
  body?: ReactNode;
}
const ConfirmationModal = (props: ConfirmationModalProps) => {
  const {isOpen, setIsOpen, handleSubmit} = props;
const ConfirmationModal = ({
  isOpen,
  setIsOpen,
  handleSubmit,
  body,
}: ConfirmationModalProps) => {
  return (
    <Modal
      title="Please Confirm"
@@ -16,7 +21,7 @@ const ConfirmationModal = (props: ConfirmationModalProps) => {
      hasFooter
      primaryButtonText="Continue"
      onPrimaryButtonSubmit={handleSubmit}>
      Are you sure you want to continue?
      {body ? body : 'Are you sure you want to continue?'}
    </Modal>
  );
};
 components/program-settings-table/index.tsx 
+
20
−
3

Visualizado
@@ -18,12 +18,20 @@ interface Props {
  setProgramsSelectedPks: (pks: number[]) => void;
  programGroups: string[];
  refreshPrograms: boolean;
  setAllProgramsSelectedData: (
    data: null | {
      search: string;
      count: number;
      groupName: string;
    },
  ) => void;
}

export const ProgramSettingsTable = ({
  programStore,
  utilityStore,
  setProgramsSelectedPks,
  setAllProgramsSelectedData,
  programGroups,
  refreshPrograms,
}: Props) => {
@@ -142,9 +150,18 @@ export const ProgramSettingsTable = ({
        paginationDefaultPage={
          programStore?.paginationSettings?.pageNumber + 1 || 0
        }
        onSelectedRowsChange={(r) =>
          onSelectedRowsChange(r.selectedRows as {pk: number}[])
        }
        onSelectedRowsChange={(r) => {
          if (r.allSelected) {
            setAllProgramsSelectedData({
              search: searchFormik.values.search,
              count: paginationTotalRows,
              groupName: searchFormik.values.groupName,
            });
          } else {
            setAllProgramsSelectedData(null);
          }
          onSelectedRowsChange(r.selectedRows as {pk: number}[]);
        }}
        paginationPerPage={paginationPerPage}
        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
        paginationTotalRows={paginationTotalRows}
 pages/programSettings/index.tsx 
+
62
−
2

Visualizado
@@ -7,9 +7,10 @@ import styles from './index.module.scss';
import {ProgramSettingsPanel} from '@components/program-settings-panel';
import {ProgramSettingsButtons} from '@components/program-settings-buttons';
import {ProgramSettingsTable} from '@components/program-settings-table';
import {showToast} from '@uownleasing/common-utilities';
import {convertCurrencyToFloat, showToast} from '@uownleasing/common-utilities';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import ConfirmationModal from '@components/modals/confirmation-modal';

interface Props {
  programStore: ProgramStore;
@@ -21,6 +22,13 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {

  const [programGroups, setProgramGroups] = useState([]);
  const [refreshPrograms, setRefreshPrograms] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [allProgramsSelectedData, setAllProgramsSelectedData] =
    useState<null | {
      search: string;
      count: number;
      groupName: string;
    }>(null);

  const formik = useFormik({
    initialValues: {
@@ -57,6 +65,7 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
        programData: {},
        programPks: values.programsSelectedPks,
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value === formik.initialValues[key]) {
          return;
@@ -70,12 +79,31 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
          }
        }

        if (
          key === 'payoffDiscount' ||
          key === 'epoFeePercent' ||
          key === 'dealerDiscount' ||
          key === 'moneyFactor'
        ) {
          body.programData[key] = value / 100;
        }

        if (
          key === 'minCartAmount' ||
          key === 'maxCartAmount' ||
          key === 'processingFeeOverride' ||
          key === 'amountChargedAtSigning'
        ) {
          body.programData[key] = convertCurrencyToFloat(value);
        }

        if (key === 'allowedFrequencyOverride') {
          body.programData[key] = value
            .map((v: {value: string}) => v.value)
            .join(',');
        }
      });

      const {status} = await programStore.updatePrograms(body);

      if (status >= 400) {
@@ -89,9 +117,32 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
      showToast('success', 'Programs have been successfully updated!');
      formik.resetForm();
      setRefreshPrograms(true);
      setIsConfirmationModalOpen(false);
    },
  });

  const confirmAction = async () => {
    if (!allProgramsSelectedData) {
      formik.handleSubmit();
      return;
    }

    const result = await programStore?.getAllMerchantPrograms(
      allProgramsSelectedData.search,
      0,
      allProgramsSelectedData.count,
      false,
      allProgramsSelectedData.groupName,
    );

    formik.setFieldValue(
      'programsSelectedPks',
      result.data.merchantPrograms.map(({pk}) => pk),
    );

    setIsConfirmationModalOpen(true);
  };

  useEffect(() => {
    const fetchProgramGroups = async () => {
      const {data, status} = await programStore.getMerchantProgramsGroupName();
@@ -124,7 +175,7 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
        <ProgramSettingsButtons
          save={{
            onClick: () => {
              formik.handleSubmit();
              confirmAction();
            },
            disabled:
              isSaveBtnDisabled ||
@@ -141,6 +192,14 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
          }}
        />
      }>
      <ConfirmationModal
        handleSubmit={() => {
          formik.handleSubmit();
        }}
        isOpen={isConfirmationModalOpen}
        setIsOpen={() => setIsConfirmationModalOpen((previus) => !previus)}
        body={`You're about to apply this change to all ${allProgramsSelectedData?.count.toString()} programs!`}
      />
      <div className={styles.componentsContainer}>
        <ProgramSettingsTable
          refreshPrograms={refreshPrograms}
@@ -149,6 +208,7 @@ const ProgramSettings = ({programStore, utilityStore}: Props) => {
          setProgramsSelectedPks={(pks) =>
            formik.setFieldValue('programsSelectedPks', pks)
          }
          setAllProgramsSelectedData={setAllProgramsSelectedData}
          programGroups={programGroups}
        />
        <ProgramSettingsPanel

---        


 3 arquivos
+
11
−
3
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src
‎/lib‎

formik
‎-input‎

inde
‎x.tsx‎
+9 -2

inp
‎uts‎

inde
‎x.tsx‎
+1 -0

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/formik-input/index.tsx 
+
9
−
2

Visualizado
@@ -312,6 +312,8 @@ export const formatPhoneNumber = (
  let formattedValue = unformattedValue;
  let isKeyDelete = false;

  if (!isNumeric(clearValue)) return '';

  if (e) {
    const eventType: InputEventInit = e?.nativeEvent;
    const eventTypeName = eventType?.inputType || '';
@@ -414,6 +416,7 @@ export interface FormikInputProps
  checkboxSelectButtonClick?: any;
  checkboxSelectButtonDisabled?: boolean;
  isCalendarPositionFixed?: boolean;
  allowNegativeNumbers?: boolean;
}

export const FormikInput = (props: FormikInputProps) => {
@@ -469,6 +472,7 @@ export const FormikInput = (props: FormikInputProps) => {
    checkboxSelectButtonClick,
    checkboxSelectButtonDisabled,
    isCalendarPositionFixed,
    allowNegativeNumbers = false,
    ...inputProps
  } = props;

@@ -1229,8 +1233,11 @@ export const FormikInput = (props: FormikInputProps) => {
              }

              if (isDecimal) {
                if (isNumeric(e?.target?.value)) {
                  if (hasMaxTwoDecimalPlaces(e?.target?.value)) {
                const negativeNumersRegex = /^-?\d*(\.\d*)?$/;
                const value = e?.target?.value;
                const isValid = allowNegativeNumbers ?  negativeNumersRegex.test(value) : isNumeric(value);
                if (isValid) {
                  if (hasMaxTwoDecimalPlaces(value)) {
                    formik?.handleChange(e);
                  }
                  return;
 libs/common-ui/src/lib/inputs/index.tsx 
+
1
−
0

Visualizado
@@ -108,6 +108,7 @@ export interface InputFieldProps
  checkboxSelectButtonClick?: any;
  checkboxSelectButtonDisabled?: boolean;
  isCalendarPositionFixed?: boolean;
  allowNegativeNumbers?: boolean;
}

export const InputField = (props: InputFieldProps) => {
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.386",
  "version": "0.0.387",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Quando um usuário acessa a página Send Application no Origination Portal e clica no campo Mobile Phone, o campo deve estar vazio e pronto para entrada de dados, exibindo um placeholder ou máscara visual (ex: (XXX) XXX-XXXX) indicando o formato esperado
1. When a user accesses the Send Application page in the Origination Portal and clicks on the Mobile Phone field, the field must be empty and ready for data entry, displaying a placeholder indicating the expected format
ok
2. Quando um usuário digita uma letra (ex: "a") como primeiro caractere no campo Mobile Phone da página Send Application, o caractere deve ser imediatamente bloqueado e não aparecer no campo, confirmando que apenas números são aceitos desde o primeiro keystroke
2. When a user types a letter (e.g., "a") as the first character in the Mobile Phone field on the Send Application page, the character must be immediately blocked and not appear in the field, confirming that only numbers are accepted from the first keystroke
ok
3. Quando um usuário digita um caractere especial (ex: "@", "#", "$") como primeiro caractere no campo Mobile Phone, o caractere deve ser rejeitado e não aparecer no campo, mantendo o campo vazio e pronto para entrada numérica válida
3. When a user types a special character (e.g., "@", "#", "$") as the first character in the Mobile Phone field, the character must be rejected and not appear in the field, keeping the field empty and ready for valid numeric input

4. Quando um usuário digita números válidos (0-9) no campo Mobile Phone da página Send Application, os dígitos devem aparecer corretamente e a máscara de formatação deve ser aplicada automaticamente (ex: (123) 456-7890), permitindo fácil leitura
4. When a user types valid numbers (0-9) in the Mobile Phone field on the Send Application page, the digits must appear correctly and the formatting mask must be applied automatically (e.g., (123) 456-7890), allowing easy readability

5. Quando um usuário tenta colar uma string contendo letras ou caracteres especiais no campo Mobile Phone (ex: "abc123def"), apenas os dígitos (123) devem ser mantidos e formatados, rejeitando automaticamente caracteres inválidos
5. When a user attempts to paste a string containing letters or special characters into the Mobile Phone field (e.g., "abc123def"), only the digits (123) must be kept and formatted, automatically rejecting invalid characters

6. Quando um usuário digita exatamente 10 dígitos no campo Mobile Phone da página Send Application e clica em "Next", o formulário deve prosseguir sem erros, confirmando que a validação aceita números válidos completamente formatados
6. When a user types exactly 10 digits in the Mobile Phone field on the Send Application page and clicks "Next", the form must proceed without errors, confirming that the validation accepts fully formatted valid numbers

7. Quando um usuário digita menos de 10 dígitos no campo Mobile Phone e clica em "Next", o sistema deve exibir mensagem de erro indicando "Mobile Phone must contain exactly 10 digits", impedindo progresso até que um número válido seja inserido
7. When a user types fewer than 10 digits in the Mobile Phone field and clicks "Next", the system must display an error message indicating "Mobile Phone must contain exactly 10 digits", preventing progress until a valid number is entered

8. Quando um usuário digita mais de 10 dígitos no campo Mobile Phone (ex: tenta inserir 11 números), o campo deve limitar automaticamente a entrada a 10 dígitos, rejeitando silenciosamente caracteres adicionais
8. When a user types more than 10 digits in the Mobile Phone field (e.g., attempts to enter 11 numbers), the field must automatically limit the input to 10 digits, silently rejecting additional characters
error
9. Quando um usuário copia um número de telefone formatado (ex: "(123) 456-7890") e cola no campo Mobile Phone, o sistema deve extrair automaticamente apenas os 10 dígitos (1234567890) e exibir formatado corretamente
9. When a user copies a formatted phone number (e.g., "(123) 456-7890") and pastes it into the Mobile Phone field, the system must automatically extract only the 10 digits (1234567890) and display it formatted correctly

10. Quando um usuário usa diferentes browsers (Chrome, Firefox, Safari) e digita caracteres inválidos no campo Mobile Phone, o comportamento deve ser consistente em todos, rejeitando letras e caracteres especiais desde o primeiro keystroke sem exceções
10. When a user uses different browsers (Chrome, Firefox, Safari) and types invalid characters in the Mobile Phone field, the behavior must be consistent in all of them, rejecting letters and special characters from the first keystroke without exceptions

11. Quando um usuário acessa a página Send Application ou Complete Application em dispositivos móveis e digita no campo Mobile Phone apenas números devem ser aceitos no campo
11. When a user accesses the Send Application or Complete Application page on mobile devices and types in the Mobile Phone field, only numbers must be accepted in the field

12. Quando um usuário preenche o campo Mobile Phone com sucesso (10 dígitos válidos) e navega para outro campo no formulário e volta, o valor deve permanecer formatado corretamente (ex: "(123) 456-7890"), confirmando persistência de dados.
12. When a user successfully fills the Mobile Phone field (10 valid digits) and navigates to another field in the form and returns, the value must remain correctly formatted (e.g., "(123) 456-7890"), confirming data persistence

13. Quando um usuário limpa o campo Mobile Phone completamente e digita novamente, o campo deve estar vazio pronto para nova entrada, a máscara deve não aparecer até que o primeiro dígito válido seja inserido, e o comportamento de rejeição de caracteres inválidos deve funcionar novamente
13. When a user clears the Mobile Phone field completely and types again, the field must be empty and ready for new input, the mask must not appear until the first valid digit is entered, and the invalid-character rejection behavior must work again

14. Quando um usuário tenta contornar a validação digitando très rapidamente ou usando métodos de entrada alternativos (voice typing, dictation), o campo Mobile Phone deve continuar aceitando apenas números e aplicando máscara corretamente, mantendo a integridade da validação
14. When a user attempts to bypass validation by typing very quickly or using alternative input methods (voice typing, dictation), the Mobile Phone field must continue accepting only numbers and applying the mask correctly, maintaining validation integrity

-----

> ## Tests in qa1

> ```gherkin

**When a user accesses the Send Application page in the Origination Portal and clicks on the Mobile Phone field, the field must be empty and ready for data entry, displaying a placeholder indicating the expected format**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types a letter (e.g., "a") as the first character in the Mobile Phone field on the Send Application page, the character must be immediately blocked and not appear in the field, confirming that only numbers are accepted from the first keystroke**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types a special character (e.g., "@", "#", "$") as the first character in the Mobile Phone field, the character must be rejected and not appear in the field, keeping the field empty and ready for valid numeric input**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types valid numbers (0-9) in the Mobile Phone field on the Send Application page, the digits must appear correctly and the formatting mask must be applied automatically (e.g., (123) 456-7890), allowing easy readability**

> !

> **| PASS |**
> ```

---


> ```gherkin

> **When a user attempts to paste a string containing letters or special characters into the Mobile Phone field (e.g., "abc123def"), only the digits (123) must be kept and formatted, automatically rejecting invalid characters**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types exactly 10 digits in the Mobile Phone field on the Send Application page and clicks "Next", the form must proceed without errors, confirming that the validation accepts fully formatted valid numbers**

> !

> **| PASS |**
> ```

---


> ```gherkin

> **When a user types fewer than 10 digits in the Mobile Phone field and clicks "Next", the system must display an error message indicating "Mobile Phone must contain exactly 10 digits", preventing progress until a valid number is entered**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types more than 10 digits in the Mobile Phone field (e.g., attempts to enter 11 numbers), the field must automatically limit the input to 10 digits, silently rejecting additional characters**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user copies a formatted phone number (e.g., "(123) 456-7890") and pastes it into the Mobile Phone field, the system must automatically extract only the 10 digits (1234567890) and display it formatted correctly**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user uses different browsers (Chrome, Firefox, Safari) and types invalid characters in the Mobile Phone field, the behavior must be consistent in all of them, rejecting letters and special characters from the first keystroke without exceptions**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user accesses the Send Application or Complete Application page on mobile devices and types in the Mobile Phone field, the keyboard must display numbers by default (if isNumbersOnly=true), and only numbers must be accepted in the field**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user successfully fills the Mobile Phone field (10 valid digits) and navigates to another field in the form and returns, the value must remain correctly formatted (e.g., "(123) 456-7890"), confirming data persistence**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clears the Mobile Phone field completely and types again, the field must be empty and ready for new input, the mask must not appear until the first valid digit is entered, and the invalid-character rejection behavior must work again**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to bypass validation by typing very quickly or using alternative input methods (voice typing, dictation), the Mobile Phone field must continue accepting only numbers and applying the mask correctly, maintaining validation integrity**

> !

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg


> ## Tests in stg


> ```gherkin

> **When a user types a letter (e.g., "a") as the first character in the Mobile Phone field on the Send Application page, the character must be immediately blocked and not appear in the field, confirming that only numbers are accepted from the first keystroke**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types a special character (e.g., "@", "#", "$") as the first character in the Mobile Phone field, the character must be rejected and not appear in the field, keeping the field empty and ready for valid numeric input**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types valid numbers (0-9) in the Mobile Phone field on the Send Application page, the digits must appear correctly and the formatting mask must be applied automatically (e.g., (123) 456-7890), allowing easy readability**

> ![WhatsApp_Image_2025-11-16_at_03.42.22__1_](/uploads/dddddb4112e8fc437707efe00176b5a5/WhatsApp_Image_2025-11-16_at_03.42.22__1_.jpeg){width=278 height=600}

> **| PASS |**
> ```

---


> ```gherkin

> **When a user attempts to paste a string containing letters or special characters into the Mobile Phone field (e.g., "abc123def"), only the digits (123) must be kept and formatted, automatically rejecting invalid characters**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types exactly 10 digits in the Mobile Phone field on the Send Application page and clicks "Next", the form must proceed without errors, confirming that the validation accepts fully formatted valid numbers**

> **| PASS |**
> ```

---


> ```gherkin

> **When a user types fewer than 10 digits in the Mobile Phone field and clicks "Next", the system must display an error message indicating "Mobile Phone must contain exactly 10 digits", preventing progress until a valid number is entered**

> ![WhatsApp_Image_2025-11-16_at_03.42.22__2_](/uploads/5a93b68056586efa3042a71ff195734e/WhatsApp_Image_2025-11-16_at_03.42.22__2_.jpeg){width=278 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types more than 10 digits in the Mobile Phone field (e.g., attempts to enter 11 numbers), the field must automatically limit the input to 10 digits, silently rejecting additional characters**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user copies a formatted phone number (e.g., "(123) 456-7890") and pastes it into the Mobile Phone field, the system must automatically extract only the 10 digits (1234567890) and display it formatted correctly**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user uses different browsers (Chrome, Firefox, Safari) and types invalid characters in the Mobile Phone field, the behavior must be consistent in all of them, rejecting letters and special characters from the first keystroke without exceptions**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user accesses the Send Application or Complete Application page on mobile devices and types in the Mobile Phone field, only numbers must be accepted in the field**

> ![WhatsApp_Image_2025-11-16_at_03.42.22__3_](/uploads/ccd65e2c7a240f6cc68e3cbb12dae80a/WhatsApp_Image_2025-11-16_at_03.42.22__3_.jpeg){width=278 height=600}
> ![WhatsApp_Image_2025-11-16_at_03.42.22__4_](/uploads/3b446822708c1a778e23a78a1fe09b48/WhatsApp_Image_2025-11-16_at_03.42.22__4_.jpeg){width=278 height=600}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user successfully fills the Mobile Phone field (10 valid digits) and navigates to another field in the form and returns, the value must remain correctly formatted (e.g., "(123) 456-7890"), confirming data persistence**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user clears the Mobile Phone field completely and types again, the field must be empty and ready for new input, the mask must not appear until the first valid digit is entered, and the invalid-character rejection behavior must work again**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to bypass validation by typing very quickly or using alternative input methods (voice typing, dictation), the Mobile Phone field must continue accepting only numbers and applying the mask correctly, maintaining validation integrity**

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------