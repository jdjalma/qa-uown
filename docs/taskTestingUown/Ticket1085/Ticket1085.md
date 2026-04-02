--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1085

UOWN | Origination | Update LexisNexis Model Name & Refactor RunUwService

Synopsis
The current LexisNexis integration for fraud verification is using an outdated version of the API. A new version, 
Auto-Score 2.0, has been released and should be implemented to ensure compatibility and leverage improved scoring and fraud detection capabilities.

Business Objective
Update the fraud verification integration to use LexisNexis Auto-Score 2.0 to ensure the platform benefits from enhanced fraud detection, 
maintains vendor compatibility, and continues receiving support. This change will also improve performance and accuracy in fraud-related decisions during customer onboarding.

Feature Request | Business Requirements
    Review the existing implementation of the LexisNexis fraud check.
    Integrate the Auto-Score 2.0 API version as provided by LexisNexis documentation. (SOON)
    Ensure all new required fields, response structures, and changes in logic are handled properly.
    Maintain backward compatibility where necessary until the new version is fully deployed.
    Validate the integration in sandbox and staging environments.
    Run full end-to-end tests to confirm the fraud check functionality is working as expected.
    Ensure proper logging and error handling are in place.


Testing Steps
The recent changes impact the main Underwriting providers: LexisNexis, Seon, Neustar, and Sentilink.
You can enable them in the merchant settings using the following configurations:
Perform validation for each provider individually, as well as in combination, to ensure all functionalities work correctly without errors.
Confirm that, when the API returns DENIED, the application is also DENIED.

-----

UOWN | Origination | Atualizar o Nome do Modelo LexisNexis e Refatorar RunUwService
Sinopse
A integração atual do LexisNexis para verificação de fraude está utilizando uma versão desatualizada da API. Uma nova versão, Auto-Score 2.0, 
foi lançada e deve ser implementada para garantir compatibilidade e aproveitar as melhorias de pontuação e capacidades de detecção de fraude.


Objetivo de Negócio
Atualizar a integração de verificação de fraude para utilizar o LexisNexis Auto-Score 2.0, garantindo que a plataforma se beneficie de uma detecção de fraude aprimorada, mantenha compatibilidade com o fornecedor e continue recebendo suporte. Essa mudança também melhorará o desempenho e a precisão nas decisões relacionadas a fraude durante a entrada de novos clientes (onboarding).


Solicitação de Feature | Requisitos de Negócio
Revisar a implementação existente da verificação de fraude com LexisNexis.
Integrar a versão da API Auto-Score 2.0 conforme a documentação fornecida pela LexisNexis. (EM BREVE)
Garantir que todos os novos campos obrigatórios, estruturas de resposta e mudanças de lógica sejam tratados adequadamente.
Manter compatibilidade retroativa (backward compatibility), quando necessário, até que a nova versão esteja totalmente implantada.
Executar testes ponta a ponta completos para confirmar que a funcionalidade de verificação de fraude está funcionando conforme o esperado.
Assegurar que haja logging e tratamento de erros apropriados.


Passos de Teste
As mudanças recentes impactam os principais provedores de Underwriting: LexisNexis, Seon, Neustar e Sentilink.
Você pode habilitá-los nas configurações do merchant usando as seguintes configurações:
Realize validação para cada provedor individualmente, bem como em combinação, para garantir que todas as funcionalidades funcionem corretamente sem erros.
Confirme que, quando a API retornar DENIED, a aplicação também fique como DENIED.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

FraudIntel2.0_Auto_RequestExample
{
  "FraudIntelRequest": {
    "User": {
      "GLBPurpose": "5"
    },
    "Options": {
      "IncludeModels": {
        "ModelRequests": {
          "ModelRequest": [
            {
              "ModelName": "FIAN22408_0"
            }
          ]
        }
      }
    },
    "SearchBy": {
      "Name": {
        "First": "CHARLES",
        "Last": "BROWN"
      },
      "Address": {
        "StreetAddress1": "123 Main Street",
        "City": "Dallas",
        "State": "TX",
        "Zip5": "92071"
      },
      "DOB": {
        "Year": 1976,
        "Month": 3,
        "Day": 2
      },
      "SSN": "610010469",
      "Phone10": "9137099563",
      "IPAddress": "123456789",
      "Email": "Test@test.com",
      "Channel": "Mail",
      "OtherApplicationIdentifier3": "123"
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

FraudIntel2.0_Auto_ResponseExample
{
  "FraudIntelResponseEx": {
    "@xmlns": "http://webservices.seisint.com/WsIdentity",
    "response": {
      "Header": {
        "Status": 0,
        "TransactionId": "174278916S183049"
      },
      "Result": {
        "InputEcho": {
          "Name": {
            "First": "CHARLES",
            "Last": "BROWN"
          },
          "Address": {
            "StreetAddress1": "123 Main Street",
            "City": "Dallas",
            "State": "TX",
            "Zip5": "92071"
          },
          "DOB": {
            "Year": 1976,
            "Month": 3,
            "Day": 2
          },
          "SSN": "610010469",
          "Phone10": "9137099563",
          "IPAddress": "123456789",
          "Email": "Test@test.com",
          "Channel": "Mail",
          "OtherApplicationIdentifier3": "123",
          "ApplicationDateTime": {
            "Hour24": 0,
            "Minute": 0,
            "Second": 0
          }
        },
        "UniqueId": "8479513349",
        "Models": {
          "Model": [
            {
              "Name": "FraudIntelligenceFIAN22408_0",
              "Scores": {
                "Score": [
                  {
                    "Value": 578,
                    "WarningIndicators": {
                      "WarningIndicator": [
                        {
                          "WarningCode": "V1",
                          "Description": "Number of inquiries associated with identity"
                        },
                        {
                          "WarningCode": "U1",
                          "Description": "Number of unique Addresses associated with this identity"
                        },
                        {
                          "WarningCode": "V8",
                          "Description": "Number of inquiries with matching identity elements from input"
                        },
                        {
                          "WarningCode": "PH4",
                          "Description": "Input Phone is likely invalid, missing, or incomplete"
                        },
                        {
                          "WarningCode": "RA2",
                          "Description": "Number of household members on file for identity"
                        },
                        {
                          "WarningCode": "E5",
                          "Description": "Number of Email sources associated with this identity"
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

FraudIntelligence2.0_Auto_TestSeeds_07212025
Name_First	Name_Last	Zip5	SSN	Home_Phone	TransactionID	model1name	model1type	model1score	model1wc1	model1wc2	model1wc3	model1wc4	model1wc5	model1wc6
CHARLES	BROWN	92071	610010469	9137099563	S202401220946011	FIAN22408_0		578	V1	U1	V8	PH4	RA2	E5
WAYMOND	LENARD	95828	572871322	8723338906	S202401220946012	FIAN22408_0		528	RH3	A24	C1	U47	E3	C15
RAFAEL	MAHDEE	92503	552557634	3106123238	S202401220946013	FIAN22408_0		704	RH3	A24	C1	C27	C29	U47
CHRISTOPHER	ZANDERS	92505	625400968	4242063179	S202401220946014	FIAN22408_0		579	C1	V8	RA2	RA4	RH2	E3
DARIUS	ATTY	92509	608367495	2013449509	S202401220946015	FIAN22408_0		999	248	248	248	248	248	248
MARY	FREDERICK	92301	947726123	2404865635	S202401220946016	FIAN22408_0		665	V8	U47	V9	C1	PH4	C27
CARVEL	HERRMAN	92557	625033204	8708662825	S202401220946017	FIAN22408_0		659	V8	A24	PH4	C1	RA4	RA2
DONNA	LONG	87532	218191866	3137592084	S202401220946018	FIAN22408_0		465	V8	A24	C1	V2	RA1	U47
GENE	GARCIACORROCHA	93245	344641492	5419372661	S202401220946019	FIAN22408_0		608	V1	E2	L5	C1	RA2	C3
VANDER	BUILTE	93436	901011493	9015551321	S202401220946011	FIAN22408_0		703	L5	V1	V8	U1	C1	V9
SHOHIO	BECKAGREY	27310	901011483	9015551304	S202401220946011	FIAN22408_0		466	C18	C1	RA4	RA3	A22	C12
THOMAS	ROSENTHAL	60070	601269725	5088363674	S202401220946011	FIAN22408_0		593	V8	C20	C1	A24	C18	C19
LUIS	TWYMAN	72801	281642395	8163633753	S202401220946011	FIAN22408_0		758	C3	L4	L5	RH2	U17	V8
MYRA	ESKUCHEN	63130	249868687	8189171730	S202401220946011	FIAN22408_0		843	L5	RH2	U17	U47	RA4	C24
DOROTHY	WOODS	92116	149689732	8152121711	S202401220946011	FIAN22408_0		621	U1	V8	C1	V9	A24	A7
CHRISTINE	DALAMA	60431	133806892	8573838473	S202401220946011	FIAN22408_0		772	V8	V1	L5	C1	V9	C3
TAHJARAHA	HENDRY	38555	508805166	3612188998	S202401220946011	FIAN22408_0		675	V1	L5	U17	PH4	C1	E5
DONIELLE	ARCHER	92694	251591652	5083400166	S202401220946011	FIAN22408_0		423	C20	C1	E5	L3	C18	E1
WHITNEY	GONZALEZ	33142	266745670	3369894368	S202401220946011	FIAN22408_0		580	V8	U1	A24	C1	E3	PH4
KYLE	HOWARD	33815	437881205	9199230193	S202401220946012	FIAN22408_0		657	V8	A24	C3	V9	U24	C1
TEENA	SOLIS	61114	615429041	3233345665	S202401220946012	FIAN22408_0		424	C21	E5	U17	C1	C9	L3
STEVEN	KAUR	98930	293683085	7132941565	S202401220946012	FIAN22408_0		999	248	248	248	248	248	248
ROBERT	JOHNSON	29662	437470391	3612290038	S202401220946012	FIAN22408_0		578	V1	U1	V8	PH4	RA2	E5
NATALIE	MCKAMIE	75231	627054693	7087389228	S202401220946012	FIAN22408_0		528	RH3	A24	C1	U47	E3	C15
EDMUND	LUBKEMAN	24018	638648168	9529331690	S202401220946012	FIAN22408_0		704	RH3	A24	C1	C27	C29	U47
SCARLETTE	BROUSSARD	46142	396868613	6192243932	S202401220946012	FIAN22408_0		579	C1	V8	RA2	RA4	RH2	E3
CHRISTINE	ESPINOZA VALENZUELA	72756	476966372	3174304099	S202401220946012	FIAN22408_0		999	248	248	248	248	248	248
JASON	MCDONOUGH	98433	632222491	5868066177	S202401220946012	FIAN22408_0		665	V8	U47	V9	C1	PH4	C27
SHIRLEY	BELL	41139	245921401	2105456176	S202401220946012	FIAN22408_0		659	V8	A24	PH4	C1	RA4	RA2
SILVANO	RONARD	91902	465458872	5155542231	S202401220946013	FIAN22408_0		465	V8	A24	C1	V2	RA1	U47
FREDERICK	JONES	32601	234721071	5133404328	S202401220946013	FIAN22408_0		608	V1	E2	L5	C1	RA2	C3
LISA	COLOMBO	46225	419063167	8312617609	S202401220946013	FIAN22408_0		703	L5	V1	V8	U1	C1	V9
MICHAELANGELO	LAWSON	27892	593269774	3607362964	S202401220946013	FIAN22408_0		466	C18	C1	RA4	RA3	A22	C12
GEORGE	MILLAR	23324	415339691	5174026395	S202401220946013	FIAN22408_0		593	V8	C20	C1	A24	C18	C19
LAWRENCE	ARCHER	33025	380769413	2486728876	S202401220946013	FIAN22408_0		758	C3	L4	L5	RH2	U17	V8
JUSTIN	LEAMON	29040	199505555	7138685702	S202401220946013	FIAN22408_0		843	L5	RH2	U17	U47	RA4	C24
ESPERANZA	CODNER	86442	231844704	4437422602	S202401220946013	FIAN22408_0		621	U1	V8	C1	V9	A24	A7
MIKE	SAMORA	28698	405949911	2702250835	S202401220946013	FIAN22408_0		772	V8	V1	L5	C1	V9	C3
NANCY	FRANZONI	46342	317928252	8312100212	S202401220946013	FIAN22408_0		675	V1	L5	U17	PH4	C1	E5
SARAH	CORVEAU	20912	519049077	6782006531	S202401220946014	FIAN22408_0		423	C20	C1	E5	L3	C18	E1
LUIS	LOZANO	85009	362865406	7723322694	S202401220946014	FIAN22408_0		580	V8	U1	A24	C1	E3	PH4
LAUREL	MUNIZ	75082	253636826	3184121703	S202401220946014	FIAN22408_0		657	V8	A24	C3	V9	U24	C1
DONNA	THOMAS	37323	264632201	2093124539	S202401220946014	FIAN22408_0		424	C21	E5	U17	C1	C9	L3
ROSE	HULETT	93291	481062045	8597460172	S202401220946014	FIAN22408_0		999	248	248	248	248	248	248
GERARDO	SCHRAUDER	45150	337041667	9032929303	S202401220946014	FIAN22408_0		578	V1	U1	V8	PH4	RA2	E5
MIGUEL	KASINGER	60139	483061375	5177364291	S202401220946014	FIAN22408_0		528	RH3	A24	C1	U47	E3	C15
GWENDOLYN	LOPEZ	34688	477889340	4049636746	S202401220946014	FIAN22408_0		704	RH3	A24	C1	C27	C29	U47
BRETT	VANVALIN	45240	611514106	7606885926	S202401220946014	FIAN22408_0		579	C1	V8	RA2	RA4	RH2	E3
JOSEPH	HERNANDEZ GONZALEZ	90043	214179130	3188052387	S202401220946014	FIAN22408_0		999	248	248	248	248	248	248

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:
 src/main/java/com/uownleasing/svc/config/uw/SentilinkConfig.java 
+
4
−
4

Visualizado
@@ -65,16 +65,16 @@ public class SentilinkConfig {
        );
    }

    public String getProducts(String refMerchantCodeConfig) {
    public String getProducts() {
        return configurationManagement.getString(
            CONFIG_PATH + "sentilink.products" + refMerchantCodeConfig,
            CONFIG_PATH + "sentilink.products",
            "sentilink_synthetic_score,sentilink_id_theft_score"
        );
    }

    public String getItemsForScore(String refMerchantCodeConfig) {
    public String getItemsForScore() {
        return configurationManagement.getString(
            CONFIG_PATH + "sentilink.items.for.score" + refMerchantCodeConfig,
            CONFIG_PATH + "sentilink.items.for.score",
            "sentilink_id_theft_score,sentilink_abuse_score"
        );
    }
 src/main/java/com/uownleasing/svc/service/application/run/RunSentilinkService.java 
+
38
−
17

Visualizado
@@ -7,7 +7,6 @@ import com.uownleasing.uwengine.enumeration.UwEngineStep;
import com.uownleasing.uwengine.pojo.UwEngineRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.HashMap;
@@ -20,8 +19,13 @@ public class RunSentilinkService {

    private final SentilinkConfig sentilinkConfig;

    private static final String THEFT_SCORE = "sentilink_id_theft_score";
    private static final String ABUSE_SCORE = "sentilink_abuse_score";
    private static final String SYNTHETIC_SCORE = "sentilink_synthetic_score";

    public UwEngineStep configure(ApplicationRequest request, UwStepConfig step, UwEngineRequest uwEngineRequest) {
        if (request.getSkipSentilink() || !request.getMerchant().getMerchantInfo().getUseSentilink()) {
        if (Boolean.TRUE.equals(request.getSkipSentilink())
            || !Boolean.TRUE.equals(request.getMerchant().getMerchantInfo().getUseSentilink())) {
            log.info("[RunSentilinkService] Skipping Sentilink: skipSentilink={} useSentilink={}",
                request.getSkipSentilink(),
                request.getMerchant().getMerchantInfo().getUseSentilink());
@@ -31,30 +35,47 @@ public class RunSentilinkService {
        String refMerchantCodeConfig = "." + request.getMerchant().getMerchantInfo().getRefMerchantCode();
        log.info("[RunSentilinkService] Configuring Sentilink for merchantRef={}", refMerchantCodeConfig);

        String products = sentilinkConfig.getProducts(refMerchantCodeConfig);
        String itemsForScore = sentilinkConfig.getItemsForScore(refMerchantCodeConfig);
        String url = sentilinkConfig.getUrl();
        Map<String, Integer> thresholds = new HashMap<>();

        uwEngineRequest.setSentilinkProducts(products);
        uwEngineRequest.setSentilinkScores(itemsForScore);
        if (url.contains("/v2/")) {
            String products = sentilinkConfig.getProducts();
            uwEngineRequest.setSentilinkProducts(products);

        uwEngineRequest.setSentilinkUsername(sentilinkConfig.getUsername());
        uwEngineRequest.setSentilinkPassword(sentilinkConfig.getPassword());
        uwEngineRequest.setSentilinkUrl(sentilinkConfig.getUrl());
            addThresholdIfPresent(products, THEFT_SCORE, thresholds, sentilinkConfig.getTheftScoreThreshold(refMerchantCodeConfig));
            addThresholdIfPresent(products, SYNTHETIC_SCORE, thresholds, sentilinkConfig.getAbuseScoreThreshold(refMerchantCodeConfig));
        } else {
            String itemsForScore = sentilinkConfig.getItemsForScore();
            uwEngineRequest.setSentilinkScores(itemsForScore);

        Map<String, Integer> thresholds = new HashMap<>();
        if (itemsForScore.contains("sentilink_id_theft_score")) thresholds.put("sentilink_id_theft_score", sentilinkConfig.getTheftScoreThreshold(refMerchantCodeConfig));
        if (itemsForScore.contains("sentilink_abuse_score")) thresholds.put("sentilink_abuse_score", sentilinkConfig.getAbuseScoreThreshold(refMerchantCodeConfig));
        if (products.contains("sentilink_id_theft_score")) thresholds.put("sentilink_id_theft_score", sentilinkConfig.getTheftScoreThreshold(refMerchantCodeConfig));
        if (products.contains("sentilink_synthetic_score")) thresholds.put("sentilink_synthetic_score", sentilinkConfig.getAbuseScoreThreshold(refMerchantCodeConfig));
            addThresholdIfPresent(itemsForScore, THEFT_SCORE, thresholds, sentilinkConfig.getTheftScoreThreshold(refMerchantCodeConfig));
            addThresholdIfPresent(itemsForScore, ABUSE_SCORE, thresholds, sentilinkConfig.getAbuseScoreThreshold(refMerchantCodeConfig));
        }

        uwEngineRequest.setSentilinkThresholds(thresholds);
        uwEngineRequest.setSentilinkUsername(sentilinkConfig.getUsername());
        uwEngineRequest.setSentilinkPassword(sentilinkConfig.getPassword());
        uwEngineRequest.setSentilinkUrl(url);

        uwEngineRequest.setSentilinkReasonCodesToDeny(sentilinkConfig.getReasonCodesToDeny(refMerchantCodeConfig));
        uwEngineRequest.setSentilinkExtraData(sentilinkConfig.getExtraData());
        uwEngineRequest.setCheckOldSentilinkByAddress(sentilinkConfig.getCheckOldByAddress());
        uwEngineRequest.setCheckOldSentilinkWithinDays(
            step.getDaysLookForOld() == null ? sentilinkConfig.getCheckOldWithinDays() : step.getDaysLookForOld()
        );

        int daysToCheck = step.getDaysLookForOld() == null
            ? sentilinkConfig.getCheckOldWithinDays()
            : step.getDaysLookForOld();
        uwEngineRequest.setCheckOldSentilinkWithinDays(daysToCheck);

        log.info("[RunSentilinkService] Completed Sentilink configuration for merchantRef={} (url={})",
            refMerchantCodeConfig, url);

        return UwEngineStep.SENTILINK;
    }

    private void addThresholdIfPresent(String source, String scoreType, Map<String, Integer> thresholds, int thresholdValue) {
        if (source.contains(scoreType)) {
            thresholds.put(scoreType, thresholdValue);
            log.debug("[RunSentilinkService] Added {} threshold={}", scoreType, thresholdValue);
        }
    }
}


src/main/java/com/uownleasing/svc/config/uw/LexisNexisConfig.java  0 → 100644
+
64
−
0

Visualizado
package com.uownleasing.svc.config.uw;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class LexisNexisConfig {

    private final ConfigurationManagement configurationManagement;
    private static final String CONFIG_PATH = "com.uownleasing.svc.service.RunUWService.";

    public String getUsername() {
        return configurationManagement.getString(
            CONFIG_PATH + "lexis.nexis.username",
            "MOLXML", "MOLDEVXML"
        );
    }

    public String getPassword() {
        return configurationManagement.getString(
            CONFIG_PATH + "lexis.nexis.password",
            "MOvQA9v0q5Ck", "xO21POaHpoTW"
        );
    }

    public boolean checkExisting() {
        return configurationManagement.getBoolean(CONFIG_PATH + "lexis.nexis.check.existing", true);
    }

    public int checkExistingDays(int defaultDays) {
        return configurationManagement.getInteger(CONFIG_PATH + "lexis.nexis.check.for.days", defaultDays);
    }

    public String getUrl() {
        return configurationManagement.getString(
            CONFIG_PATH + "lexis.nexis.url",
            "https://wsonline.seisint.com/WsIdentity/FraudIntel?ver_=3.13",
            "https://wsonline.seisint.com/WsIdentity/FraudIntel?ver_=3.13"
        );
    }

    public String getModelName() {
        return configurationManagement.getString(CONFIG_PATH + "lexis.nexis.model.name", "FIAN22408_0");
    }

    public String getGlbPurpose() {
        return configurationManagement.getString(CONFIG_PATH + "lexis.nexis.glb.purpose", "5");
    }

    public String getChannel() {
        return configurationManagement.getString(CONFIG_PATH + "lexis.nexis.channel", "Mail");
    }

    public BigDecimal getScoreThreshold(String refMerchantCode) {
        return BigDecimal.valueOf(configurationManagement.getLong(
            CONFIG_PATH + "lexis.nexis.score.check.value." + refMerchantCode,
            720L, 720L
        ));
    }
}
 src/main/java/com/uownleasing/svc/config/uw/NeustarConfig.java  0 → 100644
+
203
−
0

Visualizado
package com.uownleasing.svc.config.uw;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class NeustarConfig {

    private final ConfigurationManagement configurationManagement;
    private static final String CONFIG_PATH = "com.uownleasing.svc.service.RunUWService.";

    //runUwEngine config

    public String getUsername() {
        return configurationManagement.getString(CONFIG_PATH + "neustar.username", "MollieRTProd", "Molliertdemo");
    }

    public String getPassword() {
        return configurationManagement.getString(CONFIG_PATH + "neustar.password", "7U48aRhY8hRUT6", "PU58sDWXkM4QcV");
    }

    public String getUrl() {
        return configurationManagement.getString(
            CONFIG_PATH + "neustar.url",
            "https://webgwy.Neustar.biz/api/identityRisk_fraudPrevention-v1",
            "https://webgwy.Neustar.biz/api/identityRisk_fraudPrevention-v1"
        );
    }

    public String getServiceId() {
        return configurationManagement.getString(CONFIG_PATH + "neustar.service.id", "7507102416", "7507102416");
    }

    public String getContextId() {
        return configurationManagement.getString(CONFIG_PATH + "neustar.context.id", "232043", "232044");
    }

    public List<String> getRequiredData() {
        return Arrays.asList(configurationManagement.getString(CONFIG_PATH + "neustar.required.data",
            "identityVerification,address,email,phone",
            "identityVerification,address,email,phone").split(","));
    }

    //setNeustar config

    public List<String> getItemsToVerify() {
        return Arrays.asList(configurationManagement.getString(
            CONFIG_PATH + "neustar.items.to.verify",
            "errorCode,verifiedComponents,serviceTenure,nameChange,numNameChange,validation,emailFound,uspsType,vacancy,prison",
            "errorCode,verifiedComponents,serviceTenure,nameChange,numNameChange,validation,emailFound,uspsType,vacancy,prison"
        ).split(","));
    }

    public List<String> getMoveSeonResultCode() {
        return Arrays.asList(configurationManagement.getString(CONFIG_PATH + "neustar.move.to.seon", "6").split(","));
    }

    public List<String> getNoErrorResultCode() {
        return Arrays.asList(configurationManagement.getString(CONFIG_PATH + "neustar.no.error.result.code", "0").split(","));
    }

    public Integer getMinValidVerifiedComponents() {
        return configurationManagement.getInteger(CONFIG_PATH + "neustar.min.valid.verified.components", 1);
    }

    public Integer getMaxValidVerifiedComponents() {
        return configurationManagement.getInteger(CONFIG_PATH + "neustar.max.valid.verified.components", 7);
    }

    public Integer getMinInvalidVerifiedComponents() {
        return configurationManagement.getInteger(CONFIG_PATH + "neustar.min.invalid.verified.components", 8);
    }

    public Integer getMaxInvalidVerifiedComponents() {
        return configurationManagement.getInteger(CONFIG_PATH + "neustar.max.invalid.verified.components", 8);
    }

    public List<Integer> getPhoneToNameDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.phone.to.name.decline.value", "-2"));
    }

    public List<Integer> getPhoneToFirstNameDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.phone.to.first.name.decline.value", "-2"));
    }

    public List<Integer> getAddressToPhoneDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.address.to.phone.decline.value", "-1,-2"));
    }

    public List<Integer> getEmailToPhoneDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.email.to.phone.decline.value", "-1"));
    }

    public List<Integer> getAddressToNameDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.address.to.name.decline.value", "-1"));
    }

    public List<Integer> getEmailToNameDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.email.to.name.decline.value", "-1"));
    }

    public List<Integer> getEmailToAddressDeclineValue() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.email.to.address.decline.value", "-1"));
    }

    public List<String> getPhonePrepaidDeclineValue() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.phone.prepaid.decline.value", "Y"));
    }

    public HashMap<Integer, List<Integer>> getVerCompPhoneSerTenDeclineMap() {
        String verifiedComponentForServiceTenure = configurationManagement.getString(CONFIG_PATH + "neustar.verified.component.for.service.tenure", "3,4,5,8");
        return Stream.of(verifiedComponentForServiceTenure.split(","))
            .collect(Collectors.toMap(Integer::parseInt,
                s -> Arrays.stream(configurationManagement.getString(
                            CONFIG_PATH + "neustar.phone.service.tenure.for.verified.component" + s,
                            "-1,-2,-3,-4,-5,-6,-7,1")
                        .split(","))
                    .map(Integer::parseInt)
                    .collect(Collectors.toList()),
                (oldValue, newValue) -> oldValue,
                HashMap::new));
    }

    public List<Integer> getUsage2monDeclineValues() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.usage.2.month.decline.values", "0"));
    }

    public List<Integer> getNameChangeTypeCheck() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.name.change.type.check", "-1,0,1"));
    }

    public List<Integer> getNameChangeDeclineValues() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.name.change.decline.values", "1,3,5,30"));
    }

    public List<Integer> getNumNameChangeDeclineValues() {
        return stringToIntegerList(configurationManagement.getString(CONFIG_PATH + "neustar.num.name.change.decline.values", "2,3"));
    }

    public List<String> getEmailValidationDeclineValues() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.email.validation.decline.values", "1,2"));
    }

    public List<String> getEmailFoundCheck() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.email.found.check", "1"));
    }

    public List<String> getEmailFirstActiveCheck() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.email.first.active.check", "0,1,2,3"));
    }

    public List<String> getEmailLastActiveCheck() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.email.last.active.check", "0,1,2,3"));
    }

    public List<String> getDpvConfirmAcceptableValues() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.dpv.confirm.acceptable.values", "Y,D,N"));
    }

    public List<String> getUspsTypeDeclineValue() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.usps.type.decline.value", "P"));
    }

    public List<String> getRbdiCheckDeclineValue() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.rbdi.check.decline.value", "B"));
    }

    public List<String> getVacancyDeclineValue() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.vacancy.decline.value", "V"));
    }

    public List<String> getPrisonDeclineValue() {
        return stringToStringList(configurationManagement.getString(CONFIG_PATH + "neustar.prison.decline.value", "Y"));
    }

    public Boolean getIsSearchWithAddress() {
        return configurationManagement.getBoolean(CONFIG_PATH + "neustar.is.search.with.address", false);
    }

    public Boolean getDenyOnNullPhoneUsage() {
        return configurationManagement.getBoolean(CONFIG_PATH + "neustar.deny.on.null.phone.usage", true);
    }

    public Integer getNumDaysToSearchOldData() {
        return configurationManagement.getInteger(CONFIG_PATH + "neustar.num.days.to.search.old.data", 30);
    }

    private List<Integer> stringToIntegerList(String value) {
        return Arrays.stream(value.split(",")).map(Integer::parseInt).collect(Collectors.toList());
    }

    private List<String> stringToStringList(String value) {
        return Arrays.asList(value.split(","));
    }
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos de teste


Segue a lista numerada dos requisitos de teste consolidados da tarefa, documentação e alterações de DEV.

Escopo e impacto
Provedores afetados: LexisNexis, Seon, Neustar e Sentilink.
Fluxo E2E de onboarding, decisão de fraude e regras de negação.

Regra global de decisão
Quando qualquer provedor retornar DENIED, a aplicação deve ficar DENIED.

Execução isolada e combinada
Validar cada provedor individualmente.
Validar combinações (2+ provedores ativos) sem conflitos ou erros.
LexisNexis – montagem do request (Auto-Score 2.0)

User.GLBPurpose conforme config (ex.: "5").
Options.IncludeModels.ModelRequests[].ModelName usando lexis.nexis.model.name (ex.: "FIAN22408_0").
SearchBy com: Name(First/Last), Address(Street/City/State/Zip5), DOB(Year/Month/Day), SSN (sem máscara), Phone10 (10 dígitos), IPAddress, Email, Channel (ex.: "Mail"), OtherApplicationIdentifier3.
Normalizações: SSN/Phone numéricos, Zip 5 dígitos, strings trimadas.
LexisNexis – parsing do response

Capturar Header.Status, Header.TransactionId, Result.UniqueId.
Ler Models[].Scores[].Value (score) e WarningIndicators[] (códigos/descrições).
Registrar nome do modelo retornado (ex.: “FraudIntelligenceFIAN22408_0”) para auditoria.

LexisNexis – regra de threshold/decisão
Usar lexis.nexis.score.check.value.<refMerchantCode>.
Casos de fronteira: score = threshold, threshold−1, threshold+1.
Decisão final deve refletir corretamente esses casos.

LexisNexis – compatibilidade e versão
Enquanto URL legado (.../FraudIntel?ver_=3.13) existir, garantir ausência de regressões.
Ao ativar 2.0, validar novas estruturas sem quebrar o legado.
LexisNexis – configurações (Configuration Management)
Carregar username, password, url, model.name, glb.purpose, channel de config (LexisNexisConfig.java).
Não logar segredos; PII mascarada em logs.

Sentilink – condições de execução
Pular passo quando skipSentilink=true ou useSentilink=false (null-safe) em RunSentilinkService.
Sentilink – branch por versão da URL
Se url.contains("/v2/"): preencher uwEngineRequest.sentilinkProducts via getProducts().
Se NÃO v2: preencher uwEngineRequest.sentilinkScores via getItemsForScore().

Sentilink – thresholds e mapeamentos
Incluir thresholds apenas quando o tipo estiver presente.
v2: THEFT_SCORE e SYNTHETIC_SCORE.
não v2: THEFT_SCORE e ABUSE_SCORE.
Validar coerência do mapeamento SYNTHETIC→threshold (atual aponta para abuse; confirmar intenção).

Sentilink – campos em uwEngineRequest
sentilinkProducts/sentilinkScores conforme branch.
username, password, url definidos.
reasonCodesToDeny, extraData, checkOldByAddress, checkOldWithinDays conforme config e UwStepConfig.

Sentilink – regressão de configuração
Métodos getProducts()/getItemsForScore() agora globais (sem sufixo por merchant).
Thresholds permanecem por merchant. Validar que o comportamento esperado se mantém.

Neustar – carregamento de configurações
username, password, url, serviceId, contextId.
Listas/limites: required.data, items.to.verify, no.error.result.code, move.to.seon, min/max verified components, usos/declines, flags (is.search.with.address, deny.on.null.phone.usage), janela num.days.to.search.old.data.
Conversões string→lista funcionando; defaults aplicados quando chaves ausentes.

Seon – validação funcional
Execução quando ativo, decisão DENIED reflete na aplicação.
Testar isolado e em conjunto com os demais provedores.

UI – configurações no Merchant
Habilitar/desabilitar provedores em Merchant Settings via UI.
Validar estados ON/OFF com verifyPanel + ValidationType.
Salvar e garantir persistência.

HAR/Network – validações
Usar ApiSteps para:
Ativar captura HAR, resetar captura.
Validar método+path+status 200.
Inspecionar JSON body com chaves obrigatórias por provedor (sem expor segredos).

Observabilidade, logging e erros
Logs devem registrar provedor, URL (sem segredos), thresholds, decisão e warning codes.
Tratamento de 4xx/5xx/timeouts consistente (sem travar fluxo).
PII mascarada (SSN/Phone/Email).

Dados de teste – seeds LexisNexis
Usar “FraudIntelligence2.0_Auto_TestSeeds_07212025”.
Verificar model1name (ex.: “FIAN22408_0”), model1score e warning codes (V1, U1, V8, PH4, etc.).
Exercitar casos abaixo/igual/acima do threshold configurado.

Performance e resiliência
Timeouts e retentativas adequados; não bloquear fila.
P95 de latência por provedor (definir alvo).
Degradação de um provedor não deve impactar indevidamente os demais.
Segurança e conformidade
TLS obrigatório; verificação de host.
Não logar credenciais; mascarar PII.
Configs via ConfigurationManagement sem hardcode em código-fonte.
Regressão – RunUwService e adjacências
Refatorações não alteram: ordem de passos, contrato interno de UwEngineRequest e integrações estáveis.
Null-safety adicionada em RunSentilinkService: cobrir flags nulas sem NPE.
Verificação via framework (reuso recomendado)
HAR/Network: ApiSteps.
UI: verifyPanel + ValidationType e métodos existentes em UownMerchantSteps.java/UownMerchantPage.java.
DB (se aplicável): DatabaseHelpers.
Tabelas/listas: validateColumnValues para refletir decisões/estados (quando exibidos em UI).


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



Segue o mapeamento direto Requisito → Elementos DOM → Steps reutilizáveis do framework (priorizando verifyPanel + ValidationType e ApiSteps).

Escopo e impacto
Elementos DOM
Toggles por provedor no Merchant Settings:
LexisNexis: input#checkbox-useLexisNexis
Neustar: input#checkbox-useNeustar
Sentilink: input#checkbox-useSentilink
Policy flags (SEON/validações auxiliares):
input#checkbox-isFraudCheckRequired
input#checkbox-verifyPhone
input#checkbox-verifyEmail
input#checkbox-verifyIp
Steps
Navigate to merchants page → Search merchant by code "" → Open first merchant search result
Then Merchant setting '' should be (true|false) [UownMerchantSteps.java; usa verifyPanel + ValidationType]
And I save merchant changes
Regra global de decisão (se qualquer provedor = DENIED → aplicação = DENIED)
Elementos DOM
Cabeçalho do Customer: campos “Status” e “Internal Status” (divs dentro de customer-summary_customerSummary__container__r9RbZ)
Logs do Customer: tabela role=table com colunas "Type", "Notes"
Steps
Acessar Customers: Given Create a new application..., Then Verify the new application..., Then Fill in the new application...
Validar Status via verifyPanel + ValidationType (page: customers)
Logs: expand/collapsar e filtrar com UownGenericLogSteps/LogHelper
Filtros:
input#notes
input#userId
react-select id="logTypes"
button[name='searchButton']
Execução isolada e combinada (habilitar 1 provedor; depois 2+)
Elementos DOM
Mesmos toggles do item 1
Steps
Habilitar/Desabilitar combinações com verifyPanel + ValidationType
Save merchant changes
Rodar aplicação (TV_UownNewApplication.feature) e validar rede/logs/decisão
LexisNexis – montagem do request (Auto-Score 2.0)
Elementos DOM (para disparar UW via aplicação)
Fluxo de nova aplicação:
Given Create a new application with merchant ""
Then Verify the new application through email
Then Fill in the new application information with state
Steps (HAR/ApiSteps)
Enable HAR content capture → Reset network capture
Network contains "POST" to path "" with status 200
Debug print last network request to path ""
Validar presença no body (XML/text):
GLBPurpose "5"
ModelName "FIAN22408_0"
SearchBy: Name/Address/DOB/SSN/Phone10/IP/Email/Channel/OtherApplicationIdentifier3
Observação: para XML, usar step de debug/contém texto (em vez de “JSON keys”)
LexisNexis – parsing do response
Elementos DOM (evidência na UI)
Logs do Customer:
Type="UNDERWRITING" ou "INTERNAL"
Notes: "Underwriting is run. Response Status is APPROVED" ou "DENIED"
Steps
Expand logs → filtrar por “UNDERWRITING”
Validar que Notes contém Status (APPROVED/DENIED) e, se aplicável, TransactionId/Warning Codes em logs ou debug de rede
LexisNexis – regra de threshold/decisão (fronteiras)
Elementos DOM
Logs: linhas “UW Status : ...”, “Underwriting is run. Response Status is ...”
Cabeçalho do Customer: “Status”
Steps
Rodar seeds (ex.: FraudIntelligence2.0_Auto_TestSeeds_07212025)
Validar decisão final na UI:
verifyPanel(Status == Approved/Denied)
Validar HAR/Logs para evidenciar score e coerência com threshold (sem expor segredos)
LexisNexis – compatibilidade e versão
Elementos DOM
Não há DOM específico; valida-se via HAR
Steps
Network contains "POST" to path "FraudIntel?ver_=3.13" (legado) OU novo endpoint 2.0
Garantir ausência de regressão: status 200 e request/response válidos
LexisNexis – configurações (ConfigurationManagement)
Elementos DOM
Não expõe segredos na UI
Steps
HAR/Debug para evidenciar ModelName/Channel/GLBPurpose presentes
Logs: verificar que credenciais/PII não aparecem (mascaradas)
Sentilink – condições de execução (skip / useSentilink)
Elementos DOM
input#checkbox-useSentilink
Steps
Then Merchant setting 'Use Sentilink' should be true/false
Validar via logs de serviço ou ausência de chamada em HAR quando skip=true/use=false
Sentilink – branch por versão da URL (v2 vs não v2)
Elementos DOM
N/A (via HAR)
Steps
Network contains "POST" to path "" (URL contém /v2/)
Caso não v2: validar chamada ao endpoint legado
Debug print last network request para confirmar products (v2) vs itemsForScore (não v2)
Sentilink – thresholds e mapeamentos
Elementos DOM
Resultado refletido em:
Logs do Customer (UNDERWRITING/INTERNAL)
Cabeçalho “Status”
Steps
Exercitar casos com tipos presentes/ausentes
Validar decisão final e presença de reason codes em logs quando aplicável
Sentilink – campos no uwEngineRequest
Elementos DOM
N/A (via HAR/Logs)
Steps
HAR/Debug:
v2 → sentilinkProducts
não v2 → sentilinkScores
Validar username/password/url definidos indiretamente (sem imprimir segredos)
Sentilink – regressão de configuração (getProducts/getItemsForScore globais)
Elementos DOM
input#checkbox-useSentilink
Steps
Executar com diferentes merchants e validar que thresholds por merchant continuam valendo (evidência: decisão em logs/Status)
Neustar – carregamento de configurações
Elementos DOM
input#checkbox-useNeustar
Steps
Then Merchant setting 'Use Neustar' should be true
HAR:
Network contains "POST" to path "" with status 200
Debug para amostras de campos esperados (required.data etc.) sem expor credenciais
Logs: ausência de erros de parsing/timeout
Seon – validação funcional
Elementos DOM
Policy flags (associadas a validações SEON):
input#checkbox-isFraudCheckRequired
input#checkbox-verifyPhone
input#checkbox-verifyEmail
input#checkbox-verifyIp
Steps
Then Merchant setting '' should be true/false
HAR: validar chamada Seon (se aplicável)
Regra global: se Seon retornar DENIED, Status na UI deve ser Denied
UI – configurações no Merchant (persistência)
Elementos DOM
Todos os checkboxes listados acima e input#checkbox-checkUwForVerification
Steps
Setar ON/OFF → I save merchant changes
Recarregar e reabrir merchant → validar com verifyPanel + ValidationType
HAR/Network – validações
Elementos DOM
Botão de busca de logs: button[name='searchButton'] (tela de Customers)
Steps (ApiSteps)
Enable HAR content capture → Reset network capture
Network contains "" to path "" with status 200
Network last request ... JSON body should contain keys "..." (para JSON)
Debug print last network request (XML/sem JSON)
Observabilidade, logging e erros
Elementos DOM
Logs: tabela role=table, colunas:
data-column-id="2" → Type
data-column-id="4" → Notes
Filtros: #notes, #userId, #logTypes (react-select), Search button[name='searchButton']
Steps
Expand logs (ícone chevron-down) → preencher filtros → Search
Validar presença de mensagens: “Underwriting is run...”, “Response Status is ...”, “UW Status : ...”
Garantir mascaramento de PII (não aparecendo em logs) e ausência de segredos
Dados de teste – seeds LexisNexis
Elementos DOM
Fluxo new application (sem DOM específico; usa formulário do onboarding)
Steps
Preencher dados conforme seeds → acionar UW
Validar Status/Logs conforme score (abaixo/igual/acima do threshold)
Performance e resiliência
Elementos DOM
N/A (observação indireta)
Steps
Given Timeout multiplier is set to: "2" (ou ajuste) para estabilidade
Verificar ausência de timeouts em HAR e logs
Segurança e conformidade
Elementos DOM
N/A
Steps
Inspecionar logs/HAR via ApiSteps (sem vazar segredos)
Confirmar uso de TLS via URL (https) no HAR
Regressão – RunUwService e adjacências
Elementos DOM
N/A
Steps
Executar UW com múltiplos provedores e validar ordem/contratos via HAR/Logs
Para Sentilink: observar logs “[RunSentilinkService] Skipping …” quando skip/use=false
Verificação via framework (reuso)
Elementos DOM
Merchant Settings: checkboxes (IDs acima)
Customers: filtros e tabela de logs; cabeçalho “Status”/“Internal Status”
Steps
UI: verifyPanel + ValidationType (UownMerchantSteps.java)
HAR: ApiSteps (Enable/Reset/Network contains/Debug print/JSON body keys)
Logs: UownGenericLogSteps + LogHelper (seletores estáveis em Elements.java)
Tabela/colunas: CommonHelpers.validateColumnValues quando necessário (ex.: Type/Notes)
Dicas rápidas para localizadores e ações

Priorize id:
useLexisNexis: By.id("checkbox-useLexisNexis")
useNeustar: By.id("checkbox-useNeustar")
useSentilink: By.id("checkbox-useSentilink")
isFraudCheckRequired: By.id("checkbox-isFraudCheckRequired")
verifyPhone: By.id("checkbox-verifyPhone")
verifyEmail: By.id("checkbox-verifyEmail")
verifyIp: By.id("checkbox-verifyIp")
checkUwForVerification: By.id("checkbox-checkUwForVerification")
Logs:
Notes: By.id("notes")
User ID: By.id("userId")
Log Activity (react-select): container id="logTypes" (usar ElementUtility.reactDropDown)
Search: By.name("searchButton")
Para tabela de logs:
Cabeçalhos: //div[@role='columnheader' and .//div[contains(.,'Type'|'Notes')]]
Células: //div[@role='rowgroup']//div[@role='row']//div[@role='cell' and @data-column-id='2'|'4']
Com este mapeamento, cada requisito tem seus elementos DOM e passos prontos para uso, mantendo reuso máximo do framework (verifyPanel + ValidationType, ApiSteps, LogHelper) e alinhado às convenções do projeto.

-----


Escopo e impacto
Elementos DOM
Toggles por provedor no Merchant Settings:
LexisNexis: input#checkbox-useLexisNexis
Neustar: input#checkbox-useNeustar
Sentilink: input#checkbox-useSentilink
Policy flags (SEON/validações auxiliares):
input#checkbox-isFraudCheckRequired
input#checkbox-verifyPhone
input#checkbox-verifyEmail
input#checkbox-verifyIp

Steps
Navigate to merchants page → Search merchant by code "" → Open first merchant search result
Then Merchant setting '' should be (true|false) [UownMerchantSteps.java; usa verifyPanel + ValidationType]
And I save merchant changes
Regra global de decisão (se qualquer provedor = DENIED → aplicação = DENIED)
Elementos DOM
Cabeçalho do Customer: campos “Status” e “Internal Status” (divs dentro de customer-summary_customerSummary__container__r9RbZ)
Logs do Customer: tabela role=table com colunas "Type", "Notes"
Steps
Acessar Customers: Given Create a new application..., Then Verify the new application..., Then Fill in the new application...
Validar Status via verifyPanel + ValidationType (page: customers)
Logs: expand/collapsar e filtrar com UownGenericLogSteps/LogHelper
Filtros:
input#notes
input#userId
react-select id="logTypes"
button[name='searchButton']
Execução isolada e combinada (habilitar 1 provedor; depois 2+)
Elementos DOM
Mesmos toggles do item 1
Steps
Habilitar/Desabilitar combinações com verifyPanel + ValidationType
Save merchant changes
Rodar aplicação (TV_UownNewApplication.feature) e validar rede/logs/decisão
LexisNexis – montagem do request (Auto-Score 2.0)
Elementos DOM (para disparar UW via aplicação)
Fluxo de nova aplicação:
Given Create a new application with merchant ""
Then Verify the new application through email
Then Fill in the new application information with state
Steps (HAR/ApiSteps)
Enable HAR content capture → Reset network capture
Network contains "POST" to path "" with status 200
Debug print last network request to path ""
Validar presença no body (XML/text):
GLBPurpose "5"
ModelName "FIAN22408_0"
SearchBy: Name/Address/DOB/SSN/Phone10/IP/Email/Channel/OtherApplicationIdentifier3
Observação: para XML, usar step de debug/contém texto (em vez de “JSON keys”)
LexisNexis – parsing do response
Elementos DOM (evidência na UI)
Logs do Customer:
Type="UNDERWRITING" ou "INTERNAL"
Notes: "Underwriting is run. Response Status is APPROVED" ou "DENIED"
Steps
Expand logs → filtrar por “UNDERWRITING”
Validar que Notes contém Status (APPROVED/DENIED) e, se aplicável, TransactionId/Warning Codes em logs ou debug de rede
LexisNexis – regra de threshold/decisão (fronteiras)
Elementos DOM
Logs: linhas “UW Status : ...”, “Underwriting is run. Response Status is ...”
Cabeçalho do Customer: “Status”
Steps
Rodar seeds (ex.: FraudIntelligence2.0_Auto_TestSeeds_07212025)
Validar decisão final na UI:
verifyPanel(Status == Approved/Denied)
Validar HAR/Logs para evidenciar score e coerência com threshold (sem expor segredos)
LexisNexis – compatibilidade e versão
Elementos DOM
Não há DOM específico; valida-se via HAR
Steps
Network contains "POST" to path "FraudIntel?ver_=3.13" (legado) OU novo endpoint 2.0
Garantir ausência de regressão: status 200 e request/response válidos
LexisNexis – configurações (ConfigurationManagement)
Elementos DOM
Não expõe segredos na UI
Steps
HAR/Debug para evidenciar ModelName/Channel/GLBPurpose presentes
Logs: verificar que credenciais/PII não aparecem (mascaradas)
Sentilink – condições de execução (skip / useSentilink)
Elementos DOM
input#checkbox-useSentilink
Steps
Then Merchant setting 'Use Sentilink' should be true/false
Validar via logs de serviço ou ausência de chamada em HAR quando skip=true/use=false
Sentilink – branch por versão da URL (v2 vs não v2)
Elementos DOM
N/A (via HAR)
Steps
Network contains "POST" to path "" (URL contém /v2/)
Caso não v2: validar chamada ao endpoint legado
Debug print last network request para confirmar products (v2) vs itemsForScore (não v2)
Sentilink – thresholds e mapeamentos
Elementos DOM
Resultado refletido em:
Logs do Customer (UNDERWRITING/INTERNAL)
Cabeçalho “Status”
Steps
Exercitar casos com tipos presentes/ausentes
Validar decisão final e presença de reason codes em logs quando aplicável
Sentilink – campos no uwEngineRequest
Elementos DOM
N/A (via HAR/Logs)
Steps
HAR/Debug:
v2 → sentilinkProducts
não v2 → sentilinkScores
Validar username/password/url definidos indiretamente (sem imprimir segredos)
Sentilink – regressão de configuração (getProducts/getItemsForScore globais)
Elementos DOM
input#checkbox-useSentilink
Steps
Executar com diferentes merchants e validar que thresholds por merchant continuam valendo (evidência: decisão em logs/Status)
Neustar – carregamento de configurações
Elementos DOM
input#checkbox-useNeustar
Steps
Then Merchant setting 'Use Neustar' should be true
HAR:
Network contains "POST" to path "" with status 200
Debug para amostras de campos esperados (required.data etc.) sem expor credenciais
Logs: ausência de erros de parsing/timeout
Seon – validação funcional
Elementos DOM
Policy flags (associadas a validações SEON):
input#checkbox-isFraudCheckRequired
input#checkbox-verifyPhone
input#checkbox-verifyEmail
input#checkbox-verifyIp
Steps
Then Merchant setting '' should be true/false
HAR: validar chamada Seon (se aplicável)
Regra global: se Seon retornar DENIED, Status na UI deve ser Denied
UI – configurações no Merchant (persistência)
Elementos DOM
Todos os checkboxes listados acima e input#checkbox-checkUwForVerification
Steps
Setar ON/OFF → I save merchant changes
Recarregar e reabrir merchant → validar com verifyPanel + ValidationType
HAR/Network – validações
Elementos DOM
Botão de busca de logs: button[name='searchButton'] (tela de Customers)
Steps (ApiSteps)
Enable HAR content capture → Reset network capture
Network contains "" to path "" with status 200
Network last request ... JSON body should contain keys "..." (para JSON)
Debug print last network request (XML/sem JSON)
Observabilidade, logging e erros
Elementos DOM
Logs: tabela role=table, colunas:
data-column-id="2" → Type
data-column-id="4" → Notes
Filtros: #notes, #userId, #logTypes (react-select), Search button[name='searchButton']
Steps
Expand logs (ícone chevron-down) → preencher filtros → Search
Validar presença de mensagens: “Underwriting is run...”, “Response Status is ...”, “UW Status : ...”
Garantir mascaramento de PII (não aparecendo em logs) e ausência de segredos
Dados de teste – seeds LexisNexis
Elementos DOM
Fluxo new application (sem DOM específico; usa formulário do onboarding)
Steps
Preencher dados conforme seeds → acionar UW
Validar Status/Logs conforme score (abaixo/igual/acima do threshold)
Performance e resiliência
Elementos DOM
N/A (observação indireta)
Steps
Given Timeout multiplier is set to: "2" (ou ajuste) para estabilidade
Verificar ausência de timeouts em HAR e logs
Segurança e conformidade
Elementos DOM
N/A
Steps
Inspecionar logs/HAR via ApiSteps (sem vazar segredos)
Confirmar uso de TLS via URL (https) no HAR
Regressão – RunUwService e adjacências
Elementos DOM
N/A
Steps
Executar UW com múltiplos provedores e validar ordem/contratos via HAR/Logs
Para Sentilink: observar logs “[RunSentilinkService] Skipping …” quando skip/use=false
Verificação via framework (reuso)
Elementos DOM
Merchant Settings: checkboxes (IDs acima)
Customers: filtros e tabela de logs; cabeçalho “Status”/“Internal Status”
Steps
UI: verifyPanel + ValidationType (UownMerchantSteps.java)
HAR: ApiSteps (Enable/Reset/Network contains/Debug print/JSON body keys)
Logs: UownGenericLogSteps + LogHelper (seletores estáveis em Elements.java)
Tabela/colunas: CommonHelpers.validateColumnValues quando necessário (ex.: Type/Notes)
Dicas rápidas para localizadores e ações

Priorize id:
useLexisNexis: By.id("checkbox-useLexisNexis")
useNeustar: By.id("checkbox-useNeustar")
useSentilink: By.id("checkbox-useSentilink")
isFraudCheckRequired: By.id("checkbox-isFraudCheckRequired")
verifyPhone: By.id("checkbox-verifyPhone")
verifyEmail: By.id("checkbox-verifyEmail")
verifyIp: By.id("checkbox-verifyIp")
checkUwForVerification: By.id("checkbox-checkUwForVerification")
Logs:
Notes: By.id("notes")
User ID: By.id("userId")
Log Activity (react-select): container id="logTypes" (usar ElementUtility.reactDropDown)
Search: By.name("searchButton")
Para tabela de logs:
Cabeçalhos: //div[@role='columnheader' and .//div[contains(.,'Type'|'Notes')]]
Células: //div[@role='rowgroup']//div[@role='row']//div[@role='cell' and @data-column-id='2'|'4']
Com este mapeamento, cada requisito tem seus elementos DOM e passos prontos para uso, mantendo reuso máximo do framework (verifyPanel + ValidationType, ApiSteps, LogHelper) e alinhado às convenções do projeto.

-----

Abaixo relaciono cada item do mapeamento aos steps que já existem no projeto e, em seguida, 
o “schema” (esqueleto) do fluxo E2E proposto, pronto para reutilizar os steps atuais. Mantive o reuso de ApiSteps e verifyPanel + ValidationType, conforme suas preferências.

Mapeamento Requisito → Steps existentes → Elementos/Observações

Escopo e impacto (habilitar provedores no Merchant)
Steps
Given Navigate to merchants page
When Search merchant by code ""
And Open first merchant search result
Then Merchant setting '' should be (true|false) (UownMerchantSteps.java – usa verifyPanel + ValidationType)
And I save merchant changes
Elementos
LexisNexis: input#checkbox-useLexisNexis
Neustar: input#checkbox-useNeustar
Sentilink: input#checkbox-useSentilink
Políticas: input#checkbox-isFraudCheckRequired, #checkbox-verifyPhone, #checkbox-verifyEmail, #checkbox-verifyIp
Regra global de decisão (DENIED → aplicação DENIED)
Steps
Given Create a new application with merchant ""
Then Verify the new application through email
Then Fill in the new application information with state
[Validação UI]
Cabeçalho do Customer: validar “Status” e “Internal Status”
Logs do Customer: usar passos de log (UownGenericLogSteps/LogHelper) para filtrar e confirmar “Underwriting is run. Response Status is DENIED”
Elementos
Cabeçalho: container customer-summary_customerSummary__container__... (campos “Status”, “Internal Status”)
Logs: filtros #notes, #userId, react-select #logTypes, botão Search button[name='searchButton'], tabela role=table (colunas Type/Notes)
Execução isolada e combinada (1 provedor e 2+ provedores)
Steps
Alternar toggles (item 1) → And I save merchant changes
E2E de aplicação (item 2)
HAR para cada provedor (item 5/7/10/14)
Elementos
Mesmos checkboxes+HAR
LexisNexis – montagem do request (Auto-Score 2.0)
Steps (rede/HAR – ApiSteps)
Given Enable HAR content capture
And Reset network capture
[Acionar UW pelo fluxo da aplicação]
Then Network contains "POST" to path "" with status 200
And Debug print last network request to path ""
And Network last request to path "" JSON body should contain keys "..." (se a resposta for XML, usar apenas o Debug/contains text)
Observações
Validar no payload GLBPurpose (“5”), ModelName (“FIAN22408_0”), SearchBy (Name/Address/DOB/SSN/Phone10/IP/Email/Channel/OtherApplicationIdentifier3)
LexisNexis – parsing do response
Steps
Logs (UownGenericLogSteps/LogHelper): filtrar por Type=UNDERWRITING e verificar Notes “Underwriting is run. Response Status is APPROVED/DENIED”
Opcional: validar presença de TransactionId/Warning codes no texto de logs (quando disponível)
Elementos
Tabela de logs (Type/Notes)
LexisNexis – regra de threshold/decisão (fronteiras)
Steps
Rodar seeds (dados de teste fornecidos)
Validar decisão via:
Cabeçalho “Status” (verifyPanel + ValidationType) ou
Logs com Status final
Observações
Exercitar score = threshold−1, = threshold, = threshold+1
LexisNexis – compatibilidade e versão
Steps
HAR: validar path legado “…/FraudIntel?ver_=3.13” (status 200)
Quando 2.0 ativo: validar path novo (status 200)
Observações
Sem DOM específico; evidência por HAR/Logs
LexisNexis – configurações (ConfigurationManagement)
Steps
HAR/Debug print para observar ModelName/Channel/GLBPurpose (sem vazar segredos)
Logs sempre sem PII/credenciais (política)
Observações
Não imprimir username/password em lugar algum
Sentilink – condições de execução (skip/use=false)
Steps
Then Merchant setting 'Use Sentilink' should be (true|false)
HAR: ausência de chamadas quando skip=true/use=false (após acionar UW)
Observações
Null-safe já implementado no serviço (RunSentilinkService)
Sentilink – branch por versão da URL (v2 vs não v2)
Steps
HAR: verificar se URL contém “/v2/” → products (v2) vs itemsForScore (não v2) via Debug/validações de corpo
Then Network contains "POST" to path "" with status 200
Observações
Não expor segredos
Sentilink – thresholds e mapeamentos
Steps
Exercitar presença/ausência de THEFT/ABUSE/SYNTHETIC e validar decisão final (logs/cabeçalho)
Observações
Confirmar coerência SYNTHETIC→threshold (anotado no diff)
Sentilink – campos em uwEngineRequest
Steps
HAR/Debug last request → conferir products/scores conforme branch
Observações
Username/password/url apenas verificação indireta (sem print)
Sentilink – regressão de configuração (getProducts/getItemsForScore globais)
Steps
Repetir com merchants distintos e confirmar mesma lógica de thresholds por merchant (decisão final coerente)
Observações
Evidência em logs/Status
Neustar – carregamento de configurações
Steps
Then Merchant setting 'Use Neustar' should be true
HAR: Then Network contains "POST" to path "" with status 200
Debug/keys para required.data e itens principais (sem expor segredos)
Elementos
input#checkbox-useNeustar
Seon – validação funcional
Steps
Then Merchant setting '' should be (true|false) para: isFraudCheckRequired/verifyPhone/verifyEmail/verifyIp
HAR: chamada Seon quando ativo
Regra global: se DENIED, então aplicação DENIED
Elementos
Políticas: checkboxes (ids listados)
UI – persistência de configurações do Merchant
Steps
Alternar → And I save merchant changes
Reabrir o merchant → Then Merchant setting '' should be (true|false)
Observações
Pode validar combos de provedores
HAR/Network – validações genéricas (ApiSteps)
Steps
Enable HAR content capture
Reset network capture
Network contains "" to path "" with status 200
Network last request to path "" JSON body should contain keys "..."
Debug print last network request to path ""
Observabilidade, logging e erros
Steps (logs de Customer)
Expandir/colapsar seção (ícone chevron-down)
Preencher filtros (#notes, #userId, #logTypes) e clicar Search (button[name='searchButton'])
Validar mensagens: “Underwriting is run…”, “Response Status is …”, “UW Status : …”
Elementos
Filtros de log e tabela (colunas Type/Notes)
Dados de teste – seeds LexisNexis
Steps
Executar fluxo de nova aplicação com os seeds
Validar decisão via Status/Logs e coerência com threshold
Performance e resiliência
Steps
Given Timeout multiplier is set to: "2" (ou maior)
Validar ausência de timeouts e retentativas excessivas
Observações
Métricas P95 analisadas externamente
Segurança e conformidade
Steps
Verificações por HAR/Logs sem vazar PII/segredos
Observações
URLs https (TLS)
Regressão – RunUwService e adjacências
Steps
Fluxo com múltiplos provedores habilitados; validar ordem, contratos e decisões em HAR/Logs
Observações
Para Sentilink skip/use=false: observar log de “Skipping Sentilink…”
Verificação via framework (reuso)
Steps
UI: verifyPanel + ValidationType; Merchant setting '' should be (true|false)
HAR: todos os passos de ApiSteps listados no item 17
Logs (UI): UownGenericLogSteps/LogHelper (expand/collapse, filtros e search)
Tabelas: CommonHelpers.validateColumnValues (quando necessário)
Schema do Fluxo (esqueleto BDD reutilizando steps existentes)

Observação: este é um esqueleto de alto nível, separando cenários isolados por provedor e um cenário combinado. Use Cucumber Expressions puras e capitalize a primeira letra.

Setup comum

Given I set the environment to "", project to "uown", subdomain to "origination", navigate to login
And I set the browser to "", stealth mode if the following argument is yes: "yes"
Given Timeout multiplier is set to: "2"
When Log in to origination
Given Navigate to merchants page
When Search merchant by code ""
And Open first merchant search result
Cenário A – LexisNexis isolado (legado/2.0)

Then Merchant setting 'Use LexisNexis' should be true
And I save merchant changes
Given Enable HAR content capture
And Reset network capture
Given Create a new application with merchant ""
Then Verify the new application through email
Then Fill in the new application information with state
Then Network contains "POST" to path "" with status 200
And Debug print last network request to path ""
[Opcional JSON keys se aplicável] And Network last request to path "" JSON body should contain keys "GLBPurpose, ModelName"
[Validação de decisão]
Acessar página Customers do lead recém-criado (step já existente na suite de aplicação)
Expand logs → filtrar por Type=UNDERWRITING → validar “Response Status is APPROVED|DENIED”
Validar cabeçalho “Status” (verifyPanel + ValidationType) se disponível
Cenário B – Sentilink isolado (v2 e não v2)

Then Merchant setting 'Use Sentilink' should be true
And I save merchant changes
Given Enable HAR content capture
And Reset network capture
[Acionar UW pelo mesmo fluxo de aplicação]
Then Network contains "POST" to path "" with status 200
And Debug print last network request to path ""
[Branch]
v2: validar indicadores de products
não v2: validar indicadores de itemsForScore
[Decisão]
Logs: “UW Status : …” e Status do cabeçalho
Cenário C – Neustar isolado

Then Merchant setting 'Use Neustar' should be true
And I save merchant changes
Given Enable HAR content capture
And Reset network capture
[Acionar UW]
Then Network contains "POST" to path "" with status 200
And Debug print last network request to path ""
[Decisão] Logs/Status
Cenário D – Seon isolado

Then Merchant setting 'Is Fraud Check Required' should be true
Then Merchant setting 'Verify Phone' should be true
Then Merchant setting 'Verify Email' should be true
Then Merchant setting 'Verify IP' should be true
And I save merchant changes
Given Enable HAR content capture
And Reset network capture
[Acionar UW]
[HAR] validar chamada Seon (se aplicável no ambiente)
[Decisão] Logs/Status – se DENIED, aplicação DENIED
Cenário E – Combinado (LexisNexis + Sentilink, por exemplo)

Then Merchant setting 'Use LexisNexis' should be true
Then Merchant setting 'Use Sentilink' should be true
And I save merchant changes
Given Enable HAR content capture
And Reset network capture
[Acionar UW]
Then Network contains "POST" to path "" with status 200
And Network contains "POST" to path "" with status 200
[Regra global] Se qualquer provedor retornar DENIED → validar Status = Denied
Cenário F – Fronteiras LexisNexis (threshold−1, =, +1)

[Repetir Cenário A com diferentes seeds]
Validar decisão final vs threshold configurado, evidenciando em Logs/Status
Notas finais de implementação

Use verifyPanel + ValidationType sempre que a validação for de campo/estado em UI (conforme sua preferência).
Use ApiSteps para toda validação de HAR (método + path + status + body keys/Debug).
Filtros e tabela de logs: reusar UownGenericLogSteps + LogHelper (seletores: #notes, #userId, #logTypes, button[name='searchButton']; colunas Type/Notes).
Evite expor credenciais/PII nos logs de teste; “prints” sempre em inglês, sem segredos.
Para react-select (Log Activity), use ElementUtility.reactDropDown(...).
Se quiser, eu converto este schema em um arquivo 
.feature
 base (template) com Scenario Outlines e Examples para <env>, <browser>, <merchantCode>, <state> e <lexisEndpoint>/<sentilinkEndpoint>/<neustarEndpoint>, mantendo reuso total dos seus steps atuais.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

> ```gherkin
> ### Scenario Outline: Update LexisNexis Model Name & Refactor RunUwService in "<env>"
> When Log in to origination
> And Navigate to merchants page
> When Search merchant by code "<Merchant Code>"
> And Open first merchant search result
> And Fill fields for merchant:
> | Field                          | Value |
> | checkbox-isFraudCheckRequired  | true  |
> | checkbox-verifyPhone           | true  |
> | checkbox-verifyEmail           | true  |
> | checkbox-verifyIp              | true  |
> | checkbox-useNeustar            | true  |
> | checkbox-useSentilink          | true  |
> | checkbox-useLexisNexis         | true  |
> | checkbox-isSeonIdCheckRequired | true  |
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-isFraudCheckRequired" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-verifyPhone" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-verifyEmail" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-verifyIp" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-useNeustar" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-useSentilink" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-useLexisNexis" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> Then Validate on portal "ORIGINATION" page "current" using selector method "id" and selector "checkbox-isSeonIdCheckRequired" with validation "BOOLEAN_EQUALS" equals "true" within 10 seconds
> And I save the merchant
> When Search merchant by code "<Merchant Code>"
> And Open first merchant search result
> When Search logs by notes "UPDATED: MERCHANT" userId "manager" type "MERCHANT_DATA_CHANGE"
> Then Should see log of type "MERCHANT_DATA_CHANGE" containing "UPDATED:" in notes
> Then In database, merchant "<Merchant Code>" has SEON flags
> 

R7.25.1.44.0_UpdateLexisNexisModelNameAndRefactorRunUwService_Ticket1085
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------






> ## Tests in -

> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>