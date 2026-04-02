------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# UOWN | SVC | Fix missing log entries caused by @Embedded attribute handling

**Status:** Open  
**Created by:** Yuri Araujo (3 weeks ago)  
**Type:** BUG

Some logs in production are not being correctly recorded due to the use of the @Embedded attribute in certain entities. The current logging mechanism fails to access fields inside embedded objects properly, resulting in missing or incomplete log entries.

**Fix:**  
Adjust the way fields are accessed in the logging logic to ensure that embedded fields are correctly identified and evaluated. This fix ensures that changes within @Embedded attributes are properly detected and logged as expected.

-----

# UOWN | SVC | Corrigir registros de log ausentes devido ao tratamento de atributos @Embedded

**Status:** Aberto  
**Criado por:** Yuri Araujo (há 3 semanas)  
**Tipo:** BUG

Alguns logs em produção não estão sendo registrados corretamente devido ao uso do atributo @Embedded em certas entidades. O mecanismo de logging atual falha ao acessar corretamente os campos dentro de objetos embedded, resultando em registros de log ausentes ou incompletos.

**Correção:**  
Ajustar a forma como os campos são acessados na lógica de logging para garantir que os campos embutidos sejam corretamente identificados e avaliados. Essa correção assegura que mudanças dentro de atributos @Embedded sejam devidamente detectadas e registradas como esperado.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Após a aplicação da correção, não foi mais possível visualizar a exceção retornada no Grafana durante o processo de inativação de pagamento pendente via conta bancária, confirmando que o erro foi devidamente tratado e solucionado.

After applying the fix, it was no longer possible to view the exception returned in Grafana during the process of deactivating pending payment via bank account, confirming that the error was properly handled and resolved.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg
> ```gherkin
> Given a pending payment exists for deactivation via bank account
> When the fix for the deactivation process is applied
> Then the exception is no longer visible in Grafana
> And the error is confirmed to be properly handled and resolved
> | PASS | AccountPk 206399 | Merchant Progress Mobility | 
> ```
>
![366-stg-c1-_1_](/uploads/152f31b456401d41addc693119a83491/366-stg-c1-_1_.png){width=1431 height=741}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------