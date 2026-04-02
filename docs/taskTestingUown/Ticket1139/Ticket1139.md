-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1139


UOWN | SVC | Implement Unit Tests for TaxCloud API Integration


Synopsis
The TaxCloud API has been recently integrated into the system to handle tax rate lookups. To guarantee reliability and maintainability,
a comprehensive set of unit tests must be created to validate the integration logic and its expected behaviors.


Business Objective
Adding dedicated unit tests improves system stability, reduces regression risk, and ensures the TaxCloud integration consistently provides correct results under different scenarios.


Feature Request | Business Requirements
Create Unit Tests covering all critical parts of the TaxCloud integration.


Testing Steps
Rerun the build-release in the pipeline for the release branch, and confirm that the tests were run successfully:

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Sinopse
A API TaxCloud foi recentemente integrada ao sistema para lidar com consultas de alíquotas de impostos. Para garantir confiabilidade e manutenibilidade,
um conjunto abrangente de testes unitários deve ser criado para validar a lógica de integração e seus comportamentos esperados.

Objetivo de Negócio
Adicionar testes unitários dedicados melhora a estabilidade do sistema, reduz o risco de regressão e garante que a integração TaxCloud forneça consistentemente resultados corretos em diferentes cenários.

Solicitação de Funcionalidade | Requisitos de Negócio
Criar Testes Unitários cobrindo todas as partes críticas da integração TaxCloud.

Passos de Teste
Reexecutar o build-release no pipeline para a branch de release e confirmar que os testes foram executados com sucesso:

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 8 arquivos
+
2192
−
0
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

src/test/java/com/uownl
‎easing/taxcloud/service‎

exte
‎rnal‎

TaxCloudCli
‎entTest.java‎
+529 -0

TaxJarClie
‎ntTest.java‎
+311 -0

CartsServi
‎ceTest.java‎
+268 -0

OrdersServi
‎ceTest.java‎
+304 -0

RefundsServ
‎iceTest.java‎
+234 -0

TaxJarRateSer
‎viceTest.java‎
+267 -0

VerifyAddressS
‎erviceTest.java‎
+278 -0

build.
‎gradle‎
+1 -0

 src/test/java/com/uownleasing/taxcloud/service/external/TaxCloudClientTest.java  0 → 100644
+
529
−
0

Visualizado
package com.uownleasing.taxcloud.service.external;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uownleasing.taxcloud.config.TaxCloudOutboundCall;
import com.uownleasing.taxcloud.exception.TaxCloudException;
import com.uownleasing.taxcloud.pojo.config.TaxCloudDefaults;
import com.uownleasing.taxcloud.pojo.requests.CartsRequest;
import com.uownleasing.taxcloud.pojo.requests.OrdersRequest;
import com.uownleasing.taxcloud.pojo.requests.VerifyAddressRequest;
import com.uownleasing.taxcloud.pojo.requests.objects.Items;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxCloudClientTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TaxCloudOutboundCall taxCloudOutboundCall;

    @InjectMocks
    private TaxCloudClient taxCloudClient;

    private TaxCloudDefaults config;

    @BeforeEach
    void setUp() {
        config = new TaxCloudDefaults();
        config.setApiKey("test-api-key");
        config.setCartsUrl("https://api.taxcloud.com/carts");
        config.setOrdersUrl("https://api.taxcloud.com/orders");
        config.setOrdersRefundUrl("https://api.taxcloud.com/refunds/");
        config.setVerifyAddressUrl("https://api.taxcloud.com/verify");
    }

    @Test
    void testPostCartsRequest_Success() throws Exception {
        // Arrange
        CartsRequest request = new CartsRequest();
        request.setItems(new ArrayList<>());
        Items item = new Items();
        item.setCustomerId("123");
        request.getItems().add(item);

        String requestJson = "{\"items\":[{\"customerId\":\"123\"}]}";
        String responseJson = "{\"status\":\"success\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                eq(config.getCartsUrl()),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(responseJson));

        // Act
        String result = taxCloudClient.postCartsRequest(request, config);

        // Assert
        assertNotNull(result);
        assertEquals(responseJson, result);

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(taxCloudOutboundCall).makeRestCall(
                eq(config.getCartsUrl()),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<String> capturedEntity = entityCaptor.getValue();
        assertEquals(requestJson, capturedEntity.getBody());
        assertEquals(MediaType.APPLICATION_JSON, capturedEntity.getHeaders().getContentType());
        assertEquals("test-api-key", capturedEntity.getHeaders().getFirst("X-API-KEY"));
    }

    @Test
    void testPostCartsRequest_NonSuccessStatusCode() throws Exception {
        // Arrange
        CartsRequest request = new CartsRequest();
        String requestJson = "{\"items\":[]}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error"));

        // Act
        String result = taxCloudClient.postCartsRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostCartsRequest_Exception() throws Exception {
        // Arrange
        CartsRequest request = new CartsRequest();
        String requestJson = "{\"items\":[]}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("API Error"));

        // Act
        String result = taxCloudClient.postCartsRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostOrdersRequest_Success() throws Exception {
        // Arrange
        OrdersRequest request = new OrdersRequest();
        request.setOrderId("ORDER123");
        request.setCustomerId("456");

        String requestJson = "{\"orderId\":\"ORDER123\"}";
        String responseJson = "{\"status\":\"success\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                eq(config.getOrdersUrl()),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(responseJson));

        // Act
        String result = taxCloudClient.postOrdersRequest(request, config);

        // Assert
        assertNotNull(result);
        assertEquals(responseJson, result);

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(taxCloudOutboundCall).makeRestCall(
                eq(config.getOrdersUrl()),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<String> capturedEntity = entityCaptor.getValue();
        assertEquals(requestJson, capturedEntity.getBody());
        assertEquals("test-api-key", capturedEntity.getHeaders().getFirst("X-API-KEY"));
    }

    @Test
    void testPostOrdersRequest_NonSuccessStatusCode() throws Exception {
        // Arrange
        OrdersRequest request = new OrdersRequest();
        String requestJson = "{\"orderId\":\"ORDER123\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());

        // Act
        String result = taxCloudClient.postOrdersRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostOrdersRequest_Exception() throws Exception {
        // Arrange
        OrdersRequest request = new OrdersRequest();
        String requestJson = "{\"orderId\":\"ORDER123\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("Network error"));

        // Act
        String result = taxCloudClient.postOrdersRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostRefundsRequest_Success() {
        // Arrange
        String orderId = "ORDER123";
        String responseJson = "{\"status\":\"refunded\"}";

        when(taxCloudOutboundCall.makeRestCall(
                eq(config.getOrdersRefundUrl() + orderId),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(responseJson));

        // Act
        String result = taxCloudClient.postRefundsRequest(orderId, config);

        // Assert
        assertNotNull(result);
        assertEquals(responseJson, result);

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(taxCloudOutboundCall).makeRestCall(
                eq(config.getOrdersRefundUrl() + orderId),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<String> capturedEntity = entityCaptor.getValue();
        assertEquals("{\"items\":[]}", capturedEntity.getBody());
        assertEquals("test-api-key", capturedEntity.getHeaders().getFirst("X-API-KEY"));
    }

    @Test
    void testPostRefundsRequest_NonSuccessStatusCode() {
        // Arrange
        String orderId = "ORDER123";

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.NOT_FOUND).build());

        // Act
        String result = taxCloudClient.postRefundsRequest(orderId, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostRefundsRequest_Exception() {
        // Arrange
        String orderId = "ORDER123";

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("API Error"));

        // Act
        String result = taxCloudClient.postRefundsRequest(orderId, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostVerifyAddressRequest_Success() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        request.setLine1("123 Main St");
        request.setCity("New York");
        request.setState("NY");
        request.setZip("10001");

        String requestJson = "{\"line1\":\"123 Main St\"}";
        String responseJson = "{\"zip\":\"10001-1234\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                eq(config.getVerifyAddressUrl()),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok(responseJson));

        // Act
        String result = taxCloudClient.postVerifyAddressRequest(request, config);

        // Assert
        assertNotNull(result);
        assertEquals(responseJson, result);

        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(taxCloudOutboundCall).makeRestCall(
                eq(config.getVerifyAddressUrl()),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<String> capturedEntity = entityCaptor.getValue();
        assertEquals(requestJson, capturedEntity.getBody());
        assertEquals("test-api-key", capturedEntity.getHeaders().getFirst("X-API-KEY"));
    }

    @Test
    void testPostVerifyAddressRequest_NonSuccessStatusCode() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        String requestJson = "{\"line1\":\"123 Main St\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());

        // Act & Assert
        TaxCloudException thrown = assertThrows(TaxCloudException.class, () -> {
            taxCloudClient.postVerifyAddressRequest(request, config);
        });

        // The exception is re-thrown with "Unexpected error while verifying address" message
        assertTrue(thrown.getMessage().contains("Unexpected error") || thrown.getMessage().contains("Verify Address"));
    }

    @Test
    void testPostVerifyAddressRequest_HttpClientErrorException_WithJsonDetail() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        String requestJson = "{\"line1\":\"123 Main St\"}";
        String errorResponseBody = "Some prefix {\"detail\":\"Invalid address format\"} some suffix";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(objectMapper.readTree(anyString()))
                .thenReturn(new ObjectMapper().readTree("{\"detail\":\"Invalid address format\"}"));

        HttpClientErrorException clientException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                errorResponseBody.getBytes(),
                null
        );

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(clientException);

        // Act & Assert
        TaxCloudException thrown = assertThrows(TaxCloudException.class, () -> {
            taxCloudClient.postVerifyAddressRequest(request, config);
        });

        assertEquals("Invalid address format", thrown.getMessage());
    }

    @Test
    void testPostVerifyAddressRequest_HttpClientErrorException_EmptyResponse() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        String requestJson = "{\"line1\":\"123 Main St\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);

        HttpClientErrorException clientException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                "".getBytes(),
                null
        );

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(clientException);

        // Act & Assert
        TaxCloudException thrown = assertThrows(TaxCloudException.class, () -> {
            taxCloudClient.postVerifyAddressRequest(request, config);
        });

        assertTrue(thrown.getMessage().contains("empty response"));
    }

    @Test
    void testPostVerifyAddressRequest_HttpClientErrorException_NoJsonInResponse() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        String requestJson = "{\"line1\":\"123 Main St\"}";
        String errorResponseBody = "Plain text error message without JSON";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);

        HttpClientErrorException clientException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                HttpHeaders.EMPTY,
                errorResponseBody.getBytes(),
                null
        );

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(clientException);

        // Act & Assert
        TaxCloudException thrown = assertThrows(TaxCloudException.class, () -> {
            taxCloudClient.postVerifyAddressRequest(request, config);
        });

        assertTrue(thrown.getMessage().contains("Failed to verify address"));
    }

    @Test
    void testPostVerifyAddressRequest_UnexpectedException() throws Exception {
        // Arrange
        VerifyAddressRequest request = new VerifyAddressRequest();
        String requestJson = "{\"line1\":\"123 Main St\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("Network error"));

        // Act & Assert
        TaxCloudException thrown = assertThrows(TaxCloudException.class, () -> {
            taxCloudClient.postVerifyAddressRequest(request, config);
        });

        assertEquals("Unexpected error while verifying address", thrown.getMessage());
        assertNotNull(thrown.getCause());
    }

    @Test
    void testPostCartsRequest_EmptyResponseBody() throws Exception {
        // Arrange
        CartsRequest request = new CartsRequest();
        String requestJson = "{\"items\":[]}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok().build());

        // Act
        String result = taxCloudClient.postCartsRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostOrdersRequest_EmptyResponseBody() throws Exception {
        // Arrange
        OrdersRequest request = new OrdersRequest();
        String requestJson = "{\"orderId\":\"ORDER123\"}";

        when(objectMapper.writeValueAsString(request)).thenReturn(requestJson);
        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok().build());

        // Act
        String result = taxCloudClient.postOrdersRequest(request, config);

        // Assert
        assertNull(result);
    }

    @Test
    void testPostRefundsRequest_EmptyResponseBody() {
        // Arrange
        String orderId = "ORDER123";

        when(taxCloudOutboundCall.makeRestCall(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(ResponseEntity.ok().build());

        // Act
        String result = taxCloudClient.postRefundsRequest(orderId, config);

        // Assert
        assertNull(result);
    }
}

---


 1 arquivo
+
6
−
3
 src/test/java/com/uownleasing/taxcloud/service/VerifyAddressServiceTest.java 
+
6
−
3

Visualizado
@@ -92,7 +92,8 @@ class VerifyAddressServiceTest {

        // Assert
        assertNotNull(result);
        assertNull(addressInfo.getZipCode9());
        // When zip node is missing, zipCode9 is not set, so getZipCode9() returns zipCode as fallback
        assertEquals("10001", addressInfo.getZipCode9());
    }

    @Test
@@ -110,7 +111,8 @@ class VerifyAddressServiceTest {

        // Assert
        assertNotNull(result);
        assertNull(addressInfo.getZipCode9());
        // When zip value is null, zipCode9 is not set, so getZipCode9() returns zipCode as fallback
        assertEquals("10001", addressInfo.getZipCode9());
    }

    @Test
@@ -177,7 +179,8 @@ class VerifyAddressServiceTest {

        // Assert
        assertNull(result);
        assertNull(addressInfo.getZipCode9());
        // When response is null, zipCode9 is not set, so getZipCode9() returns zipCode as fallback
        assertEquals("10001", addressInfo.getZipCode9());
    }

    @Test

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

O sistema deve executar com sucesso a requisição POST para CartsRequest no TaxCloud API.
O sistema deve retornar null quando a requisição POST para CartsRequest recebe status code não sucesso.
O sistema deve retornar null quando a requisição POST para CartsRequest lança exceção.
O sistema deve executar com sucesso a requisição POST para OrdersRequest no TaxCloud API.
O sistema deve retornar null quando a requisição POST para OrdersRequest recebe status code não sucesso.
O sistema deve retornar null quando a requisição POST para OrdersRequest lança exceção.
O sistema deve executar com sucesso a requisição POST para RefundsRequest no TaxCloud API.
O sistema deve lançar TaxCloudException quando a requisição POST para VerifyAddressRequest recebe status code não sucesso.
O sistema deve extrair mensagem de detalhe JSON da resposta de erro do TaxCloud API.
O sistema deve lançar TaxCloudException com mensagem "empty response" quando a resposta de erro está vazia.
O sistema deve lançar TaxCloudException com mensagem "Failed to verify address" quando não há JSON na resposta de erro.
O sistema deve lançar TaxCloudException com mensagem "Unexpected error while verifying address" quando ocorre exceção não esperada na verificação de endereço.
O sistema deve retornar null quando CartsRequest retorna corpo vazio.
O sistema deve retornar null quando OrdersRequest retorna corpo vazio.
O sistema deve retornar null quando RefundsRequest retorna corpo vazio.
O sistema deve incluir API-KEY no header das requisições para o TaxCloud API.
O sistema deve incluir Content-Type APPLICATION_JSON no header das requisições para o TaxCloud API.
O sistema deve executar todos os testes unitários da integração TaxCloud com sucesso no pipeline de release.