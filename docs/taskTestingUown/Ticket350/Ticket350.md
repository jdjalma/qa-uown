------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/350

UOWN | Application | Nullpointer Exception Analisys.

There are several scenarios for NullPointer Exception.
Spreadsheet attached with scenarios.

-----

UOWN | Aplicação | Análise de NullPointerException.

Existem vários cenários de NullPointerException.
Planilha anexa com os cenários.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

08/04/2025 00:33	
java.lang.NullPointerException	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.util.concurrent.CompletionException&from=1744169260000&to=1744169560000
    No data

08/04/2025 01:08
com.jcraft.jsch.SftpException: no such file	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=com.jcraft.jsch.SftpException&from=1744171060000&to=1744171360000
    2025-04-08 23:00:00.680	
    com.jcraft.jsch.SftpException: no such file
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-cwhkj_03657f1e-f3e2-4b39-9305-edbae07274b8/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-yl1u

    pod	
    uown-prd-svc-654746bd87-cwhkj


    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout

08/04/2025 01:23	
io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158779796)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744170760000&to=1744171060000			
    2025-04-08 22:54:41.783	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158779796)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-cwhkj_03657f1e-f3e2-4b39-9305-edbae07274b8/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-yl1u

    pod	
    uown-prd-svc-654746bd87-cwhkj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 01:23	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158779796)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744170760000&to=1744171060000			
    2025-04-08 22:54:41.783	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158779796)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-cwhkj_03657f1e-f3e2-4b39-9305-edbae07274b8/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-yl1u

    pod	
    uown-prd-svc-654746bd87-cwhkj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout



08/04/2025 01:58	
java.lang.NullPointerException	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.lang.NullPointerException&from=1744174060000&to=1744174360000			
    2025-04-08 23:49:40.952	
    java.lang.NullPointerException: null
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout
    2025-04-08 23:49:40.951	
    java.lang.NullPointerException: null
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout
    2025-04-08 23:47:56.973	
    java.lang.NullPointerException
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr
    2025-04-08 23:47:51.230	
    java.lang.NullPointerException
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr


08/04/2025 01:58	
at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.dao.support.PersistenceException&from=1744174360000&to=1744174660000			
    2025-04-08 23:57:19.576	
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr
    2025-04-08 23:57:18.906	
        at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr
    2025-04-08 23:55:44.507	
        at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr
    2025-04-08 23:55:43.930	
        at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stderr


08/04/2025 02:03	
io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158794969)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-ams&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744174660000&to=1744174960000			
    2025-04-09 00:01:41.111	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158794969)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-ptpdt_53052a5b-cd3b-4b23-97bf-72e5d7eaa6a5/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-ams-c6dddf49-ptpdt

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout
    2025-04-09 00:01:16.327	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25432939 (181751112)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-x4pd4_f4bb451c-5de9-42f2-9478-94cfbe5e3a5f/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-ams-c6dddf49-x4pd4

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout


08/04/2025 02:03	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158794969)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-ams&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744174660000&to=1744174960000			
    2025-04-09 00:01:41.111	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158794969)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-ptpdt_53052a5b-cd3b-4b23-97bf-72e5d7eaa6a5/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-ams-c6dddf49-ptpdt

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout
    2025-04-09 00:01:16.327	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25432939 (181751112)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-x4pd4_f4bb451c-5de9-42f2-9478-94cfbe5e3a5f/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-ams-c6dddf49-x4pd4

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout


08/04/2025 03:52	
io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25432939 (181824250)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-payment-gateway&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744181260000&to=1744181560000			
    2025-04-09 01:49:53.986	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25432939 (181824250)
    Fields

    app	
    uown-prd-payment-gateway

    component	
    uown-prd-payment-gateway

    container	
    uown-prd-payment-gateway

    filename	
    /var/log/pods/uown-prd_uown-prd-payment-gateway-5847cbb69b-5vzph_16424de1-6b4f-45ef-a685-952dcb611c25/uown-prd-payment-gateway/0.log


    instance	
    uown-prd-payment-gateway

    job	
    uown-prd/uown-prd-payment-gateway

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-payment-gateway-5847cbb69b-5vzph

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-payment-gateway

    stream	
    stdout


08/04/2025 03:52	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25432939 (181824250)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-payment-gateway&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744181260000&to=1744181560000			
    2025-04-09 01:49:53.986	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25432939 (181824250)
    Fields

    app	
    uown-prd-payment-gateway

    component	
    uown-prd-payment-gateway

    container	
    uown-prd-payment-gateway

    filename	
    /var/log/pods/uown-prd_uown-prd-payment-gateway-5847cbb69b-5vzph_16424de1-6b4f-45ef-a685-952dcb611c25/uown-prd-payment-gateway/0.log

    instance	
    uown-prd-payment-gateway

    job	
    uown-prd/uown-prd-payment-gateway

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-payment-gateway-5847cbb69b-5vzph

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-payment-gateway

    stream	
    stdout


08/04/2025 05:23	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158779796)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744186660000&to=1744186960000			
    2025-04-09 03:21:10.736	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158779796)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc


    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 05:28	
io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158779796)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744186660000&to=1744186960000			
    2025-04-09 03:21:10.736	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158779796)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 06:03	
java.lang.NullPointerException	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.lang.NullPointerException&from=1744189060000&to=1744189360000			
    No data


08/04/2025 06:03	
org.springframework.web.client.HttpClientErrorException.create(HttpClientErrorException.java:113)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.web.client.HttpClientErrorException&from=1744189060000&to=1744189360000			
    2025-04-09 04:00:44.986	
	at org.springframework.web.client.HttpClientErrorException.create(HttpClientErrorException.java:113)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-rvnfj_b5ef57df-5874-4a18-90f0-a923c136c3bd/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-svc-654746bd87-rvnfj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout
    2025-04-09 04:00:44.986	
    org.springframework.web.client.HttpClientErrorException$NotFound: 404 Not Found: "{"message":"Not found","meta":{"error":"record_not_found","message":"Couldn't find the document requested","messages":["Couldn't find the document requested"]}}"
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    detected_level	
    error

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-rvnfj_b5ef57df-5874-4a18-90f0-a923c136c3bd/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-svc-654746bd87-rvnfj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 06:03	
java.lang.NullPointerException	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.util.concurrent.CompletionException&from=1744189060000&to=1744189360000			
    2025-04-09 04:00:34.537	
    java.util.concurrent.CompletionException: java.lang.NullPointerException
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-cwhkj_03657f1e-f3e2-4b39-9305-edbae07274b8/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-yl1u

    pod	
    uown-prd-svc-654746bd87-cwhkj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout
    2025-04-09 04:00:13.349	
    java.util.concurrent.CompletionException: java.lang.NullPointerException
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-cwhkj_03657f1e-f3e2-4b39-9305-edbae07274b8/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-yl1u

    pod	
    uown-prd-svc-654746bd87-cwhkj

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 06:13	
io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158794969)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-ams&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744189660000&to=1744189960000			
    2025-04-09 04:11:13.438	
    Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25444213 (158794969)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-x4pd4_f4bb451c-5de9-42f2-9478-94cfbe5e3a5f/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-ams-c6dddf49-x4pd4

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout


08/04/2025 06:18	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158794969)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-ams&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744189660000&to=1744189960000			
    2025-04-09 04:11:13.438	
    io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158794969)
    Fields

    app	
    uown-prd-ams

    component	
    uown-prd-ams

    container	
    uown-prd-ams

    filename	
    /var/log/pods/uown-prd_uown-prd-ams-c6dddf49-x4pd4_f4bb451c-5de9-42f2-9478-94cfbe5e3a5f/uown-prd-ams/0.log

    instance	
    uown-prd-ams

    job	
    uown-prd/uown-prd-ams

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-7c858319-kauu

    pod	
    uown-prd-ams-c6dddf49-x4pd4

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-ams

    stream	
    stdout


08/04/2025 07:23	
Unexpected exception occurred invoking async method: public java.lang.Boolean com.uownleasing.svc.service.SvGCSService.uploadFileToGCSByLeadUuid
(java.lang.String,java.lang.String,com.uownleasing.svc.pojo.rest.GCSUpload)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=.a.i.SimpleAsyncUncaughtException&from=1744193860000&to=1744194160000			
    2025-04-09 05:19:07.119	
    2025-04-09 06:19:07.119 ERROR 1 --- [Executor-277811] .a.i.SimpleAsyncUncaughtExceptionHandler : Unexpected exception occurred invoking async method: public java.lang.Boolean com.uownleasing.svc.service.SvGCSService.uploadFileToGCSByLeadUuid(java.lang.String,java.lang.String,com.uownleasing.svc.pojo.rest.GCSUpload)
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    detected_level	
    error

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-4vt4b_964101c3-4459-4ef1-bf97-9332b9f7b4d4/uown-prd-svc/1.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-la1b

    pod	
    uown-prd-svc-654746bd87-4vt4b

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 07:43	
com.uownleasing.svc.exceptions.TmsException: Cannot find class com.uownleasing.svc.common.db.entity.SvAccount entity with pk 112312	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=com.uownleasing.svc.exceptions.TmsException&from=1744195060000&to=1744195360000			
    2025-04-09 05:37:53.102	
    com.uownleasing.svc.exceptions.TmsException: Cannot find class com.uownleasing.svc.common.db.entity.SvAccount entity with pk 112312



    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout
    2025-04-09 05:37:53.100	
    com.uownleasing.svc.exceptions.TmsException: Cannot find class com.uownleasing.svc.common.db.entity.SvAccount entity with pk 112312
    Fields

    app	
    uown-prd-svc

    component	
    uown-prd-svc

    container	
    uown-prd-svc

    filename	
    /var/log/pods/uown-prd_uown-prd-svc-654746bd87-wmgkh_5e91f2e8-01af-4398-8ca2-472788da7a32/uown-prd-svc/0.log

    instance	
    uown-prd-svc

    job	
    uown-prd/uown-prd-svc

    namespace	
    uown-prd

    node_name	
    gke-production-worker-node-pool-8x32-8f21f280-in87

    pod	
    uown-prd-svc-654746bd87-wmgkh

    scrape_job	
    kubernetes-pods

    service_name	
    uown-prd-svc

    stream	
    stdout


08/04/2025 07:52	
Caused by: io.fabric8.kubernetes.client.KubernetesClientException: too old resource version: 25432939 (181986561)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-payment-gateway&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744195660000&to=1744195960000			


08/04/2025 07:52	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25432939 (181986561)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-payment-gateway&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744195660000&to=1744195960000			


08/04/2025 08:18	
at org.springframework.web.client.HttpServerErrorException.create(HttpServerErrorException.java:100)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.web.client.HttpServerErrorException&from=1744197160000&to=1744197460000			


08/04/2025 08:48	
at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:137	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.dao.support.PersistenceException&from=1744198960000&to=1744199260000			


08/04/2025 09:08	
Duplicate application request:	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=com.uownleasing.svc.exceptions.InvalidFieldsException&from=1744200160000&to=1744200460000			


08/04/2025 09:23	
too old resource version:	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.KubernetesClientException&from=1744200160000&to=1744200460000			


08/04/2025 09:23	
too old resource version:	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744200460000&to=1744200760000			


08/04/2025 10:03	
java.lang.NullPointerException: null	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.lang.NullPointerException&from=1744203460000&to=1744203760000			


08/04/2025 10:13	
io.fabric8.kubernetes.client.WatcherException: too old resource version: 25444213 (158787446)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-ams&var-exception_filter=io.fabric8.kubernetes.client.WatcherException&from=1744201960000&to=1744202260000			


08/04/2025 10:13	
org.hibernate.exception.JDBCConnectionException: could not execute statement	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.hibernate.exception.JDBCConnectionException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:255)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
at org.hibernate.exception.internal.StandardSQLExceptionConverter.convert(StandardSQLExceptionConverter.java:37)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.hibernate.exception.internal.StandardSQLException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
org.springframework.transaction.TransactionSystemException: Could not roll back JPA transaction; nested exception is org.hibernate.TransactionException: Unable to rollback against JDBC Connection	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.transaction.TransactionSystemException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551)	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
org.postgresql.util.PSQLException: An I/O error occurred while sending to the backend.	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.postgresql.util.PSQLException&from=1744204060000&to=1744204360000			


08/04/2025 10:13	
java.util.concurrent.CompletionException: java.lang.NullPointerException	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=java.util.concurrent.CompletionException&from=1744204060000&to=1744204360000			


08/04/2025 12:48	
org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.springframework.transaction.UnexpectedRollbackException&from=1744213360000&to=1744213660000			


08/04/2025 12:23	
org.hibernate.exception.LockAcquisitionException: could not extract ResultSet	
https://grafana.uownleasing.com/d/beca1vdzx2dxcc/application-logs?orgId=1&var-service_name=uown-prd-svc&var-exception_filter=org.hibernate.exception.LockAcquisitionException&from=1744211860000&to=1744212160000			

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificando os logs, identificamos que um lead (LosLead pk = 5102071), já vinculado a um plano de proteção (ProtectionPlanInfo com dados de cliente, datas e valores), foi importado com sucesso para o servicing, gerando a conta SvAccount pk = 502161 e disparando o e-mail de boas-vindas.
No teste, pela interface, foram criados dois leases: um sem plano de proteção (12717) e outro com plano de proteção (12719), e todo o processo foi realizado pelos e-mails enviados.

Checking the logs, we identified that a lead (LosLead pk = 5102071), already linked to a protection plan (ProtectionPlanInfo with customer data, dates and values), was successfully imported into servicing, generating the SvAccount pk = 502161 account and triggering the welcome email.
In the test, two leases were created via the interface: one without a protection plan (12717) and the other with a protection plan (12719), and the entire process was carried out via the emails sent.
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Checking the logs, we identified that a lead (LosLead pk = 5102071), already linked to a protection plan (ProtectionPlanInfo with customer data, dates and values), was successfully imported into servicing, generating the SvAccount pk = 502161 account and triggering the welcome email.In the test, two leases were created via the interface: one without a protection plan (12717) and the other with a protection plan (12719), and the entire process was carried out via the emails sent. |  | PASS |

-----

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Checking the logs, we identified that a lead (LosLead pk = 5102071), already linked to a protection plan (ProtectionPlanInfo with customer data, dates and values), was successfully imported into servicing, generating the SvAccount pk = 502161 account and triggering the welcome email. In the test, two leases were created via the interface: one without a protection plan (12717) and the other with a protection plan (12719), and the entire process was carried out via the emails sent. | ![qa2-350-c1_1_](/uploads/23997b2a74033d97160fe06ab9639bd1/qa2-350-c1_1_.png){width=1196 height=30}![qa2-350-c1_2_](/uploads/5ee6831a79cc219a9f42ba556b72f1bd/qa2-350-c1_2_.png){width=1432 height=746}![qa2-350-c1_3_](/uploads/99895941d37de32d87ab67ae9c0339f7/qa2-350-c1_3_.png){width=550 height=55}![qa2-350-c1_4_](/uploads/df27a50c099398d1b81cb6fd41485bd4/qa2-350-c1_4_.png){width=539 height=692}![qa2-350-c1_5_](/uploads/d425ca1cbbe6651616ba16483ac353e7/qa2-350-c1_5_.png){width=542 height=53}![qa2-350-c1_6_](/uploads/6c20bb4185bbcf13adf8a484b2359da7/qa2-350-c1_6_.png){width=540 height=505}![qa2-350-c1_7_](/uploads/c778b9b1aa6cb58b9c7da6e32763ef57/qa2-350-c1_7_.png){width=545 height=50}![qa2-350-c1_8_](/uploads/2641a8eddb824735d9ffd6f8262c82fe/qa2-350-c1_8_.png){width=543 height=483}![qa2-350-c1_9_](/uploads/4e724b6242684134124671eb87401681/qa2-350-c1_9_.png){width=1435 height=743}![qa2-350-c1_10_](/uploads/1f2b02cada39e8d4d1b7b9147ad9e3bd/qa2-350-c1_10_.png){width=1435 height=743}![qa2-350-c1_11_](/uploads/fadd8fe308cd0aa0b86ef4a87e801ea5/qa2-350-c1_11_.png){width=1435 height=743}![qa2-350-c1_12_](/uploads/5bd87c1d07e69625bb2d7cb745afdd1b/qa2-350-c1_12_.png){width=1435 height=743} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Checking the logs, we identified that a lead (LosLead package = 5102071), already linked to a protection plan (ProtectionPlanInfo with customer data, dates and values), was successfully imported into the service, generating the SvAccount package = 502161 account and triggering the welcome email. In the test, two rental contracts were created by the interface: one without a protection plan (23648) and another with a protection plan (23649), and the entire process was carried out through the emails sent, validating whether a nullPointer is returned at any stage of the process. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------