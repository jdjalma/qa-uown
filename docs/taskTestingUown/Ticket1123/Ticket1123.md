---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1123


UOWN | Servicing | Add Ability to set and Remove Priority on a Log


Synopsis
* As an admin or manager, I want to set or remove a priority flag on activity logs so that important logs are always displayed at the top.
* Introduce the ability for admins and managers to mark an activity log as priority or remove the flag when no longer needed. Priority logs must be visually distinguished and automatically displayed at the top of the activity logs list.


Business Objective
Currently, all activity logs are displayed in chronological order, making it harder for teams to quickly identify critical events. By enabling priority flag management:
* Critical information is surfaced immediately.
* Operational efficiency improves since managers can highlight urgent or high-importance items.
* System behavior remains consistent with backend capabilities, as the flag already exists there.


Feature Request | Business Requirements
    Set/Remove Priority
        * Only admins/managers can set or remove a priority flag on a log.          
    * Display Behavior
        * All logs marked with priority must be displayed above non-priority logs.
        * Ensure the distinction is clear in the UI 
    * Permissions
        * Restrict the ability to manage priority flags to admins/managers.
        * Regular users can view priority logs but cannot change their status.      
    * Backend Integration
        * The backend already supports a priority flag; reuse this field.
        * Ensure the frontend updates the flag state correctly via existing endpoints.
    * Consistency & UX
        * Maintain standard log features (sorting, filtering, pagination).
        * Verify priority logs remain visible and consistent across sessions.
    * Testing & Documentation
        * Add tests to confirm only authorized roles can set/remove priority.
        * Confirm logs with priority display correctly at the top.


Tests Steps:
* As an admin or manager, you automatically have the toggle log priority [modify] permission assigned to your user.
* You must be able to set and remove the priority for activity logs.
* As a user without this permission:
* You must be able to view the priority logs, but not edit them.
* Priority logs must appear before non-priority logs, while the logs should still be sorted by row_created_time.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
```cucumber
# UOWN | Atendimento | Adicionar Capacidade de Definir e Remover Prioridade em um Log

Sinopse
* Como um administrador ou gerente, eu quero definir ou remover uma flag de prioridade em logs de atividade para que logs importantes sejam sempre exibidos no topo.
* Introduzir a capacidade para administradores e gerentes marcarem um log de atividade como prioridade ou remover a flag quando não for mais necessária. Logs prioritários devem ser visualmente distinguidos e automaticamente exibidos no topo da lista de logs de atividade.

Objetivo de Negócio
Atualmente, todos os logs de atividade são exibidos em ordem cronológica, dificultando que as equipes identifiquem rapidamente eventos críticos. Ao habilitar o gerenciamento de flag de prioridade:
* Informações críticas são apresentadas imediatamente.
* A eficiência operacional melhora, pois gerentes podem destacar itens urgentes ou de alta importância.
* O comportamento do sistema permanece consistente com as capacidades do backend, já que a flag já existe lá.

Solicitação de Funcionalidade | Requisitos de Negócio
    Definir/Remover Prioridade
        * Apenas administradores/gerentes podem definir ou remover uma flag de prioridade em um log.
    * Comportamento de Exibição
        * Todos os logs marcados com prioridade devem ser exibidos acima dos logs não prioritários.
        * Garantir que a distinção seja clara na interface do usuário
    * Permissões
        * Restringir a capacidade de gerenciar flags de prioridade a administradores/gerentes.
        * Usuários regulares podem visualizar logs prioritários mas não podem alterar seu status.
    * Integração com Backend
        * O backend já suporta uma flag de prioridade; reutilizar este campo.
        * Garantir que o frontend atualize o estado da flag corretamente via endpoints existentes.
    * Consistência e UX
        * Manter funcionalidades padrão de log (ordenação, filtragem, paginação).
        * Verificar que logs prioritários permaneçam visíveis e consistentes entre sessões.
    * Testes e Documentação
        * Adicionar testes para confirmar que apenas funções autorizadas podem definir/remover prioridade.
        * Confirmar que logs com prioridade são exibidos corretamente no topo.

Passos de Teste:
* Como um administrador ou gerente, você automaticamente tem a permissão de alternar prioridade de log [modificar] atribuída ao seu usuário.
* Você deve ser capaz de definir e remover a prioridade para logs de atividade.
* Como um usuário sem esta permissão:
* Você deve ser capaz de visualizar os logs prioritários, mas não editá-los.
* Logs prioritários devem aparecer antes dos logs não prioritários, enquanto os logs ainda devem ser ordenados por row_created_time.
```

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 5 arquivos
+
52
−
9
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

custom
‎er.tsx‎
+25 -4

pages/custome
‎r-information‎

[accou
‎nt].tsx‎
+21 -0

packag
‎e.json‎
+1 -1

serv
‎er.js‎
+1 -0

yarn
‎.lock‎
+4 -4

 domain/stores/customer.tsx 
+
25
−
4

Visualizado
@@ -54,6 +54,7 @@ export type ActivityLogParams = {
  logTypes?: string[];
  notes?: string;
  createdBy?: string;
  orderByPriority?: boolean;
} & PageableParams;

export class CustomerStore extends BaseStore {
@@ -690,6 +691,7 @@ export class CustomerStore extends BaseStore {
      createdBy = '',
      page = 0,
      size = 10,
      orderByPriority = true,
    }: ActivityLogParams = {},
  ): Promise<ResponseTyped<PaginatedResults<ActivityLog>>> => {
    const params = {
@@ -698,6 +700,7 @@ export class CustomerStore extends BaseStore {
      logTypes: logTypes.join(','),
      notes,
      createdBy,
      orderByPriority,
    };
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
@@ -719,6 +722,23 @@ export class CustomerStore extends BaseStore {
    };
  };

  @action
  toggleActivityLogPriority = async (
    logPk: number,
  ): Promise<ResponseTyped<PaginatedResults<ActivityLog>>> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: `/uown/svc/updateActivityLogPriority?pk=${logPk}`,
    });

    return {
      status: response?.status || 500,
      message: response?.message || '',
      data: response?.data || defaultPaginatedResp([]),
    };
  };

  @action
  setLastReviewLog = (lastReviewLog: string) => {
    this.lastReviewLog = toJS(lastReviewLog);
@@ -1686,11 +1706,10 @@ export class CustomerStore extends BaseStore {
  @action
  setProtectionPlanInfo = (info: ProtectionPlanInfo | null) => {
    this.protectionPlanInfo = info;
  }
  };

  @action
  getProtectionPlanInfo = async (accountPk: number) => {

    const {utilityStore} = this?.rootStore;
    const response = await utilityStore?.sendRequest({
      method: 'GET',
@@ -1698,11 +1717,13 @@ export class CustomerStore extends BaseStore {
    });

    if (response?.status === 200) {
      this.setProtectionPlanInfo(response?.data?.protectionPlanInfo || response?.data);
      this.setProtectionPlanInfo(
        response?.data?.protectionPlanInfo || response?.data,
      );
    }

    return {
      status: response?.status || 500,
    };
  }
  };
}
 pages/customer-information/[account].tsx 
+
21
−
0

Visualizado
@@ -211,6 +211,13 @@ const CustomerInformation = (props: CustomerInformationProps) => {
    'customer_information',
    'add_bank_accounts',
  );

  const hasToggleActivityLogsPriorityPermission = hasModifyPermission(
    permissions,
    'customer_information',
    'toggle_log_priority',
  );

  const hasNotesInternalPermission = !!permissions?.access
    ?.customer_information;
  const hasNotesStandardPermission = !!permissions?.access
@@ -460,6 +467,18 @@ const CustomerInformation = (props: CustomerInformationProps) => {
    };
  }, [customerStore.primaryCustomerContactInfo]);

  const handleToggleActivityLogPriority = useCallback(async (pk: number) => {
    const {status, message} = await customerStore.toggleActivityLogPriority(pk);

    if (status >= 400) {
      showToast('error', message);
      return;
    }

    showToast('success', 'Activity log priority updated successfully!');
    customerStore.setReloadActivityLog(true);
  }, []);

  const handleCreateNewCreditCard = useCallback(
    async (ccInfo: CreditCardInfo): Promise<ResponseType> => {
      const response = await customerStore.createNewCreditCard(
@@ -760,6 +779,8 @@ const CustomerInformation = (props: CustomerInformationProps) => {
        logTypes={customerStore.activityLogs.filtersOptions?.logTypes || []}
        progressPending={activityLogsLoading}
        paginationServer
        handleToggleActivityLogPriority={handleToggleActivityLogPriority}
        hasToggleActivityLogsPriorityPermission={hasToggleActivityLogsPriorityPermission}
      />

      <AgentIdVerificationPopup

-----


 3 arquivos
+
145
−
77
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src
‎/lib‎

data-
‎table‎

filterTableC
‎omponent.tsx‎
+1 -1

layouts/collapsabl
‎e-edit/activity-log‎

inde
‎x.tsx‎
+143 -75

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/data-table/filterTableComponent.tsx 
+
1
−
1

Visualizado
@@ -51,7 +51,7 @@ export const FilterTableComponent = <T extends TableRow>(props: FilterTableProps
  // key prop and/or dataStructure prop is mandatory for sortable to work properly

  const [columnWidths, setColumnWidths] = useState<string[]>(
    columns.map((col: TableColumn<TableRow>) => col?.width || '100px')
    columns.map((col: TableColumn<TableRow>) => col?.width || '50px')
  );
  const [resizingColumnIndex, setResizingColumnIndex] = useState<number | null>(
    null
 libs/common-ui/src/lib/layouts/collapsable-edit/activity-log/index.tsx 
+
143
−
75

Visualizado
@@ -28,6 +28,7 @@ import {
  TableStyles,
} from 'react-data-table-component';
import { LogNotes } from 'src/lib/logNotes';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';

const conditionalActivityLogTableStyles = [
  {
@@ -41,83 +42,144 @@ const conditionalActivityLogTableStyles = [

const activityLogTableColumns: (
  showFullDataChangeLogs: boolean,
  setShowFullDataChangeLogs: Dispatch<SetStateAction<boolean>>
) => TableRow[] = (showFullDataChangeLogs, setShowFullDataChangeLogs) => [
  {
    name: 'Date',
    selector: (row: ActivityLog) => (
      formatDate({
        f: 'user',
        d: row?.rowCreatedTimestamp,
        withTime: true,
        overrideFormat: 'iii- MM/dd/yyyy',
      })
    ),
    key: 'rowCreatedTimestamp',
    width: '14.5rem',
    sortable: true,
  },
  {
    name: 'Type',
    key: 'logType',
    selector: (row: ActivityLog) => row?.activityLogInfo?.logType,
    width: '15.5rem',
    sortable: true,
  },
  {
    name: 'User ID',
    key: 'createdBy',
    selector: (row: ActivityLog) => row?.activityLogInfo?.createdBy,
    width: '18.75rem',
    sortable: true,
  },
  {
    name: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <p style={{ margin: '0' }}>Notes</p>
        <div style={{ marginLeft: '1rem', cursor: 'pointer' }}>
          {showFullDataChangeLogs ? (
            <FontAwesomeIcon
              onClick={() => setShowFullDataChangeLogs(false)}
              icon={light('chevron-up')}
              size="lg"
  setShowFullDataChangeLogs: Dispatch<SetStateAction<boolean>>,
  hasToggleActivityLogsPriorityPermission: boolean,
  handleToggleActivityLogPriority?: (logPk: number) => void
) => TableRow[] = (
  showFullDataChangeLogs,
  setShowFullDataChangeLogs,
  hasToggleActivityLogsPriorityPermission,
  handleToggleActivityLogPriority
) => {
  const columns = [
    {
      name: 'Date',
      selector: (row: ActivityLog) =>
        formatDate({
          f: 'user',
          d: row?.rowCreatedTimestamp,
          withTime: true,
          overrideFormat: 'iii- MM/dd/yyyy',
        }),
      key: 'rowCreatedTimestamp',
      width: '14.5rem',
      sortable: true,
    },
    {
      name: 'Type',
      key: 'logType',
      selector: (row: ActivityLog) => row?.activityLogInfo?.logType,
      width: '15.5rem',
      sortable: true,
    },
    {
      name: 'User ID',
      key: 'createdBy',
      selector: (row: ActivityLog) => row?.activityLogInfo?.createdBy,
      width: '18.75rem',
      sortable: true,
    },
    {
      name: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p style={{ margin: '0' }}>Notes</p>
          <div style={{ marginLeft: '1rem', cursor: 'pointer' }}>
            {showFullDataChangeLogs ? (
              <FontAwesomeIcon
                onClick={() => setShowFullDataChangeLogs(false)}
                icon={light('chevron-up')}
                size="lg"
              />
            ) : (
              <FontAwesomeIcon
                onClick={() => setShowFullDataChangeLogs(true)}
                icon={light('chevron-down')}
                size="lg"
              />
            )}
          </div>
        </div>
      ),
      key: 'notes',
      sortable: true,
      width: '34.25rem',
      selector: (row: ActivityLog) => {
        //if (row?.activityLogInfo?.logType === 'DATA_CHANGE') {
        return (
          <div
            style={{
              width: '100%',
              maxWidth: '28.75rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <LogNotes
              logType={row?.activityLogInfo?.logType}
              topLevelShowFullLogState={showFullDataChangeLogs}
              notes={row?.activityLogInfo?.notes}
            />
          ) : (
          </div>
        );
      },
    },
  ];

  if (handleToggleActivityLogPriority) {
    columns.unshift({
      name: ' ',
      key: '',
      maxWidth: '50px',
      selector: (row: ActivityLog) => {
        if (hasToggleActivityLogsPriorityPermission) {
          return (
            <div
              style={{ cursor: 'pointer' }}
              onClick={() => {
                handleToggleActivityLogPriority(
                  row.activityLogInfo.activityLogPK
                );
              }}
            >
              {row.activityLogInfo.priority ? (
                <FontAwesomeIcon
                  icon={faBookmark}
                  size="1x"
                  style={{ color: '#e50000' }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={light('bookmark')}
                  style={{ color: '#000' }}
                  size="1x"
                />
              )}
            </div>
          );
        }

        if (
          !hasToggleActivityLogsPriorityPermission &&
          row.activityLogInfo.priority
        ) {
          return (
            <FontAwesomeIcon
              onClick={() => setShowFullDataChangeLogs(true)}
              icon={light('chevron-down')}
              size="lg"
              icon={faBookmark}
              size="1x"
              style={{ color: '#e50000' }}
            />
          )}
        </div>
      </div>
    ),
    key: 'notes',
    sortable: true,
    width: '34.25rem',
    selector: (row: ActivityLog) => {
      //if (row?.activityLogInfo?.logType === 'DATA_CHANGE') {
      return (
        <div
          style={{
            width: '100%',
            maxWidth: '28.75rem',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <LogNotes
            logType={row?.activityLogInfo?.logType}
            topLevelShowFullLogState={showFullDataChangeLogs}
            notes={row?.activityLogInfo?.notes}
          />
        </div>
      );
    },
  },
];
          );
        }

        return null;
      },
      sortable: false,
    } as any);
  }
  return columns;
};

type IDataTableCustomProps = Omit<
  IDataTableProps<TableRow>,
@@ -150,6 +212,8 @@ export interface ActivityLogProps extends IDataTableCustomProps {
  hasNotesStandardPermission: boolean;
  hasNotesInternalPermission: boolean;
  setIsLoading: (isLoading: boolean) => void;
  hasToggleActivityLogsPriorityPermission?: boolean;
  handleToggleActivityLogPriority?: (logPk: number) => void;
  logTypes: string[];
  accountPk?: number;
  className?: string;
@@ -193,6 +257,8 @@ export const ActivityLogPanel = ({
  onSubmitFilters,
  onChangePage,
  onChangeRowsPerPage,
  hasToggleActivityLogsPriorityPermission = false,
  handleToggleActivityLogPriority,
  ...props
}: ActivityLogProps) => {
  const [displayAddNewLogModal, setDisplayAddNewLogModal] = useState(false);
@@ -332,7 +398,9 @@ export const ActivityLogPanel = ({
        dataStructure="activityLogInfo"
        columns={activityLogTableColumns(
          showFullDataChangeLogs,
          setShowFullDataChangeLogs
          setShowFullDataChangeLogs,
          hasToggleActivityLogsPriorityPermission,
          handleToggleActivityLogPriority
        )}
        conditionalRowStyles={
          conditionalActivityLogTableStyles as ConditionalStyles<TableRow>[]

-----

Comparar
e
 1 arquivo
+
6
−
1
 src/main/java/com/uownleasing/svc/rest/svc/SvcLogController.java 
+
6
−
1

Visualizado
@@ -25,11 +25,12 @@ public class SvcLogController {
        @RequestParam(required = false, defaultValue = "") Collection<LogType> logTypes,
        @RequestParam(required = false, defaultValue = "") String createdBy,
        @RequestParam(required = false, defaultValue = "") String notes,
        @RequestParam(required = false, defaultValue = "false") boolean orderByPriority,
        Pageable pageable) {
        Collection<LogType> filterByLogTypes = logTypes.isEmpty()
            ? Arrays.asList(LogType.values()) : logTypes;
        Page<SvActivityLog> activityLogs = loggingService.getAllActiveActivityLogsByAccountPk(
            accountPk, filterByLogTypes, createdBy, notes, pageable);
            accountPk, filterByLogTypes, createdBy, notes, pageable, orderByPriority);
        Collection<LogType> availableLogTypeOptions = loggingService.getLogTypesForAccountPk(accountPk);
        return new PageWithEnumFilters<>(activityLogs, Map.of("logTypes", availableLogTypeOptions));
    }
@@ -44,4 +45,8 @@ public class SvcLogController {
        return loggingService.createOrUpdateActivityLog(activityLogInfo);
    }

    @PostMapping("/updateActivityLogPriority")
    public void updateActivityLogPriority(@RequestParam Long pk){
        loggingService.toggleActivityLogPriority(pk);
    }
}

-----


 3 arquivos
+
121
−
12
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/uown
‎leasing/svc/common‎

db/rep
‎ository‎

SvActivityL
‎ogRepo.java‎
+24 -6

ser
‎vice‎

LoggingSe
‎rvice.java‎
+17 -6

test/java/com/uownleas
‎ing/svc/common/service‎

LoggingServ
‎iceTest.java‎
+80 -0

 src/main/java/com/uownleasing/svc/common/db/repository/SvActivityLogRepo.java 
+
24
−
6

Visualizado
@@ -22,16 +22,28 @@ public interface SvActivityLogRepo extends JpaRepository<SvActivityLog, Long>, S
            "where l.activityLogInfo.accountPK = :accountPk " +
            "and (l.activityLogInfo.isHidden is null or l.activityLogInfo.isHidden = false) " +
            "and (l.activityLogInfo.deleted is null or l.activityLogInfo.deleted = false) " +
            "order by l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Pageable pageable);
            "order by" +
            "      case" +
            "        when :sortByPriority = true and l.activityLogInfo.priority = true then 1" +
            "        when :sortByPriority = true and (l.activityLogInfo.priority = false or l.activityLogInfo.priority is null) then 0" +
            "        else -1" +
            "      end desc," +
            "      l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Pageable pageable, Boolean sortByPriority);

    @Query("select l from SvActivityLog l " +
            "where l.activityLogInfo.accountPK = :accountPk " +
            "and l.activityLogInfo.logType in :types " +
            "and (l.activityLogInfo.isHidden is null or l.activityLogInfo.isHidden = false) " +
            "and (l.activityLogInfo.deleted is null or l.activityLogInfo.deleted = false) " +
            "order by l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Collection<LogType> types, Pageable pageable);
            "order by" +
            "      case" +
            "        when :sortByPriority = true and l.activityLogInfo.priority = true then 1" +
            "        when :sortByPriority = true and (l.activityLogInfo.priority = false or l.activityLogInfo.priority is null) then 0" +
            "        else -1" +
            "      end desc," +
            "      l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Collection<LogType> types, Pageable pageable, Boolean sortByPriority);

    @Query("select l from SvActivityLog l " +
            "where l.activityLogInfo.accountPK = :accountPk " +
@@ -40,8 +52,14 @@ public interface SvActivityLogRepo extends JpaRepository<SvActivityLog, Long>, S
            "and (:createdBy = '' or lower(l.activityLogInfo.createdBy) like lower(concat('%', :createdBy, '%')) ESCAPE '\') " +
            "and (l.activityLogInfo.isHidden is null or l.activityLogInfo.isHidden = false) " +
            "and (l.activityLogInfo.deleted is null or l.activityLogInfo.deleted = false) " +
            "order by l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Collection<LogType> types, String createdBy, String notes, Pageable pageable);
            "order by" +
            "      case" +
            "        when :sortByPriority = true and l.activityLogInfo.priority = true then 1" +
            "        when :sortByPriority = true and (l.activityLogInfo.priority = false or l.activityLogInfo.priority is null) then 0" +
            "        else -1" +
            "      end desc," +
            "      l.rowCreatedTimestamp desc")
    Page<SvActivityLog> findAllActiveActivityLogsForAccount(long accountPk, Collection<LogType> types, String createdBy, String notes, Pageable pageable, Boolean sortByPriority);

    void removeByPk(long pk);

 src/main/java/com/uownleasing/svc/common/service/LoggingService.java 
+
17
−
6

Visualizado
@@ -5,6 +5,7 @@ import com.uownleasing.common.pojo.*;
import com.uownleasing.svc.common.config.SvThreadAttributes;
import com.uownleasing.svc.common.db.entity.SvActivityLog;
import com.uownleasing.svc.common.db.repository.SvActivityLogRepo;
import com.uownleasing.svc.common.exception.SvCommonException;
import lombok.extern.slf4j.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.data.domain.Page;
@@ -36,21 +37,31 @@ public class LoggingService {
        return activityLogRepo.save(activityLog);
    }

    public void toggleActivityLogPriority(Long pk){
        SvActivityLog activityLog = activityLogRepo.locateByPk(pk);
        if (activityLog.getActivityLogInfo().getPriority() == null) {
            activityLog.getActivityLogInfo().setPriority(true);
        } else {
            activityLog.getActivityLogInfo().setPriority(!activityLog.getActivityLogInfo().getPriority());
        }
        activityLogRepo.save(activityLog);
    }

    public List<SvActivityLog> getAllActivityLogByAccountPK(long accountPK){
        List<SvActivityLog> activityLogs = activityLogRepo.findAllByActivityLogInfo_AccountPKOrderByRowCreatedTimestampDesc(accountPK);
        return CollectionUtils.isEmpty(activityLogs) ? Collections.emptyList() : activityLogs;
    }

    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Pageable pageable) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, pageable);
    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Pageable pageable, Boolean sortByPriority) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, pageable, sortByPriority);
    }

    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Collection<LogType> logTypes, Pageable pageable) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, logTypes, pageable);
    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Collection<LogType> logTypes, Pageable pageable, Boolean sortByPriority) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, logTypes, pageable, sortByPriority);
    }

    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Collection<LogType> logTypes, String createdBy, String notes, Pageable pageable) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, logTypes, createdBy, notes, pageable);
    public Page<SvActivityLog> getAllActiveActivityLogsByAccountPk(long accountPk, Collection<LogType> logTypes, String createdBy, String notes, Pageable pageable, Boolean sortByPriority) {
        return activityLogRepo.findAllActiveActivityLogsForAccount(accountPk, logTypes, createdBy, notes, pageable, sortByPriority);
    }

    public List<SvActivityLog> getAllActivityLogByRefAccountID(String refAccountID){

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Usuário sem permissão de administrador ou gerente tenta definir prioridade em log mas nenhuma ação é executada devido à falta de role adequada
User without administrator or manager permission attempts to set log priority but no action is executed due to lack of proper role

Usuário sem permissão de administrador ou gerente tenta remover prioridade de log mas nenhuma ação é executada devido à falta de role adequada
User without administrator or manager permission attempts to remove log priority but no action is executed due to lack of proper role

Gerente define prioridade em log devido a evento crítico, após resolução da situação o administrador remove a marcação de prioridade
Manager sets priority on log due to critical event, after situation resolution administrator removes priority flag

Agentes visualizam logs de atividade prioritários exibidos acima dos não prioritários na lista com indicador de prioridade visível na primeira coluna da tabela
Agents view priority activity logs displayed above non-priority ones in the list with priority indicator visible in the first table column

Sistema mantém logs prioritários e não prioritários ordenados por data de criação dentro de seus respectivos grupos de prioridade
System maintains priority and non-priority logs sorted by creation date within their respective priority groups

Sistema preserva funcionalidades de ordenação, filtragem e paginação após implementação do recurso de prioridade
System preserves sorting, filtering and pagination functionalities after priority feature implementation

Sistema persiste o estado de prioridade dos logs entre diferentes sessões do usuário
System persists log priority state between different user sessions

Usuário recebe role de gerente e consegue definir e remover prioridade em logs de atividade
User receives manager role and can set and remove priority on activity logs

Gerente perde role e não consegue mais definir ou remover prioridade em logs mas ainda visualiza logs prioritários
Manager loses role and can no longer set or remove priority on logs but still views priority logs


Gerentes ou administradores que nao tem a permissao toggle log priority [modify] nao podem sinalizar ou remover priodidades dos logs.
Managers or administrators who do not have the toggle log priority [modify] permission cannot flag or remove priorities from logs.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2


> **User without administrator or manager permission attempts to set log priority but no action is executed due to lack of proper role**

![Screenshot_at_Oct_23_15-55-50](/uploads/05515717afcdee54aae30509d033a955/Screenshot_at_Oct_23_15-55-50.png)
![Screenshot_at_Oct_23_15-56-18](/uploads/423406dcff3d35e043ac72e7f19685d2/Screenshot_at_Oct_23_15-56-18.png)
![Screenshot_at_Oct_23_16-02-46](/uploads/0ebf937fcc0c611a14e9d21949e80aa8/Screenshot_at_Oct_23_16-02-46.png)
![Screenshot_at_Oct_23_16-03-32](/uploads/0fcf01217a893154862cffb618980fa0/Screenshot_at_Oct_23_16-03-32.png)
![Screenshot_at_Oct_23_16-12-00](/uploads/38b3e84087451e0a18dd480eed9bbb25/Screenshot_at_Oct_23_16-12-00.png)
![Screenshot_at_Oct_23_16-12-26](/uploads/f81e33ec3459fdb7def40bf96a1f9dc6/Screenshot_at_Oct_23_16-12-26.png)
![Screenshot_at_Oct_23_16-13-22](/uploads/846bb8aa435dc5a6c86599b0c98c238e/Screenshot_at_Oct_23_16-13-22.png)
![Screenshot_at_Oct_23_16-16-43](/uploads/ecb4fcbf7caca32f5690a8cca5206431/Screenshot_at_Oct_23_16-16-43.png)

> **| PASS |**

---

> **User without administrator or manager permission attempts to remove log priority but no action is executed due to lack of proper role**

![Screenshot_at_Oct_23_18-10-41](/uploads/cf36747e8b419d4f99e34341481da04d/Screenshot_at_Oct_23_18-10-41.png)

> **| PASS |**

---

> **Manager sets priority on log due to critical event, after situation resolution administrator removes priority flag**

![Screenshot_at_Oct_23_15-55-50](/uploads/be3d2a57e10870ed49f9de352f3a4bdf/Screenshot_at_Oct_23_15-55-50.png)
![Screenshot_at_Oct_23_15-56-18](/uploads/03a4d41dee5fe24097c7a790167bd7fe/Screenshot_at_Oct_23_15-56-18.png)
![Screenshot_at_Oct_23_16-02-46](/uploads/4e68c0797527c1571a1d1f16b8f1e538/Screenshot_at_Oct_23_16-02-46.png)
![Screenshot_at_Oct_23_16-03-32](/uploads/783aea9cb20e8919c2551dc55bb84876/Screenshot_at_Oct_23_16-03-32.png)

> **| PASS |**

---

> **Agents view priority activity logs displayed above non-priority ones in the list with priority indicator visible in the first table column**

![Screenshot_at_Oct_23_16-29-45](/uploads/9ea49388e981629dac7a20b0f48a5ce9/Screenshot_at_Oct_23_16-29-45.png)
![image](/uploads/a8207251e508f9e186af4f5a5f645242/image.png)

> **| PASS |**

---

> **System maintains priority and non-priority logs sorted by creation date within their respective priority groups**

![Screenshot_at_Oct_23_16-29-45](/uploads/6e0a703691cb3c84c800586b7d85c24d/Screenshot_at_Oct_23_16-29-45.png)

> **| PASS |**

---

> **System preserves sorting, filtering and pagination functionalities after priority feature implementation**

![Screenshot_at_Oct_23_16-33-24](/uploads/d45c93b84ed5cf05a0245031983b3170/Screenshot_at_Oct_23_16-33-24.png)
![Screenshot_at_Oct_23_16-33-50](/uploads/78e410ac3d5f33278c1ca75ccad6a084/Screenshot_at_Oct_23_16-33-50.png)
![Screenshot_at_Oct_23_16-34-19](/uploads/ba168df3f4c15229fec26a80e9ad01f0/Screenshot_at_Oct_23_16-34-19.png)
![Screenshot_at_Oct_23_16-34-33](/uploads/1b0b6fd6b89fa02e72a77c1f556e20a2/Screenshot_at_Oct_23_16-34-33.png)
![Screenshot_at_Oct_23_16-35-23](/uploads/e89f3d137481c59e8cb1b99372bd97fd/Screenshot_at_Oct_23_16-35-23.png)
![Screenshot_at_Oct_23_16-36-38](/uploads/23c7d23c1875ef41a1c2b079265d6ab5/Screenshot_at_Oct_23_16-36-38.png)
![Screenshot_at_Oct_23_16-37-12](/uploads/48ceed8229aae054b2eb3939414e8ce2/Screenshot_at_Oct_23_16-37-12.png)
![Screenshot_at_Oct_23_16-38-26](/uploads/e6e5c324bb2e08a550367bec3b2659c6/Screenshot_at_Oct_23_16-38-26.png)
![Screenshot_at_Oct_23_16-38-41](/uploads/8600a17b4cbf63d1bab8aafb1c44ba19/Screenshot_at_Oct_23_16-38-41.png)
![Screenshot_at_Oct_23_16-40-21](/uploads/cc34963bc580dbab9e054bcab40ba77c/Screenshot_at_Oct_23_16-40-21.png)
![Screenshot_at_Oct_23_16-41-10](/uploads/879b45f9802a334950490142478f5c7f/Screenshot_at_Oct_23_16-41-10.png)

> **| WIP |** @davi.artur.gow When priority is added or removed from a log, while viewing more than 10 results, upon reloading the screen 10 records are displayed instead of the number of records selected for display

---

> **System persists log priority state between different user sessions**

![Screenshot_at_Oct_23_16-42-29](/uploads/12b8aef73670ce6b8e55f1bb65a7a3f0/Screenshot_at_Oct_23_16-42-29.png)
![Screenshot_at_Oct_23_16-44-13](/uploads/2271375e14d9f540409e3d4400a0f490/Screenshot_at_Oct_23_16-44-13.png)
![Screenshot_at_Oct_23_16-52-47](/uploads/b8c8f129206785e37d6e02cdbeb8bd53/Screenshot_at_Oct_23_16-52-47.png)
![Screenshot_at_Oct_23_16-53-04](/uploads/1a8fff4f2e6eb2ade3a0e78078467383/Screenshot_at_Oct_23_16-53-04.png)
![Screenshot_at_Oct_23_16-54-09](/uploads/a9d335adac8faf8fda583e9302ebf129/Screenshot_at_Oct_23_16-54-09.png)

> **| PASS |**

---

> **User receives manager role and can set and remove priority on activity logs**

![Screenshot_at_Oct_23_16-57-40](/uploads/434a7d42d2e83a34efcd388ee0d4a68d/Screenshot_at_Oct_23_16-57-40.png)
![Screenshot_at_Oct_23_16-58-18](/uploads/22d2fd1c67f6ea9a3d0d112a06e8e434/Screenshot_at_Oct_23_16-58-18.png)
![Screenshot_at_Oct_23_16-59-07](/uploads/fb71b70c3dc5f73e23516b9411f5cca1/Screenshot_at_Oct_23_16-59-07.png)
![Screenshot_at_Oct_23_17-00-13](/uploads/7e9e3929b525ee6c28b4b5c5581fd625/Screenshot_at_Oct_23_17-00-13.png)

> **| PASS |**

---

> **Manager loses role and can no longer set or remove priority on logs but still views priority logs**

![Screenshot_at_Oct_23_17-00-40](/uploads/165770e469118f4f1e67ada3e604a609/Screenshot_at_Oct_23_17-00-40.png)
![Screenshot_at_Oct_23_17-01-01](/uploads/5788299992854fda934540494d0ffe71/Screenshot_at_Oct_23_17-01-01.png)
![Screenshot_at_Oct_23_17-02-52](/uploads/fd66b5ef94a81859d9c664ff40590b1f/Screenshot_at_Oct_23_17-02-52.png)

> **| PASS |**

---

> **Managers or administrators who do not have the toggle log priority [modify] permission cannot flag or remove priorities from logs**


![Screenshot_at_Oct_23_17-35-28](/uploads/421e0a3b02a30ebe251971f82a7c1e73/Screenshot_at_Oct_23_17-35-28.png)
![Screenshot_at_Oct_23_17-35-41](/uploads/3b10e6282cb95851c6a930fc9804fec0/Screenshot_at_Oct_23_17-35-41.png)
![Screenshot_at_Oct_23_17-36-04](/uploads/7b0311f522c81daa61ac9c7370ed7a76/Screenshot_at_Oct_23_17-36-04.png)
![Screenshot_at_Oct_23_17-45-17](/uploads/c6cb377c9110763bd87dd8f1f5ac7efe/Screenshot_at_Oct_23_17-45-17.png)
![Screenshot_at_Oct_23_17-48-59](/uploads/7f698d1106c166ecbddacb8d6438abc5/Screenshot_at_Oct_23_17-48-59.png)
![Screenshot_at_Oct_23_18-10-41](/uploads/30c1cf7325cb3a29752430ae9cd9f8b9/Screenshot_at_Oct_23_18-10-41.png)

> **| PASS |**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg


> **User without administrator or manager permission attempts to set log priority but no action is executed due to lack of proper role**

> 

> **| PASS |**

---

> **User without administrator or manager permission attempts to remove log priority but no action is executed due to lack of proper role**

> 

> **| PASS |**

---

> **Manager sets priority on log due to critical event, after situation resolution administrator removes priority flag**

> 

> **| PASS |**

---

> **Agents view priority activity logs displayed above non-priority ones in the list with priority indicator visible in the first table column**

> 

> **| PASS |**

---

> **System maintains priority and non-priority logs sorted by creation date within their respective priority groups**

> 

> **| PASS |**

---

> **System preserves sorting, filtering and pagination functionalities after priority feature implementation**


> 

> **| PASS |**

---

> **System persists log priority state between different user sessions**

> 

> **| PASS |**

---

> **User receives manager role and can set and remove priority on activity logs**

> 

> **| PASS |**

---

> **Manager loses role and can no longer set or remove priority on logs but still views priority logs**

> 

> **| PASS |**

---

> **Managers or administrators who do not have the toggle log priority [modify] permission cannot flag or remove priorities from logs**

> 

> **| PASS |**

---

> **Set or remove log priority via API**

> 

> **| PASS |**

---
