---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/144

UOWN | Customer Portal | Update and Standardize Hours of Operation (UOWN and Kornerstone)

Synopsis
Update and standardize the hours of operation displayed on the Kornerstone and UOWN Customer Portals, ensuring consistency across both brands and alignment with the official Call Center schedule. Additionally, validate whether customer-facing emails include hours of operation and update them if necessary.

Business Objective
Standardizing operating hours across UOWN and Kornerstone reduces customer confusion, improves service transparency, and ensures consistent brand communication. Clearly displaying accurate hours in customer portals and emails helps set proper expectations, reduces unnecessary contact attempts outside business hours, and strengthens trust in customer support operations.

Requirements
    * Update the hours of operation displayed in the Kornerstone Customer Portal.
    * Verify whether the UOWN Customer Portal currently displays hours of operation:
        * Add the hours of operation.
    * Standardize the hours of operation across UOWN and Kornerstone, using the same official schedule.
Take a look:
* Review customer email communications to confirm whether hours of operation are included:
    * If included, update them to reflect the new standardized schedule.

Hours of Operation (Call Center – EST)
* Monday – Friday: 8:00 AM – 11:00 PM
* Saturday: 9:00 AM – 11:00 PM
* Sunday: 10:00 AM – 11:00 PM

For Kornerstone:
![alt text](image.png)

For Uown, add Operation Hours:
![alt text](image-1.png)

Steps to Reproduce:
Expected Result (Official Call Center – EST)
Monday – Friday: 8:00 AM – 11:00 PM
Saturday: 9:00 AM – 11:00 PM
Sunday: 10:00 AM – 11:00 PM

Part 1 – Kornerstone Customer Portal
1. Log in to the Kornerstone Customer Portal with valid credentials.
2. In the sidebar, locate the "Hours of operation" section.
3. Verify the displayed hours match exactly:
* Mon–Fri: 8:00 AM – 11:00 PM (EST)
* Sat: 9:00 AM – 11:00 PM (EST)
* Sun: 10:00 AM – 11:00 PM (EST)
4. Confirm the timezone is EST and that no old hours (e.g. 9:00am–10:00pm or 11:00am–9:00pm) are shown.

Part 2 – UOWN Customer Portal
1. Log in to the UOWN Customer Portal with valid credentials.
2. Go to the screen where Hours of Operation are shown (e.g. Overview / Announcements or equivalent).
3. Verify the displayed hours match the expected result:
* Monday – Friday: 8:00 AM – 11:00 PM
* Saturday: 9:00 AM – 11:00 PM
* Sunday: 10:00 AM – 11:00 PM
4. Confirm the timezone is EST (or EDT where applicable) and that no old hours (e.g. M–S 9:00am to 10:00pm, Sun 11:00am to 9:00pm) are shown.

Part 3 – Consistency Between Both Portals
1. Compare the Hours of Operation section on Kornerstone and UOWN (side by side or via screenshots).
2. Verify that:
* The three periods (weekdays / Saturday / Sunday) are identical.
* Opening/closing times and timezone (EST) match between both portals.

Part 4 – Emails (41 Updated Templates)
1. Validate one (1) representative email only: the content is parameterized, so the same hours are used across all 41 templates.
* Trigger one email in a test environment (or open one template/preview), e.g. welcome, notification, or reminder.
* Open the received email (or preview) and locate the section that mentions hours of operation / Call Center schedule.
2. Verify in that email that the displayed schedule matches:
* Monday – Friday: 8:00 AM – 11:00 PM (EST)
* Saturday: 9:00 AM – 11:00 PM (EST)
* Sunday: 10:00 AM – 11:00 PM (EST)
3. If the single validated email is correct, consider the 41 parameterized templates as covered; no need to test each one individually.

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## UOWN | Portal do Cliente | Atualizar e Padronizar Horário de Funcionamento (UOWN e Kornerstone)

### Sinopse

Atualizar e padronizar os horários de funcionamento exibidos nos Portais do Cliente da **Kornerstone** e da **UOWN**, garantindo consistência entre ambas as marcas e alinhamento com o horário oficial do Call Center.
Além disso, validar se os e-mails enviados aos clientes exibem o horário de funcionamento e atualizá-los, caso necessário.

---
### Objetivo de Negócio

A padronização dos horários de atendimento entre UOWN e Kornerstone reduz a confusão dos clientes, melhora a transparência do serviço e garante uma comunicação de marca consistente.
Exibir horários corretos de forma clara nos portais e nos e-mails ajuda a definir expectativas adequadas, reduz tentativas de contato fora do horário comercial e fortalece a confiança no suporte ao cliente.

---
### Requisitos

* Atualizar os horários de funcionamento exibidos no **Portal do Cliente da Kornerstone**.
* Verificar se o **Portal do Cliente da UOWN** atualmente exibe o horário de funcionamento:

  * Caso não exiba, **adicionar** o horário de funcionamento.
* Padronizar os horários de funcionamento entre UOWN e Kornerstone, utilizando o mesmo horário oficial.
* Revisar as comunicações por e-mail enviadas aos clientes para confirmar se o horário de funcionamento está incluído:

  * Caso esteja incluído, atualizar para refletir o novo horário padronizado.

---
### Horário de Funcionamento (Call Center – EST)

* **Segunda a Sexta-feira:** 8:00 AM – 11:00 PM
* **Sábado:** 9:00 AM – 11:00 PM
* **Domingo:** 10:00 AM – 11:00 PM

---
### Kornerstone

*(imagem de referência)*

### UOWN – Adicionar Horário de Funcionamento

*(imagem de referência)*

---
### Passos para Reproduzir

### Resultado Esperado (Call Center Oficial – EST)

* **Segunda a Sexta-feira:** 8:00 AM – 11:00 PM
* **Sábado:** 9:00 AM – 11:00 PM
* **Domingo:** 10:00 AM – 11:00 PM

---

## Parte 1 – Portal do Cliente Kornerstone

1. Fazer login no **Portal do Cliente Kornerstone** com credenciais válidas.
2. No menu lateral, localizar a seção **“Hours of Operation”**.
3. Verificar se os horários exibidos correspondem exatamente a:

   * **Seg–Sex:** 8:00 AM – 11:00 PM (EST)
   * **Sáb:** 9:00 AM – 11:00 PM (EST)
   * **Dom:** 10:00 AM – 11:00 PM (EST)
4. Confirmar que o fuso horário exibido é **EST** e que **nenhum horário antigo** (ex.: 9:00 AM – 10:00 PM ou 11:00 AM – 9:00 PM) está sendo mostrado.

---

## Parte 2 – Portal do Cliente UOWN

1. Fazer login no **Portal do Cliente UOWN** com credenciais válidas.
2. Acessar a tela onde o **Horário de Funcionamento** é exibido (ex.: Overview / Announcements ou equivalente).
3. Verificar se os horários exibidos correspondem ao resultado esperado:

   * **Segunda a Sexta-feira:** 8:00 AM – 11:00 PM
   * **Sábado:** 9:00 AM – 11:00 PM
   * **Domingo:** 10:00 AM – 11:00 PM
4. Confirmar que o fuso horário é **EST** (ou **EDT**, quando aplicável) e que **nenhum horário antigo** (ex.: Seg–Sáb 9:00 AM – 10:00 PM, Dom 11:00 AM – 9:00 PM) está sendo exibido.

---

## Parte 3 – Consistência Entre Ambos os Portais

1. Comparar a seção **Hours of Operation** dos portais **Kornerstone** e **UOWN** (lado a lado ou por meio de capturas de tela).
2. Verificar se:

   * Os **três períodos** (dias úteis / sábado / domingo) são idênticos.
   * Os horários de abertura, fechamento e o fuso horário (**EST**) coincidem entre ambos os portais.

---

## Parte 4 – E-mails (41 Templates Atualizados)

1. Validar **apenas um (1) e-mail representativo**, pois o conteúdo é parametrizado e o mesmo horário é utilizado nos 41 templates:

   * Disparar um e-mail em ambiente de teste (ou abrir um template/preview), como por exemplo: e-mail de boas-vindas, notificação ou lembrete.
   * Abrir o e-mail recebido (ou preview) e localizar a seção que menciona o **horário de funcionamento / Call Center**.
2. Verificar se o horário exibido no e-mail corresponde a:

   * **Segunda a Sexta-feira:** 8:00 AM – 11:00 PM (EST)
   * **Sábado:** 9:00 AM – 11:00 PM (EST)
   * **Domingo:** 10:00 AM – 11:00 PM (EST)
3. Caso o e-mail validado esteja correto, considerar os **41 templates parametrizados como cobertos**, não sendo necessário testar cada um individualmente.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

components/kornerstone/hoursOfOperation/index.tsx
import React from 'react';
import styles from './index.module.scss';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faFacebookSquare,
  faInstagramSquare,
} from '@fortawesome/free-brands-svg-icons';

const HoursOfOperation = () => {
  return (
    <div className={styles.container}>
      <div className={styles.iconsRow}>
        <a href="https://facebook.com/Kornerstoneliving/" target="_BLANK">
          <FontAwesomeIcon icon={faFacebookSquare} className={styles.icon} />
        </a>
        <a href="https://www.instagram.com/kornerstoneliving/" target="_BLANK">
          <FontAwesomeIcon icon={faInstagramSquare} className={styles.icon} />
        </a>
      </div>

      <div className={styles.divider} />
      <h4 className={styles.title}>Hours of operation</h4>
      <div className={styles.divider} />

      <p className={styles.text}>Mon–Fri: 7am–7pm (MST)</p>
      <p className={styles.text}>Sat: 7am–3:30pm (MST)</p>
      <p className={styles.text}>Sun: Closed</p>
    </div>
  );
};

export default HoursOfOperation;



components/side-bar/index.module.scss
@import '@styles/media-query.scss';

.sideBarContainer {
  background-color: white !important;
  font-family: var(--regular-font);
  text-align: start !important;
  white-space: nowrap !important;
  box-shadow: 0 3px 6px 0 var(--border);
  font-size: 13px;
  @include media-breakpoint-down(sm) {
    display: none;
  }

  &__item {
    color: black !important;
    cursor: pointer !important;
  }

  &__dropDownArrow {
    color: black;
    cursor: pointer !important;
  }

  &__blue {
    color: var(--primary) !important;
  }
}

.sideBarContainer__item:hover {
  color: var(--navbar-background-color) !important;
}

.sideBarContainer_kc {
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;

  background-color: white !important;
  font-family: var(--regular-font);
  text-align: start !important;
  white-space: nowrap !important;
  box-shadow: 0 3px 6px 0 var(--border);
  font-size: 13px;

   @include media-breakpoint-down(sm) {
    display: none;
  }

  &__item {
    color: black !important;
    cursor: pointer !important;
  }

  &__dropDownArrow {
    color: black;
    cursor: pointer !important;
  }

  &__blue {
    color: var(--kc-purple) !important;
  }
}

.sideBarContainer_kc__item:hover {
  color: var(--kc-purple) !important;
}



components/side-bar/index.tsx
import React, {useState} from 'react';
import {useRouter} from 'next/router';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import {
  faAddressBook,
  faMoneyCheckEditAlt,
  faFileAlt,
  faCalendarPlus,
} from '@fortawesome/pro-light-svg-icons';
import Image from 'next/image';
import styles from './index.module.scss';
import {AccountSummary} from '@models';
import {useAccountStatus} from '@utils/hooks/useAccountStatus';
import HoursOfOperation from 'components/kornerstone/hoursOfOperation';
export interface SidebarProps {
  isPageLoaded: boolean;
  accountSummary: AccountSummary;
  isKornerstoneCustomer: boolean;
}

const SidebarItem = ({
  label,
  icon,
  isActive,
  onClick,
  className,
  isKornerstoneCustomer,
}: any) => {
  const styleActive = isKornerstoneCustomer
    ? styles.sideBarContainer_kc__blue
    : styles.sideBarContainer__blue;

  return (
    <div className={classNames('my-4 pl-2', className)}>
      {icon}
      <span
        className={classNames(
          isKornerstoneCustomer
            ? styles.sideBarContainer_kc__item
            : styles.sideBarContainer__item,
          'ml-2',
          isActive && styleActive,
        )}
        onClick={onClick}>
        {label}
      </span>
    </div>
  );
};

const SidebarDropdown = ({
  label,
  icon,
  isOpen,
  toggle,
  children,
  isKornerstoneCustomer,
}: any) => {
  const kornerstoneItem = isKornerstoneCustomer
    ? styles.sideBarContainer_kc__item
    : styles.sideBarContainer__item;

  const kornerstoneDropDownArrow = isKornerstoneCustomer
    ? styles.sideBarContainer_kc__dropDownArrow
    : styles.sideBarContainer__dropDownArrow;

  return (
    <div className="my-4 pl-2 align-items-center">
      {icon}
      <span
        className={classNames(kornerstoneItem, 'ml-2 mr-1')}
        onClick={toggle}>
        {label}
      </span>

      <FontAwesomeIcon
        className={kornerstoneDropDownArrow}
        icon={isOpen ? faChevronUp : faChevronDown}
        onClick={toggle}
      />

      {isOpen && <div className="my-2 ml-4 text-left">{children}</div>}
    </div>
  );
};

const Sidebar = ({
  isPageLoaded,
  accountSummary,
  isKornerstoneCustomer,
}: SidebarProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [isPaymentsOpen, setPaymentsOpen] = useState(
    currentPath.includes('payment'),
  );
  const [isSettingsOpen, setSettingsOpen] = useState(
    currentPath.includes('update-contact'),
  );

  const {isAccountInactive} = useAccountStatus(accountSummary);

  if (!isPageLoaded) return null;

  const go = (path: string) => router.push(path);
  const isActive = (key: string) => currentPath.includes(key);
  const getIsActiveStyle = isKornerstoneCustomer
    ? styles.sideBarContainer_kc__blue
    : styles.sideBarContainer__blue;
  return (
    <div
      className={classNames(
        isKornerstoneCustomer
          ? styles.sideBarContainer_kc
          : styles.sideBarContainer,
        'p-3',
      )}>
      <div>
        <div className="my-4 pl-2">
          <Image src={require('@images/account-summary-icon.svg')} alt="" />
          <span
            className={classNames(
              isKornerstoneCustomer
                ? styles.sideBarContainer_kc__item
                : styles.sideBarContainer__item,
              'ml-2',
              isActive('overview') && getIsActiveStyle,
            )}
            onClick={() => go('/overview')}>
            Account Summary
          </span>
        </div>

        <SidebarDropdown
          label="Payments"
          icon={<FontAwesomeIcon icon={faMoneyCheckEditAlt} color="#000" />}
          isOpen={isPaymentsOpen}
          toggle={() => setPaymentsOpen((prev) => !prev)}
          isKornerstoneCustomer={isKornerstoneCustomer}>
          {!isAccountInactive && (
            <div
              className={classNames(
                isKornerstoneCustomer
                  ? styles.sideBarContainer_kc__item
                  : styles.sideBarContainer__item,
                'my-2',
                isActive('/payment') && getIsActiveStyle,
              )}
              onClick={() => go('/payment')}>
              Make Payment
            </div>
          )}

          <div
            className={classNames(
              isKornerstoneCustomer
                ? styles.sideBarContainer_kc__item
                : styles.sideBarContainer__item,
              'my-2',
              isActive('manage') && getIsActiveStyle,
            )}
            onClick={() => go('/manage-payment-methods')}>
            Payment Methods
          </div>
        </SidebarDropdown>

        <SidebarItem
          label="Documents"
          icon={<FontAwesomeIcon icon={faFileAlt} color="#000" />}
          isActive={isActive('documents')}
          onClick={() => go('/documents')}
          isKornerstoneCustomer={isKornerstoneCustomer}
        />

        <SidebarItem
          label="Contact Us"
          icon={<FontAwesomeIcon icon={faCalendarPlus} color="#000" />}
          isActive={isActive('/contact')}
          onClick={() => go('/contact')}
          isKornerstoneCustomer={isKornerstoneCustomer}
        />

        <SidebarDropdown
          label="Account Settings"
          icon={<FontAwesomeIcon icon={faAddressBook} color="#000" />}
          isOpen={isSettingsOpen}
          toggle={() => setSettingsOpen((prev) => !prev)}
          isKornerstoneCustomer={isKornerstoneCustomer}>
          <div
            className={classNames(
              isKornerstoneCustomer
                ? styles.sideBarContainer_kc__item
                : styles.sideBarContainer__item,
              'my-2',
              isActive('update-contact') && getIsActiveStyle,
            )}
            onClick={() => go('/update-contact')}>
            Update Contact Info
          </div>
        </SidebarDropdown>
      </div>

      {isKornerstoneCustomer && <HoursOfOperation />}
    </div>
  );
};

export default Sidebar;


domain/stores/account.tsx
import {action, makeObservable, observable} from 'mobx';
import {persist} from 'mobx-persist';
import {RootStore} from '@stores/root';
import {BaseStore} from '@stores/base';
import {ResponseType} from '@uownleasing/common-ui';
import axios from 'axios';

export interface LoginResponse {
  accountPks: any;
  loginToken: string;
  permissions: {
    denied: RequestPermission;
    granted: RequestPermission;
  };
}

export interface RequestPermission {
  GET?: string[];
  POST?: string[];
  PUT?: string[];
  DELETE?: string[];
}

export interface VerifyCodeRequest {
  phoneOrEmail: string;
  code: string;
}

export class AccountStore extends BaseStore {
  @observable
  @persist
  accountPk: number = null;

  @observable
  @persist
  userToken: string | null = null;

  @observable
  @persist
  userEmail: string | null = null;

  @observable
  @persist
  rememberMe: string | null = null;

  @observable
  @persist('object')
  permissionsGranted: RequestPermission = {};

  @observable
  @persist('object')
  permissionsDenied: RequestPermission = {};

  @observable
  @persist('list')
  currentUserAccountPks: [] = [];

  @observable
  @persist
  isLoggingOut: boolean;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this);
  }

  @action
  setAccountPk = (accountPk: number) => {
    this.rootStore.customerStore.reset();
    this.accountPk = accountPk || null;
  };

  @action
  setUserToken = (userToken: string) => {
    this.userToken = userToken || null;
  };

  @action
  setUserEmail = (userEmail: string) => {
    this.userEmail = userEmail || null;
  };

  @action
  setRememberMe = (userEmail: string) => {
    this.rememberMe = userEmail || null;
  };

  @action
  setPermissionsGranted = (permissionsGranted: RequestPermission) => {
    this.permissionsGranted = permissionsGranted;
  };

  @action
  setPermissionsDenied = (permissionsDenied: RequestPermission) => {
    this.permissionsDenied = permissionsDenied;
  };

  @action
  setCurrentUserAccountPks = (currentAccountPks: []) => {
    currentAccountPks?.map((pk) => this.currentUserAccountPks.push(pk));
  };

  @action
  setIsLoggingOut = (isLoggingOut: boolean): void => {
    this.isLoggingOut = isLoggingOut;
  };

  @action
  verifyPhoneNumber = async (phoneNumber: string): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/verifyPhoneNumber',
      data: {phoneNumber},
      isHandleLoader: true,
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
    };
  };

  @action
  sendVerificationCode = async (
    phoneOrEmail: string,
  ): Promise<ResponseType> => {
    this.rootStore.reset();
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const company = window.location.hostname.includes('uown')
      ? 'UOWN'
      : 'KORNERSTONE';
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/svc/sendVerificationCode/${phoneOrEmail}?company=${company}`,
    });
    utilityStore?.setIsLoading(false);
    const responseData: ResponseType = {
      status: response?.status || 500,
      message: response?.message,
    };
    return responseData;
  };

  @action
  verifyCode = async (props: VerifyCodeRequest): Promise<number> => {
    const {phoneOrEmail, code} = props;
    const utilityStore = this.rootStore?.utilityStore;
    utilityStore?.setIsLoading(true);
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/svc/verifyCode/${phoneOrEmail}/${code}`,
    });
    let responseCode = (response && response?.status) || 500;
    if (responseCode === 200) {
      if (response?.data?.accountPks && response.data.accountPks.length > 0) {
        const loginResponse: LoginResponse = response.data;
        this.setAccountPk(loginResponse?.accountPks[0]);
        this.setCurrentUserAccountPks(loginResponse?.accountPks || []);
      } else {
        responseCode = 401;
      }
    }
    if (responseCode !== 200) {
      utilityStore?.setIsLoading(false);
    }

    return responseCode;
  };

  @action
  verifyPhoneNumberChangeCode = async (
    props: VerifyCodeRequest,
  ): Promise<number> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/verifyCode',
      data: props,
    });

    if (response?.status === 200) {
      this.rootStore.customerStore?.getPrimaryCustomerContactInfo(
        this.accountPk,
      );
    }

    return response?.status || 500;
  };

  @action
  switchUserAccount = async (accountPk: number) => {
    const utilityStore = this.rootStore?.utilityStore;
    const data = {
      accountPkToBeSwitched: accountPk,
    };
    utilityStore?.setIsLoading(true);
    const responseCode = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/switchUserAccount',
      data: data,
    });
    if (responseCode !== 501) {
      utilityStore?.setIsLoading(false);
      this.setAccountPk(accountPk);
    }
  };

  @action
  logout = async () => {
    this.rootStore.reset();
    if (!this.isLoggingOut) {
      this.setIsLoggingOut(true);
      const utilityStore = this.rootStore?.utilityStore;
      const response = await utilityStore?.sendRequest({
        method: 'GET',
        url: '/logout',
      });

      const getCookieValue = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop().split(';').shift();
        }
        return null; // Return null if the cookie is not found
      };
      const cookieValue = getCookieValue('user');

      if (cookieValue) {
        const decodedValue = decodeURIComponent(cookieValue);
        const jsonValue = JSON.parse(decodedValue?.split('j:')?.[1]);
        const {pathing, id, correspondenceType} = jsonValue;
        window.location.href = `/?pathing=${pathing}&id=${id}&type=${correspondenceType}`;
      } else {
        window.location.href = '/';
      }

      if (response?.status === 200) {
        this.setIsLoggingOut(false);
      }
      return 200;
    }
  };

  @action
  refresh = async () => {
    if (this.userToken) {
      const utilityStore = this.rootStore?.utilityStore;
      await utilityStore?.sendRequest({
        method: 'GET',
        url: '/renew',
      });
    }
  };

  @action
  requestPasswordReset = async (userEmail: string): Promise<number> => {
    const response = await axios
      .post(
        '/authentication/requestResetCode',
        {},
        {
          headers: {
            mail: userEmail,
          },
        },
      )
      .catch(() => {
        // eslint-disable-next-line no-console
        console.log('Unable to request password reset');
      });

    return (response && response.status) || 500;
  };

  @action
  verifyPasswordResetCode = async (
    userEmail: string,
    resetCode: string,
  ): Promise<string> => {
    const response = await axios
      .post(
        '/authentication/verifyResetCode',
        {},
        {
          headers: {
            mail: userEmail,
            code: resetCode,
          },
        },
      )
      .catch(() => {
        // eslint-disable-next-line no-console
        console.log('Unable to verify password reset code');
      });

    const isMaxAttemptsExceeded =
      response &&
      response.data &&
      response?.data?.message?.includes('maximum number of attempts');
    return isMaxAttemptsExceeded ? 'reload' : (response && response.data) || '';
  };

  @action
  completePasswordReset = async (
    password: string,
    key: string,
  ): Promise<number> => {
    const response = await axios
      .post(
        '/authentication/completeReset',
        {},
        {
          headers: {
            password: password,
            key: key,
          },
        },
      )
      .catch(() => {
        // eslint-disable-next-line no-console
        console.log('Unable to complete password reset');
      });

    return (response && response.status) || 500;
  };

  @action
  getAnalytics = async (pathing: string) => {
    const utilityStore = this.rootStore.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
      url: `/getAnalytics?pathing=${pathing}`,
    });

    return response;
  };

  @action
  reset = (): void => {
    this.accountPk = null;
    this.userToken = null;
    this.userEmail = null;
    this.permissionsGranted = {};
    this.permissionsDenied = {};
    this.currentUserAccountPks = [];
  };
}


utils/hours-of-operation.ts

export const HOURS_OF_OPERATION = {
  weekdays: '8:00 AM – 11:00 PM (EST)',
  saturday: '9:00 AM – 11:00 PM (EST)',
  sunday: '10:00 AM – 11:00 PM (EST)',
};

---------------------------------------------------------------------------------------------------------------------------------------------------------

---
### Scenario 1:Scenario: Exibir Hours of Operation para clientes Kornerstone no rodapé da sidebar
  Given que o usuário está autenticado no Portal do Cliente
  And o usuário pertence à company Kornerstone
  When a sidebar do portal é carregada
  Then o componente "Hours of Operation" deve ser exibido
  And o componente deve aparecer no rodapé da sidebar
  And o componente deve estar abaixo dos itens de navegação


Screeshot

**PASS**

---
### Scenario 2: – Exibir título e divisores corretos no componente Hours of Operation
  Given que o componente "Hours of Operation" está visível
  Then o título exibido deve ser "Hours of operation"
  And devem existir divisores visuais acima e abaixo do título


Screeshot
**PASS**

---
### Scenario: 3 – Exibição e comportamento dos links sociais em contas Kornerstone
  Given que o componente "Hours of Operation" está visível
  Then os ícones do Facebook e Instagram devem ser exibidos
  And os links devem direcionar para as URLs oficiais da Kornerstone
  And os links devem ser abertos em nova aba


**PASS**

---
### Scenario: 4 – Horários corretos de funcionamento exibidos no Portal Kornerstone
  Given que o usuário pertence à marca Kornerstone
  When o componente "Hours of Operation" é exibido
  Then os horários devem ser exibidos como:
    | Dia       | Horário                    |
    | Mon–Fri   | 8:00 AM – 11:00 PM (EST)   |
    | Sat       | 9:00 AM – 11:00 PM (EST)   |
    | Sun       | 10:00 AM – 11:00 PM (EST)  |


Screeshot

**PASS**

---
### Scenario: 5 – Não exibir horários antigos no Portal Kornerstone
  Given que o componente "Hours of Operation" está visível
  Then não devem existir referências a horários antigos
  And não deve existir referência ao fuso horário MST
  And não deve existir o texto "Sun: Closed"


**PASS**

---
### Scenario 6: Exibir horário de funcionamento correto no Portal UOWN
  Given que o usuário pertence à marca UOWN
  When a tela apropriada do portal é carregada
  Then o horário de funcionamento deve ser exibido
  And os horários devem ser exibidos como:
    | Dia               | Horário                    |
    | Monday – Friday   | 8:00 AM – 11:00 PM (EST)   |
    | Saturday          | 9:00 AM – 11:00 PM (EST)   |
    | Sunday            | 10:00 AM – 11:00 PM (EST)  |
```

Screeshot

**PASS**

---
### Scenario 7: Não exibir horários legados no Portal UOWN
  Given que o horário de funcionamento está visível
  Then não devem existir horários antigos exibidos
  And não devem existir variações fora do horário oficial do Call Center


**PASS**

---
### Scenario 8: Garantir consistência de horários entre UOWN e Kornerstone
  Given que os horários de funcionamento estão visíveis em ambos os portais
  Then os períodos de dias úteis, sábado e domingo devem ser idênticos
  And os horários de abertura e fechamento devem coincidir
  And o fuso horário deve ser o mesmo


Screeshot

**PASS**

---
### Scenario 9: Exibir horário correto em e-mail ao cliente
  Given que um e-mail transacional é enviado ao cliente
  When o conteúdo do e-mail é visualizado
  Then o horário de funcionamento exibido deve corresponder ao horário oficial do Call Center
  And o fuso horário deve ser EST


Screeshot

**ERROR**
Está exibindo os horários antigos contas uown e kornerstone

---
### Scenario: 10 – Responsividade da sidebar
### Scenario: Ocultar sidebar em telas pequenas
  Given que o portal é acessado em telas pequenas
  When a página é carregada
  Then a sidebar não deve ser exibida
  And o componente "Hours of Operation" não deve ser renderizado


Screeshot

**PASS**

---
### Scenario 11: Alternar entre contas Kornerstone e UOWN validando os horários de funcionamento
  Given que o usuário está autenticado no Portal do Cliente
  And o usuário possui contas ativas nas marcas Kornerstone e UOWN
  When o usuário seleciona a conta Kornerstone
  Then o horário de funcionamento deve ser exibido conforme o padrão da Kornerstone
  And os horários devem corresponder ao horário oficial do Call Center (EST)

  When o usuário alterna para a conta UOWN
  Then o horário de funcionamento deve ser exibido na área apropriada do Portal UOWN
  And os horários devem corresponder ao horário oficial do Call Center (EST)
```

Screeshot
**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: Display Hours of Operation for Kornerstone customers at the bottom of the sidebar
```gherkin
Scenario: Display Hours of Operation for Kornerstone customers at the bottom of the sidebar
  Given the user is authenticated in the Customer Portal
  And the user belongs to the Kornerstone company
  When the portal sidebar is loaded
  Then the "Hours of Operation" component must be displayed
  And the component must appear at the bottom of the sidebar
  And the component must be displayed below the navigation items
```

![Screenshot_at_Feb_03_01-32-39](/uploads/b605f5f545eab63c15e1a784122f38e4/Screenshot_at_Feb_03_01-32-39.png){width=137 height=600}

**PASS**

---
### Scenario 2: Display correct title and dividers in the Hours of Operation component
```gherkin
Scenario: Display correct title and dividers in the Hours of Operation component
  Given the "Hours of Operation" component is visible
  Then the displayed title must be "Hours of operation"
  And visual dividers must exist above and below the title
```

![image](/uploads/313e70a40419336d284a7ac31694d4ab/image.png){width=200 height=171}
![image](/uploads/85018663afa4d372d23eeca4c2ce663e/image.png){width=203 height=124}

**PASS**

---
### Scenario 3: Display and behavior of social media links for Kornerstone accounts
```gherkin
Scenario: Display and behavior of social media links for Kornerstone accounts
  Given the "Hours of Operation" component is visible
  Then the Facebook and Instagram icons must be displayed
  And the links must redirect to the official Kornerstone URLs
  And the links must open in a new browser tab
```

![Screenshot_at_Feb_03_05-32-44](/uploads/a00422e69da74b3bd5c687696bef77d3/Screenshot_at_Feb_03_05-32-44.png){width=202 height=174}

**PASS**

---
### Scenario 4: Display correct hours of operation in the Kornerstone Customer Portal
```gherkin
Scenario: Display correct hours of operation in the Kornerstone Customer Portal
  Given the user belongs to the Kornerstone brand
  When the "Hours of Operation" component is displayed
  Then the hours must be displayed as:
    | Day      | Hours                     |
    | Mon–Fri  | 8:00 AM – 11:00 PM (EST)  |
    | Sat      | 9:00 AM – 11:00 PM (EST)  |
    | Sun      | 10:00 AM – 11:00 PM (EST) |
```

![Screenshot_at_Feb_03_01-09-52](/uploads/c7cfc395a7814e5f2d2b398e4f1c73b3/Screenshot_at_Feb_03_01-09-52.png){width=900 height=447}
![Screenshot_at_Feb_03_01-10-04](/uploads/deeaa5a7e085fb9284d9930069a73728/Screenshot_at_Feb_03_01-10-04.png){width=900 height=447}
![Screenshot_at_Feb_03_01-10-44](/uploads/c6b0b2447faeb4a129348416ce1ea343/Screenshot_at_Feb_03_01-10-44.png){width=900 height=443}
![Screenshot_at_Feb_03_01-10-56](/uploads/e5516212f810eab1eba4d9e4e503135f/Screenshot_at_Feb_03_01-10-56.png){width=900 height=444}
![Screenshot_at_Feb_03_01-11-06](/uploads/3149ea26622398379c883ff2eaaae54b/Screenshot_at_Feb_03_01-11-06.png){width=900 height=441}
![Screenshot_at_Feb_03_01-11-16](/uploads/578afd469cda66074bae821085aea239/Screenshot_at_Feb_03_01-11-16.png){width=900 height=443}

**PASS**

---
### Scenario 5: Do not display legacy hours in the Kornerstone Customer Portal
```gherkin
Scenario: Do not display legacy hours in the Kornerstone Customer Portal
  Given the "Hours of Operation" component is visible
  Then no legacy hours must be displayed
  And no reference to the MST timezone must exist
  And the text "Sun: Closed" must not be displayed
```

**PASS**

---
### Scenario 6: Display correct hours of operation in the UOWN Customer Portal
```gherkin
Scenario: Display correct hours of operation in the UOWN Customer Portal
  Given the user belongs to the UOWN brand
  When the appropriate portal screen is loaded
  Then the hours of operation must be displayed
  And the hours must be displayed as:
    | Day             | Hours                     |
    | Monday – Friday | 8:00 AM – 11:00 PM (EST)  |
    | Saturday        | 9:00 AM – 11:00 PM (EST)  |
    | Sunday          | 10:00 AM – 11:00 PM (EST) |
```

![Screenshot_at_Feb_03_01-25-56](/uploads/89df15a72007fbc93ae4695ee273cf42/Screenshot_at_Feb_03_01-25-56.png){width=900 height=443}
![Screenshot_at_Feb_03_01-26-03](/uploads/d609e4077fa969c145b614ff1438fc78/Screenshot_at_Feb_03_01-26-03.png){width=900 height=446}
![Screenshot_at_Feb_03_01-26-10](/uploads/65a3159bce572d3be01ee0c702557713/Screenshot_at_Feb_03_01-26-10.png){width=900 height=451}
![Screenshot_at_Feb_03_01-26-17](/uploads/621d389669eaac4322dbebe5fc1f20c8/Screenshot_at_Feb_03_01-26-17.png){width=900 height=444}
![Screenshot_at_Feb_03_01-26-24](/uploads/167cdb2d5560107fe075e1eb44bded26/Screenshot_at_Feb_03_01-26-24.png){width=900 height=445}
![Screenshot_at_Feb_03_01-26-32](/uploads/decede0615cafb0942783f703ef89f5e/Screenshot_at_Feb_03_01-26-32.png){width=900 height=435}

**PASS**

---
### Scenario 7: Do not display legacy hours in the UOWN Customer Portal
```gherkin
Scenario: Do not display legacy hours in the UOWN Customer Portal
  Given the hours of operation are visible
  Then no legacy hours must be displayed
  And no variations outside the official Call Center hours must exist
```

**PASS**

---
### Scenario 8: Ensure consistency of hours between UOWN and Kornerstone
```gherkin
Scenario: Ensure consistency of hours between UOWN and Kornerstone
  Given the hours of operation are visible in both portals
  Then weekday, Saturday, and Sunday periods must be identical
  And opening and closing times must match
  And the timezone must be the same
```

**PASS**

---
### Scenario 9: Display correct hours of operation in customer emails
```gherkin
Scenario: Display correct hours of operation in customer emails
  Given a transactional email is sent to the customer
  When the email content is viewed
  Then the displayed hours of operation must match the official Call Center schedule
  And the timezone must be EST
```

![Screenshot_at_Feb_03_05-09-00](/uploads/a22095abc0a94880b96ad7a001b24a21/Screenshot_at_Feb_03_05-09-00.png){width=479 height=600}
![Screenshot_at_Feb_03_05-28-33](/uploads/92fea325964ffadd9df81c15023aca54/Screenshot_at_Feb_03_05-28-33.png){width=481 height=600}

**PASS**

---
### Scenario 10: Sidebar responsiveness on small screens
```gherkin
Scenario: Hide sidebar on small screens
  Given the portal is accessed on small screens
  When the page is loaded
  Then the sidebar must not be displayed
  And the "Hours of Operation" component must not be rendered
```

![Screenshot_at_Feb_03_03-49-03](/uploads/c95f34b4573f7a18bd7329cf6975b5e7/Screenshot_at_Feb_03_03-49-03.png){width=334 height=600}
![Screenshot_at_Feb_03_03-48-47](/uploads/d133733518ef07a7056706dc7a7c6f83/Screenshot_at_Feb_03_03-48-47.png){width=328 height=600}
![WhatsApp_Image_2026-02-03_at_10.26.43](/uploads/03eb1115b1d413c29b2553cc10439345/WhatsApp_Image_2026-02-03_at_10.26.43.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-03_at_10.26.43__1_](/uploads/5438c7a33be906fab7cfcabc7b80b932/WhatsApp_Image_2026-02-03_at_10.26.43__1_.jpeg){width=278 height=600}

**PASS**

---
### Scenario 11: Switch between Kornerstone and UOWN accounts validating hours of operation
```gherkin
Scenario: Switch between Kornerstone and UOWN accounts validating hours of operation
  Given the user is authenticated in the Customer Portal
  And the user has active accounts under both Kornerstone and UOWN brands
  When the user selects the Kornerstone account
  Then the hours of operation must be displayed according to the Kornerstone standard
  And the hours must match the official Call Center schedule (EST)

  When the user switches to the UOWN account
  Then the hours of operation must be displayed in the appropriate UOWN portal area
  And the hours must match the official Call Center schedule (EST)
```

**PASS**

---





---------------------------------------------------------------------------------------------------------------------------------------------------------



