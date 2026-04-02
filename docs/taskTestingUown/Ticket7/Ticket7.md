------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/ams/-/issues/7



UOWN | AMS | Fix the "Forgot My Password" to unlock user
Aberto
  Tíquete criado 1 hora atrás por Yuri Araujo
Synopsis:
Currently, locked users do not receive the password reset email when clicking the "Forgot your password?" link. This limitation prevents them from unlocking their account on their own, even after successfully updating their password. The proposal is to change this logic to allow locked users to receive the reset email and automatically unlock their account after a successful password reset.

SUGGESTION:

When the toast notification appears informing the user about the account lock, instead of showing "Please try again later", display:

"Your account has been locked. Please change your password to unlock it."

image.png

Testing Steps
After having a ams account with your email, click on the forgot your password button

After entering the email address, confirm that you received the reset code

Confirm that the code works and the password can be reset, and the user can access normally using the new password

------------------------------------------------------------------------------------------------------------------------------------------------------------------



-----

> ## Tests in Origination - qa1
> ```gherkin
> Given Begin Login Origination
>
> ### Scenario: Invalid email
> When the user logs in with invalid email
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful  
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Invalid password
> When the user logs in with invalid password
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Show password
> When the user clicks on show password after entering a password
> Then the user is shown the entered password
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Locked user receives password reset email
> When the user is locked by entering wrong password three times
> And the user requests a password reset email
> Then a password reset email is sent
> Then Test is successful
> | PASS |
> ```
>

[UownUnifiedFlow_QA1_2025_08_11_1951_32947.html](/uploads/f67eba19b3c805cc09d43992604386a0/UownUnifiedFlow_QA1_2025_08_11_1951_32947.html)


-----


> ## Tests in Servicing - qa1
> ```gherkin
> Given Begin Login Servicing
>
> ### Scenario: Invalid email
> When the user logs in with invalid email
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful  
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Invalid password
> When the user logs in with invalid password
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Show password
> When the user clicks on show password after entering a password
> Then the user is shown the entered password
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Locked user receives password reset email
> When the user is locked by entering wrong password three times
> And the user requests a password reset email
> Then a password reset email is sent
> Then Test is successful
> | PASS |
> ```
>

-----

> ## Tests in Origination - sandbox
> ```gherkin
> Given Begin Login Origination
>
> ### Scenario: Invalid email
> When the user logs in with invalid email
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful  
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Invalid password
> When the user logs in with invalid password
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Show password
> When the user clicks on show password after entering a password
> Then the user is shown the entered password
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Locked user receives password reset email
> When the user is locked by entering wrong password three times
> And the user requests a password reset email
> Then a password reset email is sent
> Then Test is successful
> | PASS |
> ```
>

[ForgotMyPasswordUnlockUser_Origination_Ticket7_SANDBOX_2025_08_11_2042_41157.html](/uploads/bde7b7e4bb0244551e5dc6bc0bbef264/ForgotMyPasswordUnlockUser_Origination_Ticket7_SANDBOX_2025_08_11_2042_41157.html)


-----

> ## Tests in Servicing - sandbox
> ```gherkin
> Given Begin Login Servicing
>
> ### Scenario: Invalid email
> When the user logs in with invalid email
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful  
> | PASS |
> ```
>
> ```gherkin
> ### Scenario: Invalid password
> When the user logs in with invalid password
> Then the user is shown an invalid credentials error
> And the user remains on the login page
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Show password
> When the user clicks on show password after entering a password
> Then the user is shown the entered password
> Then Test is successful
> | PASS |
> ```
>
> ```gherkin
>
> ### Scenario: Locked user receives password reset email
> When the user is locked by entering wrong password three times
> And the user requests a password reset email
> Then a password reset email is sent
> Then Test is successful
> | PASS |
> ```
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------


feat(uown-login): adicionar cenário “usuário bloqueado solicita desbloqueio de acesso” (origination e servicing)
Incluído Scenario Outline para o fluxo de desbloqueio: usuário bloqueado solicita e-mail de redefinição/desbloqueio
