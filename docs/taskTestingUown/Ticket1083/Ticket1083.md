-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1083

UOWN | Origination | Automatically update fields (username and API key) when cloning a merchant with CLIENT TYPE change

Synopsis
Currently, when a merchant is cloned and its Client Type is changed, the fields (username and API key) are not automatically updated.
This may lead to integration failures, such as 400 errors when submitting applications, due to the use of outdated fields inherited from the original configuration.

Exception during the submit app :[400 Bad Request] during [POST] to [https://svc-prod.uownleasing.com/uown/los/sendApplication\]
[UOwnClient#createApplication(UOwnCreateApplicationRequest)]: [{ "faults" : true, "fieldInError1" : "merchantId", "fieldInError2" : null,
"fieldInError3" : null, "fieldInError4" : null, "fieldInError5" : null, "sorErrorDescription" : "Invalid mercha... (1002 bytes)]"

Business Objective
Prevent application submission failures caused by outdated credentials during the merchant cloning process, ensuring integration consistency 
and reducing the need for manual corrections by the support team.

Feature Request | Business Requirements
    When a merchant is cloned and the Client Type field is changed, the system must:
    Check if the new Client type requires different credentials;
    Automatically update the **username** and API key fields based on the newly selected Client type;
    Ensure that cloned merchants are ready to submit applications without generating errors due to invalid credentials;
    If it is not possible to determine the new credentials automatically, display a clear message to the user instructing them to fill in the information manually.

When changing the clientType, I choose to send empty values (username, apiKey) to the API which will automatically identify 
that they are empty and set the correct (username, apiKey) based on the clienyType.
Reloading the page, you must be able to see the (username, apiKey) values settled by the API.
You also must guarantee that the process  to submit applications is not returning errors like mentioned on the ticket description

This may lead to integration failures, such as 400 errors when submitting applications, due to the use of outdated fields inherited from the original configuration.

Exception during the submit app :[400 Bad Request] during [POST] to [https://svc-prod.uownleasing.com/uown/los/sendApplication\] 
[UOwnClient#createApplication(UOwnCreateApplicationRequest)]: 
[{ "faults" : true, "fieldInError1" : "merchantId", "fieldInError2" : null, "fieldInError3" : null, "fieldInError4" : null, "fieldInError5" : null, 
"sorErrorDescription" : "Invalid mercha... (1002 bytes)]"

-----

UOWN | Originação | Atualizar campos automaticamente (nome de usuário e chave de API) ao clonar um comerciante com alteração de TIPO DE CLIENTE

Sinopse
Atualmente, quando um comerciante é clonado e seu Client Type é alterado, os campos (username and API key) não são atualizados automaticamente.
Isso pode levar a falhas de integração, como erros 400 ao enviar aplicativos, devido ao uso de campos desatualizados herdados da configuração original.

Exceção durante o envio do aplicativo: [400 Solicitação inválida] durante [POST] para [https://svc-prod.uownleasing.com/uown/los/sendApplication\] 
[UOwnClient#createApplication(UOwnCreateApplicationRequest)]: [{ "faults": true, "fieldInError1": "merchantId", "fieldInError2": null, 
"fieldInError3": null, "fieldInError4": null, "fieldInError5": null, "sorErrorDescription": "Mercado inválido... (1002 bytes)]"


Objetivo do negócio
Evite falhas no envio de aplicativos causadas por credenciais desatualizadas durante o processo de clonagem do comerciante, garantindo a consistência da integração e reduzindo a necessidade de correções manuais pela equipe de suporte.

Solicitação de recurso | Requisitos de negócios
    Quando um comerciante é clonado e o Client Type campo é alterado, o sistema deve:        
    Verifique se o novo Client type requer credenciais diferentes;
    Atualize automaticamente o **username** e API key campos baseados nos recém-selecionados Client type;
    Certifique-se de que os comerciantes clonados estejam prontos para enviar solicitações sem gerar erros devido a credenciais inválidas;
    Caso não seja possível determinar as novas credenciais automaticamente, exiba uma mensagem clara ao usuário instruindo-o a preencher as informações manualmente.

Ao alterar o clientType, opto por enviar valores vazios (nome de usuário, apiKey) para a API que identificará automaticamente que estão vazios e definirá o correto (nome de usuário, apiKey) com base no clienyType.
Ao recarregar a página, você deve conseguir ver os valores (nome de usuário, apiKey) definidos pela API.
Você também deve garantir que o processo de envio de inscrições não esteja retornando erros como os mencionados na descrição do ticket

This may lead to integration failures, such as 400 errors when submitting applications, due to the use of outdated fields inherited from the original configuration.

Exception during the submit app :[400 Bad Request] during [POST] to [https://svc-prod.uownleasing.com/uown/los/sendApplication\] 
[UOwnClient#createApplication(UOwnCreateApplicationRequest)]: [{ "faults" : true, "fieldInError1" : "merchantId", 
"fieldInError2" : null, "fieldInError3" : null, "fieldInError4" : null, "fieldInError5" : null, "sorErrorDescription" : "Invalid mercha... (1002 bytes)]"

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

alterações dev:
Visão geral 
3
Commits 
9
Pipelines 
5
Alterações 4
Todas os tópico foram resolvidos!
Comparar
e
 4 arquivos
+
111
−
726
Arquivos
4
Search (e.g. *.vue) (F)

components/merc
‎hant-info-panels‎

add-or-edit-
‎merchant.tsx‎
+38 -77

pages/m
‎erchant‎

[refMercha
‎ntCode].tsx‎
+53 -30

packag
‎e.json‎
+0 -15

yarn
‎.lock‎
+20 -604

 components/merchant-info-panels/add-or-edit-merchant.tsx 
+
38
−
77

Visualizado
@@ -96,12 +96,10 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
    hasCreateOrUpdateMerchantLogPermissionOnly,
    allProgramOptions,
    createInventoryCategory,
    getMerchantsByCriteria,
    isLoadingMerchantData,
  } = props;

  const router = useRouter();
  router.query;
  const allFrequencies: string[] = Object.values(Frequencies) || [];
  const frequencyOptions: Options[] = allFrequencies?.map(
    (freq: string = '') => {
@@ -163,14 +161,6 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
    getLogs();
  }, [merchantBeingEdited]);

  const resetMerchantForm = async () => {
    formik?.resetForm();
    programsFormik?.resetForm();
    setMerchantBeingEdited(null);
    setDisplayAddOrEditMerchantScreen(false);

    await getMerchantsByCriteria();
  };
  const isEditingMerchant = Object.keys(merchantBeingEdited || {})?.length > 0;

  const handleBoolInitialValue = (value: boolean) => {
@@ -683,41 +673,34 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
        };

        const addNewMerchant = async () => {
          if (responseCode === 200) {
            if (isMerchantCodeUnique) {
              const response = await createOrUpdateMerchant(requestData);
              if (response?.status === 200) {
                await programsFormik?.setFieldValue(
                  'merchantPK',
                  response?.data?.merchantInfo?.merchantPK,
                );
                setNewMerchantPk(
                  response?.data?.merchantInfo?.merchantPK || null,
                );
                showToast('success', 'Merchant added successfully');
                await programsFormik?.submitForm();
                await resetMerchantForm();
                router.push(response?.data?.merchantInfo.refMerchantCode);
              } else {
                showToast(
                  'error',
                  response?.message || 'Unable to add merchant',
                );
              }
              if (isMerchantBankAccountModified) {
                bankAccountRequestData.merchantPK = response?.data?.pk;
                addOrUpdateBankAccount(bankAccountRequestData);
              }
              await resetMerchantForm();
            } else {
              showToast('error', 'Duplicate merchant reference code.', 3000);
            }
          } else {
          if (responseCode !== 200) {
            showToast(
              'error',
              'Unable to verify merchant reference code at this time. Please try again.',
            );
            return;
          }
          if (!isMerchantCodeUnique) {
            showToast('error', 'Duplicate merchant reference code.', 3000);
            return;
          }
          const response = await createOrUpdateMerchant(requestData);
          if (response?.status !== 200) {
            showToast('error', response?.message || 'Unable to add merchant');
            return;
          }
          await programsFormik?.setFieldValue(
            'merchantPK',
            response?.data?.merchantInfo?.merchantPK,
          );
          setNewMerchantPk(response?.data?.merchantInfo?.merchantPK || null);
          showToast('success', 'Merchant added successfully');
          await programsFormik?.submitForm();
          if (isMerchantBankAccountModified) {
            bankAccountRequestData.merchantPK = response?.data?.pk;
            addOrUpdateBankAccount(bankAccountRequestData);
          }
          router.push(response?.data?.merchantInfo.refMerchantCode);
        };

        const updateExistingMerchant = async () => {
@@ -842,44 +825,22 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
    },
  });

  const setUserNameAndApiKey = async (
    username: string,
    apiKey: string,
    clientType: string,
  ) => {
    const initialClientType = formik?.initialValues?.clientType || '';
    const initialMerchantType = formik?.initialValues?.merchantType || '';
    const formClientType = formik?.values?.clientType || '';

    await formik?.setFieldValue('merchantUsername', username);
    await formik?.setFieldValue('merchantAPIKey', apiKey);
    await formik?.setFieldValue('merchantType', initialMerchantType);

    if (!isEqual(initialClientType, formClientType)) {
      if (isEqual(clientType, 'SASLOW_JEWELERS')) {
        await formik?.setFieldValue('merchantType', 'INSTORE');
      } else {
        await formik?.setFieldValue('merchantType', 'ONLINE');
      }
    }
  };

  useEffect(() => {
    if (!isCloningMerchant) {
      const initialClientType = formik?.initialValues?.clientType || '';
      const currentClientType = formik?.values?.clientType || '';
      if (
        !isEqual(currentClientType, initialClientType) &&
        currentMerchantCloned
      ) {
        setUserNameAndApiKey(
          currentMerchantCloned?.username,
          currentMerchantCloned?.apiKey,
          currentMerchantCloned?.clientType,
        );
      }
    if (!currentMerchantCloned || !formik.values.clientType) {
      return;
    }
    const clientTypeHasChanged =
      currentMerchantCloned.clientType !== formik.values.clientType;
    if (clientTypeHasChanged) {
      formik.setFieldValue('merchantUsername', '');
      formik.setFieldValue('merchantAPIKey', '');
      formik.setFieldValue('merchantUrl', '');
    } else {
      formik.setFieldValue('merchantUsername', currentMerchantCloned.username);
      formik.setFieldValue('merchantAPIKey', currentMerchantCloned.apiKey);
      formik.setFieldValue('merchantUrl', currentMerchantCloned.merchantUrl);
    }
  }, [formik?.values?.clientType, currentMerchantCloned]);
  }, [currentMerchantCloned, formik.values.clientType]);

  useEffect(() => {
    const getMerchantPrograms = async () => {
@@ -897,7 +858,7 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
      }
    };
    getMerchantPrograms();
  }, []);
  }, [merchantBeingEdited, getMerchantProgram]);

  useEffect(() => {
    if (showCloneOptions) {

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_AutomaticallyUpdateFieldsWhenCloningMerchantWithClientTypeChange_Ticket1083

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2
> ```gherkin
>
> When Log in to origination
> And Navigate to merchants page
> And Add New Merchant
> And Merchant is cloned
> Then Username and API key are auto-filled
> When Client Type "<clientType1>" is selected and credentials are cleared
> And Merchant changes are saved
> And Open last cloned merchant
> Then Username and API key are auto-filled
> And No integration errors should be present
> When Remove username and API key
> And Merchant changes are saved
> And Open last cloned merchant
> Then Username and API key are auto-filled
> When Client Type "<clientType2>" is selected and credentials are cleared
> And Merchant changes are saved
> And Open last cloned merchant
> Then Username and API key are auto-filled
> And No integration errors should be present
> Then In merchant UI logs I should see "<expectedLogText>"
> And In database, merchant with code "<dbMerchantCode>" exists
> | PASS | Merchant:Progress Mobility | ClientType1: DANIELS_JEWELERS | ClientType2: TIRE_AGENT |
> ```
>
>