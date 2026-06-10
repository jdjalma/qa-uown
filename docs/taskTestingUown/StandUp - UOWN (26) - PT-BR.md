# StandUp - UOWN — Transcrição em Português

**Data:** 28 de abril de 2026, 16:30
**Duração:** 41m 3s

---

**Priyanka Namburu — 1:24**
Olá! Oi pessoal, bom dia. Como vocês estão?

**Fernando Martins — 1:26**
Oi, bom dia. Estamos bem. E você?

**Davi Artur — 1:27**
Olá.

**Sowjanya Kaligineedi — 1:28**
Fanni.

**Rodrigo Santos — 1:28**
Bom dia.

**Priyanka Namburu — 1:30**
Bem, bem, tudo certo. Acho que já temos todo mundo aqui. Algo a discutir antes de começarmos?

**Yuri Araujo — 1:31**
Olá, bom dia.

**Priyanka Namburu — 1:44**
Ok, como está indo a release, Yuri, Jose, Lucas?

**Yuri Araujo — 1:49**
Está indo bem. O Jose está testando o GoSign, o Lucas está testando o PayNearMe, e eu estou cuidando dos tickets restantes da station. Tenho mais dois tickets para testar e o key QA das stations.

**Priyanka Namburu — 1:56**
Sim. Mhm.

**Yuri Araujo — 2:08**
Criamos hoje, o Marcos está trabalhando na parte de read-only do lease no device, e tem outro do AMS de alguns dias atrás, então acho que vai dar certo.

**Priyanka Namburu — 2:14**
Sim. Sim. Ok, ótimo. Algum showstopper? Algum bug ou algo que precise ser tratado?

**Yuri Araujo — 2:33**
Ah… nada no momento, só isso por hoje em relação à release.

**Priyanka Namburu — 2:44**
Ok, parece bom. Obrigada. Ótimo, obrigada. Fernando, pode falar.

**Yuri Araujo — 2:47**
Obrigado.

**Fernando Martins — 2:56**
Tenho algumas coisas pra falar sobre o GoSign. Primeiro, abri o merge request hoje por causa de bugs que encontrei testando o fluxo de assinatura. Vou fazer a alteração que o Sohaib comentou agora há pouco. Depois disso, vou trabalhar em preparar o backend para a mudança de pasta que deve sair em breve, talvez hoje. Quero preparar e já revisar o request da forma que esperamos enviar.

E a última coisa é sobre a tabela: ontem o GoSign empurrou algumas mudanças. É sobre ajustar a largura da tabela — algo que antes não refletia no nosso lado. Agora podemos ajustar para ocupar só a largura desejada, por exemplo, era 800% e posso reduzir para 60. Antes não refletia. Mas o que ainda não está funcionando é a altura — não consigo deixá-la menor como está no SignWell. Então ainda estão ajustando. Quando estiver pronto, vou revisar o documento todo e deixar o mais parecido possível com o que temos no SignWell.

**Sowjanya Kaligineedi — 4:28**
Ok, parece bom. Deixamos mais alguns comentários no mesmo merge request, então dá uma olhada e nos avisa. E sobre os testes, estamos testando que os templates antigos do SignWell continuam funcionando, certo? Não é pergunta direta, mas sempre que…

**Fernando Martins — 4:37**
Mhm. Mhm.

**Sowjanya Kaligineedi — 4:50**
Que o Jose fale: não é só teste do GoSign. Caso a gente não vá com o GoSign, ou seja só para o template da Califórnia, certo? Mas tudo o mais — você fez algumas mudanças, reestruturação de código. Então a gente precisa testar tudo do jeito antigo (SignWell) para garantir que continua funcionando, e o GoSign também.

**Fernando Martins — 5:03**
Mhm.

**Sowjanya Kaligineedi — 5:11**
Ok, quando o teste for concluído, não só o template da Califórnia, é o que quero dizer. Beleza, obrigada.

**Fernando Martins — 5:12**
Sim. Claro. Obrigado.

**Priyanka Namburu — 5:22**
Beleza, obrigada. Marcos.

**Marcos Silva — 5:29**
Oi, abri o merge request para as melhorias dessa nova busca da 1452. Fiz aquela mudança que vocês falaram, do start at the start, e agora — pegar outro ticket ou ajudar nos testes. É isso.

**Priyanka Namburu — 5:53**
Desculpa, não captei. O que você disse? Qual parte você disse que estava testando?

**Marcos Silva — 5:59**
Opa, o áudio está cortando. Não ouviu nada?

**Priyanka Namburu — 6:07**
Não ouvi a última parte. Você disse que estava testando o quê?

**Marcos Silva — 6:11**
Ah, sim. Estou conversando com você para decidir qual ticket pegar em seguida, ou se devo ajudar nos testes.

**Priyanka Namburu — 6:17**
Ah, entendi. Sim, ok. Se te pedirem para testar algo, pode ir testar. Mas o AMS — mandei ontem uma nota no canal de tech — está com aparência estranha, todas as páginas novas. A página de merchant do user e a página de gerenciar merchants em um único user. As duas estão estranhas. Não estão alinhadas com o resto do portal. Visualmente, falando dos ajustes cosméticos, UI/UX. Acho que precisa ser tratado por você na próxima release, se você quiser dar uma olhada.

**Marcos Silva — 7:00**
Mhm.

**Priyanka Namburu — 7:05**
Seja espaçamento, formato da tabela, está tudo diferente. Pode olhar a página de merchant settings se não tiver certeza de como ajustar. Tem que ficar visualmente parecido com a página de merchant settings do portal de origination.

**Marcos Silva — 7:06**
Ok.

**Priyanka Namburu — 7:23**
Ou pelo menos combinar com o resto do portal AMS. Não bate, seja na fonte, no tamanho, na largura de cada caractere. Algo está fora nessas páginas. Dá pra ver que está tudo amontoado, espaçamento todo errado. Dá uma olhada.

**Marcos Silva — 7:24**
Ok, sim, preciso checar isso.

**Priyanka Namburu — 7:45**
E claro, se não houver testes para fazer nesta release, você também pode olhar a melhoria de performance do AMS, garantir que os endpoints não estejam pesados — só retornar a informação necessária. Pode dar uma olhada nessa parte.

**Marcos Silva — 8:03**
Ah, ok, você quer dizer o model? Ok.

**Priyanka Namburu — 8:07**
E também a página do user — você deve criar uma página separada para user e alguém deve conseguir clicar no usuário e voltar para a lista de usuários.

**Sowjanya Kaligineedi — 8:15**
Mas…

**Marcos Silva — 8:19**
Ei.

**Priyanka Namburu — 8:22**
Você pode criar tickets diferentes para isso e começar a trabalhar.

**Marcos Silva — 8:27**
Ok, ok.

**Priyanka Namburu — 8:28**
Ok, obrigada. Davi.

**Marcos Silva — 8:30**
Boa conversa.

**Davi Artur — 8:32**
Olá, estou trabalhando no ticket do GDS Account, e ontem estava procurando uma abordagem para substituir o select for date, e estou testando essa. Basicamente vamos remover o select for date.

**Sowjanya Kaligineedi — 8:42**
Sim.

**Davi Artur — 8:51**
Update, e estou testando recursos do Postgres que basicamente vão ter um ID comum, um para GDS e outro para Account, e em vez de travar a tabela de token, vamos travar um ID. Assim, quando travamos, só uma thread tenta atualizar o token e as outras continuam usando o token antigo. Acredito que essa solução seja suficiente para resolver nosso problema, mas ainda preciso validar. Vou apontar para o Dev e, quando terminar, gostaria de saber os resultados.

**Priyanka Namburu — 9:40**
Ok. É a melhor solução? Você verificou outras alternativas?

**Davi Artur — 9:43**
Sim, verifiquei outras opções, mas… considerando que temos múltiplas instâncias rodando em produção, não consegui usar um lock Java para controlar isso. Essa foi a melhor solução que encontrei, mas ainda estou procurando outras opções, e também te aviso.

**Priyanka Namburu — 10:16**
Ok, beleza. Parece bom, obrigada.

**Davi Artur — 10:17**
Mhm, obrigado.

**Priyanka Namburu — 10:20**
Boom.

**Davi Marra — 10:25**
Olá, bom dia. Ontem fiz algumas correções identificadas no meu [trabalho]. Também tive que ajudar com alguns testes. Comecei a olhar o problema do gráfico do log, mas agora vou checar o que você me pediu sobre a conta que não está movendo automaticamente para status paid off. É isso do meu lado.

**Priyanka Namburu — 10:44**
Ok, parece bom. Obrigada. Qual é o status do upgrade do Spring que esperamos fazer no dia 10 de maio?

**Davi Marra — 10:48**
Obrigado. Não consegui o upgrade da 151. Preciso puxar a versão mais recente e fazer as correções dos issues que aparecerem. Basicamente isso.

**Priyanka Namburu — 11:13**
Mhm. Ok, então essa será sua próxima tarefa depois que você debugar a conta. Quando descobrir o que aconteceu na conta, a tarefa imediata será pular para o upgrade do Spring. Devemos conseguir fazer um deploy no Dev 3 pelo menos até amanhã.

**Davi Marra — 11:22**
Mhm.

**Priyanka Namburu — 11:33**
É mais para o final do dia, então temos pelo menos uma semana sólida, porque o dia 10 é na próxima semana, no próximo fim de semana — não esse, mas o próximo. Queremos deixar tudo pronto. É um upgrade grande, então queremos garantir que todos os testes sejam feitos. E até o time de Dev pode ajudar com sweeps individuais para garantir que tudo está funcionando. Isso precisa ser alta prioridade depois disso, pelo menos por enquanto. Beleza.

**Davi Marra — 12:05**
Beleza, ok. Quando começar, te mantenho informada.

**Priyanka Namburu — 12:08**
Sim, parece bom. Obrigada.

**Davi Marra — 12:09**
Obrigado.

**Priyanka Namburu — 12:11**
Marcus.

**Marcus Braga — 12:16**
Olá, bom dia. Hoje de manhã fiz as mudanças na documentação que me pediram sobre o novo endpoint do Davi Artur, e também atualizei as release notes. Comecei a olhar… ah, antes disso, fiz uma call rápida com o Lucas para compartilhar com ele sobre o fluxo de refund e cancel payment. Passei meu acesso de logging para ele, mas talvez seja prudente criar um acesso novo para ele para futuros testes, mas por enquanto está ok. Agora estou começando a olhar um novo ticket da 152, sobre habilitar refund requests e fluxo de refund para transações funded incorretamente.

**Priyanka Namburu — 12:57**
Mm. Ok.

**Marcus Braga — 13:14**
Estava conversando com o Yuri sobre talvez começar a olhar isso. Tenho outros tickets, um deles especialmente é o partial payment reversal do PayNearMe, mas talvez seja baixa prioridade por enquanto. Conversando com o Yuri, talvez aquele ticket seja mais…

**Priyanka Namburu — 13:40**
Mas… isso precisa ser feito como… refund. Isso precisa funcionar. Basicamente, o que precisamos fazer quando há um partial refund é reverter o pagamento inteiro e criar um novo pagamento para o valor restante. É isso que acontece, certo, Sergei, no partial refund?

**Sowjanya Kaligineedi — 14:10**
Sim, é isso que fazemos.

**Priyanka Namburu — 14:13**
Para credit card e ACH é assim que fazemos o partial refund. Revertemos o pagamento inteiro e criamos um novo para o valor restante. Então provavelmente vai precisar lidar com isso para o partial refund.

E mais uma coisa sobre o projeto PayNearMe versus SVC que percebemos: qualquer business logic deve residir inteiramente no SVC. Não deveria ter nenhuma dependência no PayNearMe.

**Marcus Braga — 14:26**
Isso.

**Priyanka Namburu — 14:47**
Mas, do jeito que está seu framework agora, tudo precisa ser alterado no PayNearMe também, antes de voltar para o SVC, o que não é como deveria ser. PayNearMe é só um projeto, é só um placeholder para uma chamada externa ao PayNearMe — ele processa, faz o parse dos dados, ajusta um pouco e devolve tudo para o SVC. Só isso. Ele não sabe nada. Não deveria saber nada sobre business logic. Não deveria ter nenhum controle sobre os dados. Tudo o que faz é mandar os dados, receber os dados de volta, colocar num formato apresentável e devolver para o SVC.

**Marcus Braga — 15:23**
Mmh.

**Priyanka Namburu — 15:32**
SVC é o controlador. SVC é a cabeça. SVC deve saber quando chamar o PayNearMe e o que fazer com os dados que recebe de volta.

**Marcus Braga — 15:35**
Mhm. Ah, entendi.

**Priyanka Namburu — 15:43**
Qualquer business logic — envio de e-mail, SMS, links que conectamos, tudo — sei que você já tem a classe de implementação aí, mas nem a interface deveria estar no PayNearMe. PayNearMe não sabe nada além de mandar payload para o PayNearMe e voltar com os dados, e devolver para o SVC. Só isso importa pra ele. PayNearMe é só um placeholder pequeno. SVC é a cabeça, é o iniciador, é o detentor da business logic que acontece depois da chamada do PayNearMe. SVC é o único que sabe o que precisa ser feito, quando as chamadas precisam sair, tudo. É o orquestrador, o líder. PayNearMe não deveria saber nada além disso. Seja criar pagamento, reverter pagamento ou refund, qualquer coisa, SVC é quem sabe — com base nos dados que o PayNearMe devolve, SVC é quem decide.

**Marcus Braga — 16:29**
Mhm.

**Priyanka Namburu — 16:42**
Deveria decidir: "ok, neste ponto preciso reverter, e esse é o dado que recebi do PayNearMe, então só preciso desse dado para reverter um pagamento", ou fazer um pagamento, ou refund. Mas SVC é o único que precisa ser alterado. Se houver business logic a adicionar, só mudamos no SVC. PayNearMe não tem relação. PayNearMe não deveria ser alterado, não deveria ser tocado. Se houver business logic que precise ser alterada, é no SVC porque SVC é o orquestrador. Acho que isso é algo a tratar numa release futura, se possível. Não é alta prioridade agora porque está funcionando, mas conforme adicionarmos mais business logic — e vamos adicionar, porque esse primeiro mês…

**Marcus Braga — 17:04**
Time. Mhm.

**Priyanka Namburu — 17:27**
…é um trial do PayNearMe. Queremos ver como os pagamentos estão sendo feitos. Queremos ver quantas pessoas estão configurando auto pay e tudo mais. Com base nisso, vamos adicionar mais mudanças no SVC. Por enquanto, você está certo, o partial refund é prioridade baixa. Se houver um ticket de alta prioridade, você pode começar por ele. Mas vão existir mudanças no SVC. Elas serão baseadas no payload e na resposta do PayNearMe.

**Marcus Braga — 17:54**
Ok, talvez eu vá criar um ticket novo para isso. Podemos refatorar e colocar a estrutura aí, só para tratar. Desculpa pelo descuido — eu estava me baseando no test cloud, e do meu entendimento daquele momento eu estava entendendo que o controller no XPC era só uma ponte.

**Priyanka Namburu — 18:00**
Ok. Sim.

**Marcus Braga — 18:18**
Então a gente chama e a lógica fica no projeto lateral, na parte das dependências. Foi um descuido.

**Priyanka Namburu — 18:21**
Sem problema. Você foi muito bem, considerando que está fazendo isso pela primeira vez. PayNearMe tem muitos casos diferentes. Por isso eu e a SK não falamos nada — já está muito bom. Seu código está muito bom, sua separação de responsabilidades — você tem serviços individuais para cada coisa, não jogou tudo num único serviço. O que você já fez está muito bom. Não temos reclamações sobre o que você já fez. Essas coisas vêm com experiência. Você precisa fazer pelo menos uma ou duas vezes para entender "ah, é assim que devo separar". Não há problema com o que você fez, mas daqui pra frente esse é nosso feedback.

**Marcus Braga — 18:58**
Mhm. Ok. Muito obrigado. Vou criar um ticket pra isso e colocar prioridade mais alta que o payment reversal, então faço isso primeiro, ok?

**Priyanka Namburu — 19:08**
Ok. Mas dá uma olhada nos outros tickets também. Se houver outra coisa para pegar, pode pegar. Se não, faz sentido limpar isso, porque daqui pra frente sempre que tivermos business logic, será só no SVC.

**Marcus Braga — 19:26**
Sim. E sobre o tópico do payment reversal, você disse que talvez a gente tenha essa lógica — essa lógica já existe, criamos um pagamento novo e revertemos. Temos esse método já?

**Priyanka Namburu — 19:48**
Mmh. Sim, não sei se temos um método único que faz isso, mas a lógica existe tanto no CC quanto no ACH. Se quiser ver, acho que CC refunds — o serviço se chama CC refund service, provavelmente. De lá, se o valor não for o full amount, basicamente é partial refund.

**Marcus Braga — 20:07**
Sim.

**Priyanka Namburu — 20:16**
Revertemos o pagamento inteiro e criamos um novo para o valor restante. Verifica se é um método único ou se é uma lógica no CC refund service, mas é assim que deve funcionar.

**Marcus Braga — 20:28**
Ok, obrigado.

**Priyanka Namburu — 20:29**
Ok, obrigada. Gustavo.

**Gustavo Martins — 20:33**
Pra mim, ainda preciso fazer mais alguns testes no Sticky. Fiz algumas mudanças desde ontem, mas acho que não vai demorar muito, então talvez eu precise de um ticket novo em breve.

**Priyanka Namburu — 20:47**
Ótimo. Pode submeter o merge request do Sticky, Gustavo? Queremos ver como você implementou no projeto Sticky em si. Pode fazer, vemos depois quando estiver pronto. Mas para o projeto Sticky, é só um node bound call — basicamente uma chamada saindo e voltando, certo? E você também precisa implementar o webhook, certo?

**Gustavo Martins — 20:54**
Sim, sim.

**Priyanka Namburu — 21:10**
Conforme a documentação deles. Sempre que aquele pagamento for feito, falhar ou for recuperado — qualquer coisa — eles devolvem uma chamada de webhook. Precisamos implementar isso no SVC e configurar.

**Gustavo Martins — 21:22**
Ok, eu estava pensando que o webhook seria outro ticket que faríamos depois.

**Priyanka Namburu — 21:28**
Ah, não, precisamos saber. Quando enviamos um pagamento — basicamente isso é um mecanismo de retry, é a parte de recuperação do pagamento. Precisamos saber se o pagamento foi recuperado ou não. Toda vez que eles tentam, retentam o pagamento. Isso é basicamente para scheduled denied transactions, certo?

**Gustavo Martins — 21:43**
Entendi, ok.

**Priyanka Namburu — 21:48**
E também no SVC — você fez essa parte? Não tenho certeza se discutimos antes. Você precisa montar uma tabela. Acho que discutimos. Precisamos saber. Discutimos que deve ter uma tabela do Sticky, certo? E uma — não sei se deveria ser uma flag.

**Gustavo Martins — 22:01**
Entendi, pesquisar e tudo isso.

**Sowjanya Kaligineedi — 22:10**
Isso a gente não discutiu, acho.

**Priyanka Namburu — 22:13**
Sim, talvez não precisemos de uma flag. Podemos fazer join com a tabela do Sticky para ver se existe lá em vez de adicionar uma flag. E isso é só pra credit card, certo, Sowjanya?

**Gustavo Martins — 22:16**
Nunca vi antes, mas então a gente vê.

**Sowjanya Kaligineedi — 22:17**
Sim, sim.

**Sowjanya Kaligineedi — 22:26**
Esse é só credit card.

**Priyanka Namburu — 22:27**
Ok, então Gustavo, isso precisa…

**Sowjanya Kaligineedi — 22:34**
Isso.

**Priyanka Namburu — 22:35**
Naquela tabela nova, você precisa adicionar os dados, e eventualmente vamos precisar que você faça mudanças nos sweeps, porque atualmente temos rerun CC — temos uns 10 sweeps para credit cards, acho. Eles precisam olhar essa flag — basicamente, se a recuperação está no Sticky e o pagamento…

**Sowjanya Kaligineedi — 22:50**
Sim.

**Priyanka Namburu — 22:56**
…ainda não falhou completamente em todas as tentativas, então precisamos parar de fazer nossas tentativas de rerun naquele pagamento específico. Tudo isso são coisas para ter em mente. Para isso, primeiro precisamos implementar os webhooks. Quando tiver as mudanças do Sticky, submete o merge request, vamos olhar o projeto Sticky. E do lado do SVC, você precisa começar a parte do webhook — só criar um controller diferente e adicionar os endpoints. Eles têm múltiplos requisitos de webhook, conforme a documentação. Eles retentam o pagamento. Você entendeu? Não sei se já discutimos como o Sticky vai funcionar.

Basicamente, quando temos um scheduled denied credit card payment, tentamos pegar, digamos, $50 do cliente, e isso é negado por algum motivo, fundos insuficientes…

**Gustavo Martins — 23:20**
Vou fazer.

**Priyanka Namburu — 23:44**
…inválido, qualquer que seja o motivo. Se for negado, mandamos esse pagamento, esse pagamento específico que foi negado, para o Sticky e dizemos: "ok, você pode fazer todas as retentativas agora e nos avisa se conseguiu pegar os fundos do cliente." Por isso enviamos a transação original ao Sticky. E aí, com base nos timings do credit card, eles criam o próprio cronograma de retentativas. Digamos que tentem no máximo 5 vezes até o pagamento ser recuperado. A primeira tentativa será, digamos, 5 ou 3 dias a partir de agora, conforme o cronograma deles. Toda vez que tentam aquele pagamento, eles devolvem uma webhook call com o status. Digamos que as duas primeiras tentativas falhem — eles mandam fail, fail — e a terceira passa, mandam recovered. Precisamos rastrear tudo isso. Devemos rastrear tudo? Sim, melhor rastrear, Sowjanya?

**Sowjanya Kaligineedi — 24:43**
Sim, melhor rastrear numa tabela.

**Priyanka Namburu — 24:46**
Sim, deve ser uma tabela separada, certo? Não precisamos colocar todas as tentativas na tabela do Sticky. Talvez "sticky recovery attempt" ou "sticky attempt".

**Sowjanya Kaligineedi — 24:47**
Sim, isso seria muita coisa de novo. Recovery items, sim.

**Priyanka Namburu — 24:59**
Então rastreia toda tentativa, todo status que receber de volta, numa tabela diferente, Gustavo. Se for recuperado no final, atualiza o status da tabela original para recovered. Ou, se depois de 5 vezes ainda falhar, atualiza o status final da tabela original para failed ou recovered, conforme o caso, ok?

**Gustavo Martins — 25:16**
Sim, ok, vou trabalhar nisso.

**Priyanka Namburu — 25:26**
Ok, obrigada. Avise se tiver dúvidas ou se não entendeu alguma parte, podemos sempre discutir no Teams, ok?

**Gustavo Martins — 25:35**
Claro, obrigado.

**Priyanka Namburu — 25:37**
Obrigada. Jose.

**Jose Mendes — 25:41**
Olá. Estou continuando com o GoSign e os testes, já na reta final. Identifiquei alguns pontos menores e reportei ao time. Quando isso estiver fechado, passo a testar as tasks restantes em stage e a rodar os testes automatizados. É isso da minha parte.

**Priyanka Namburu — 26:03**
Ok, obrigada, Jose. Yuri, isso é pra você, ou pode atribuir a quem quiser — você, Momo, ao restante do time. Sempre que houver uma feature nova, seja Sticky, PayNearMe, GoSign no qual o Fernando está trabalhando, qualquer feature nova, qualquer vendor novo, garanta que todo mundo entenda a business logic por trás: o que está acontecendo, por que está acontecendo, o que deve fazer, onde devemos ver essas tentativas no front-end. Sempre que houver uma feature nova, é assim que devem pensar: "ok, estamos implementando esse vendor novo. Qual o propósito? O que ele faz? Como o usuário vai ver tudo isso, seja um attempt de pagamento ou qualquer coisa? Como o usuário final vê?" E os logs. Logs são o mais importante. Se não há activity log, nada está acontecendo. Se algo está acontecendo, deve haver activity log. De A a Z, todo mundo deve entender o que está acontecendo, qual o motivo e o que está fazendo nos bastidores.

**Yuri Araujo — 26:59**
Sim, sim.

**Priyanka Namburu — 27:11**
Cenas.

**Yuri Araujo — 27:13**
Ok, claro, faz sentido.

**Priyanka Namburu — 27:13**
Ok, obrigada. Obrigada, Jose. Lucas. E isso também é importante para o QA. Só quando entendem a business logic é que conseguem realmente começar a testar — não só seguir as instruções de teste do desenvolvedor, mas pensar por conta própria. "Ah, então é assim que funciona. É assim que se faz uma tentativa de recuperação de pagamento de credit card. Como sabemos quando…"

**Yuri Araujo — 27:17**
Obrigado.

**Jose Mendes — 27:19**
Não.

**Priyanka Namburu — 27:38**
"…o dinheiro é tirado do cliente? Como devolvemos? Como o usuário vê todas essas tentativas? No final falha ou…? Como testamos cada transação?" É assim que o QA tem que pensar. Claro, as instruções de teste do Dev são um guia, mas não são uma lista exaustiva. Só quando entendem a business logic por trás da feature nova é que conseguem testar de forma efetiva. Garanta que entendam o que está acontecendo.

**Yuri Araujo — 28:07**
Yep.

**Priyanka Namburu — 28:09**
Obrigada. Pode falar, Lucas. Desculpa.

**Lucas Elias — 28:13**
Bom dia. Ontem não consegui testar o PayNearMe via SMS porque os sites de número virtual não estavam recebendo o link. Mas hoje o Washington me ajudou com um número confiável e consegui rodar o teste perfeitamente. Tudo funcionou bem no mobile, e os logs estão corretos, então conseguimos fazer os pagamentos sem problemas. Parece que o fluxo de SMS também está funcionando. Pra hoje, também tive aquela call antes da daily com o Marcos, onde ele me explicou os processos de refund.

**Priyanka Namburu — 28:50**
Mhm.

**Lucas Elias — 28:50**
Pra hoje vou testar o refund e alguns cenários específicos que discutimos.

**Priyanka Namburu — 28:58**
Ok, parece bom. Obrigada. Rodrigo.

**Sowjanya Kaligineedi — 29:07**
Sim.

**Rodrigo Santos — 29:10**
Olá, bom dia. Ontem consegui finalmente operar o pipeline do SVC para evitar publicar a imagem Docker em meus request builds, e persisti essas mudanças na branch da 152. Hoje verifiquei as métricas dos pods e nenhum head start ocorreu desde o último. Meu plano é continuar trabalhando na task do pipeline. É isso da minha parte.

**Priyanka Namburu — 29:37**
Ótimo. Fica de olho — depois da release ser deployada, fica de olho no AMS e no projeto de origination, para sabermos qual é o uso de CPU, não só quando o pod reinicia por alto uso de CPU, mas…

**Rodrigo Santos — 29:56**
Mm-hmm.

**Priyanka Namburu — 29:57**
Você pode, ou se vir logs em qualquer ponto durante o dia, no horário de pico de uso de CPU — não precisa necessariamente causar restart de pod, mas sempre que estiver alto, dá uma olhada para garantir que existem logs indicando o que está acontecendo nos pods.

**Rodrigo Santos — 30:11**
Mm-hmm.

**Priyanka Namburu — 30:17**
Se ainda faltarem logs ou se ainda não soubermos o motivo e algo mais precisar ser adicionado, o Mumu pode adicionar num hotfix.

**Rodrigo Santos — 30:18**
Ok, claro.

**Priyanka Namburu — 30:26**
Ok, obrigada.

**Rodrigo Santos — 30:28**
Obrigado.

**Priyanka Namburu — 30:31**
Yuri.

**Yuri Araujo — 30:32**
Olá, como falei mais cedo, criei um ticket para o Marcos, e continuei testando em stage. Só faltam dois sobre o QA e station — é o ticket do Marcus e do Momo. O Jose Aurelio tem teste de automação para os outros. Meu plano é testar esses dois tickets, trabalhar nas release notes e organizar minha demo de amanhã. É isso. Finalmente.

**Priyanka Namburu — 31:09**
Ok. Obrigada. Sobre amanhã… não tenho certeza se vamos conseguir fazer a demo. Tudo bem. Ok, obrigada. Mais alguma coisa?

**Yuri Araujo — 31:23**
Ok.

**Sowjanya Kaligineedi — 31:25**
Não, acho que é isso.

**Priyanka Namburu — 31:30**
…para discutir. Yuri, vamos te enviar mais tickets para serem criados para a 152, mas garanta que criemos todos os tickets para todos os Zendesks que discutimos. Qualquer Zendesk que discutimos e dissemos "vamos arrumar na próxima release", garanta que os tickets estejam criados. E temos mais alguns que precisam ser criados.

**Yuri Araujo — 31:37**
Ok.

**Priyanka Namburu — 31:52**
Sim, Marcus.

**Yuri Araujo — 31:52**
Ok.

**Sowjanya Kaligineedi — 31:54**
Sim.

**Marcus Braga — 31:54**
Só lembrei, talvez eu precise checar — sei que talvez precisemos apontar para a [conta de] production que liberamos, então vou checar isso hoje.

**Priyanka Namburu — 32:07**
Sim.

**Sowjanya Kaligineedi — 32:08**
Sim.

**Priyanka Namburu — 32:11**
Não, temos uma conta diferente para production. Precisamos configurar as URLs do webhook no portal de production. SK e eu fazemos isso hoje.

**Marcus Braga — 32:17**
Ok, e no código precisamos apontar para a URL. Vou checar se estamos…

**Priyanka Namburu — 32:21**
Sim, todas essas configurações, tudo, qualquer credencial, qualquer URL — garanta que tudo está bom. Tem que apontar para production, ok, na config de production.

**Marcus Braga — 32:34**
Ok.

**Priyanka Namburu — 32:40**
Beleza, obrigada. O mesmo vale pra você, Fernando. Quem estiver lidando com janelas externas, garanta que tudo de production aponte para production e os de lower aponte para lower.

**Fernando Martins — 32:53**
Sim, lembrei que acho que tem algo que precisamos mudar no path de DevOps para a configuração que usamos no assign service. Vou checar e abrir um draft merge request para a configuração se for o caso.

**Priyanka Namburu — 33:10**
Beleza, parece bom. Pergunta rápida: a coisa de "test" da conta foi corrigida no origination ou ainda está apontando? Ainda aparece como "test"? Acho que o Gustavo corrigiu a flag de production.

**Sowjanya Kaligineedi — 33:28**
Sim.

**Priyanka Namburu — 33:31**
Certo.

**Sowjanya Kaligineedi — 33:32**
Gustavo, sim, o Gustavo disse que removeram os espaços, então deveria estar funcionando agora. Não sei se alguém foi testar, mas…

**Gustavo Martins — 33:33**
Então.

**Priyanka Namburu — 33:35**
Marcus, sim, sim. Alguém de vocês, quem tiver tempo, pode checar production no Sentry ou na última gravação que conseguir? Pode checar para garantir que está apontando para production e não para test?

**Sowjanya Kaligineedi — 33:44**
Mmh.

**Marcos Silva — 33:56**
Ah, com…

**Gustavo Martins — 33:57**
Sim, eu e o Marcos checamos na época e não vimos mais os logs aparecendo como "test" depois que o Rodrigo atualizou a variável em production.

**Priyanka Namburu — 34:09**
Ah ok, que bom. Você verificou na gravação do Sentry?

**Gustavo Martins — 34:15**
Sim, no Sentry. E qual era o outro?

**Marcos Silva — 34:15**
Sim, lembro de ter olhado lá para Account e qual era o outro serviço?

**Priyanka Namburu — 34:29**
O protection plan, o Buddy.

**Sowjanya Kaligineedi — 34:31**
Buddy?

**Marcos Silva — 34:32**
E sim, o Buddy. Tive que testar localmente, não vemos as requests lá e need page, sim.

**Priyanka Namburu — 34:38**
Não precisa ser a request inteira, certo? Não devemos mostrar a request com informação pessoal do cliente na página. Mas… não tem mais nada que represente se é "test" ou "production" para o Buddy além dos detalhes?

**Marcos Silva — 34:56**
Mm. Sim, podemos colocar um log lá, mas o problema é que tudo o mais estava correto. A única coisa que estaria errada seria…

**Priyanka Namburu — 35:00**
Ok.

**Marcos Silva — 35:10**
Um stage assim. Não conseguiríamos fazer log para isso.

**Priyanka Namburu — 35:13**
Tudo bem. Acho que o Buddy estava ok porque vemos protection plans em production para clientes reais. Acho que está ok. Uma coisa que queríamos, Sowjanya — isso foi algo que discutimos, certo? Como estamos devolvendo todos esses dados sensíveis do Buddy para o front-end, isso não deveria aparecer.

**Sowjanya Kaligineedi — 35:15**
Tudo bem. Mhm.

**Priyanka Namburu — 35:33**
Ou… deveria haver algum mecanismo de segurança ou proteção, Marcos, porque aquela página, a página de signing do origination, secure.com, é aberta ao mundo, certo? Não está atrás de firewall, VPN ou nada. Qualquer cliente, qualquer pessoa pode abrir no celular ou…

**Marcos Silva — 35:50**
Mhm.

**Priyanka Namburu — 35:52**
…no laptop. Está aberta ao mundo. O backend está devolvendo informação sensível do cliente para o front-end por causa do protection plan.

**Marcos Silva — 36:02**
Tipo, na response do submit application, que…

**Priyanka Namburu — 36:06**
Sim, sim. A gente não fazia isso antes, certo? Para o submit application, era tudo escondido — só retornávamos…

**Sowjanya Kaligineedi — 36:11**
Sim.

**Priyanka Namburu — 36:17**
…o que vocês chamam de embedded signing URL e coisas assim, que não é informação sensível, e os detalhes de pagamento, que não são sensíveis. Mas isso é PII, informação de identidade pessoal. Devemos fazer algo para garantir que não seja exibida quando usuários maliciosos olharem o payload. Devemos fazer algo para que não apareça no front-end.

**Marcos Silva — 36:39**
Ok.

**Priyanka Namburu — 36:42**
Não é assim que funciona? Sinto que é assim que o customer portal também funciona. Pelo menos no customer portal alguém faz login, tem aquela checagem de telefone ou algo. Sabemos que é cliente. Mas no caso do origination, a gente não sabe — qualquer um pode pegar a URL, clicar e ver a informação do cliente. Por isso estamos pensando se há algo a mais que possamos fazer para adicionar segurança. Tenho certeza que tem algo do front-end que diz "ah, quando a URL está aberta ao mundo…", tenho certeza.

**Marcos Silva — 37:14**
Sim, acho que precisaríamos fazer algo como o customer portal, pedir um código para retornar algo, mas…

**Priyanka Namburu — 37:25**
Não, não estou falando do customer portal. Falo da signing page.

**Marcos Silva — 37:26**
Sim.

**Sowjanya Kaligineedi — 37:26**
Sim.

**Marcos Silva — 37:29**
Sim, sim, mas para a signing page.

**Priyanka Namburu — 37:32**
Não podemos ter pontos adicionais de fricção. Não podemos pedir ao cliente para inserir o telefone ou um código adicional, nada disso. É melhor fazer outra coisa que esconda esse payload da response no front-end.

**Marcos Silva — 37:52**
Ohh.

**Priyanka Namburu — 37:54**
Pesquise o que acontece em outros casos, normalmente. Tenho certeza que em algum momento — SK e eu, quando começamos, discutimos algo com um dos nossos developers originais, esqueci.

**Sowjanya Kaligineedi — 37:58**
Mhm.

**Marcos Silva — 38:07**
Sinto que apenas codificar a response não seria suficiente, poderia ser algo, mas não acho que seja suficiente para realmente ser seguro.

**Priyanka Namburu — 38:14**
Ok. Pense e pesquise o que pode ser feito, porque é informação sensível. Precisamos ter cuidado. Ok.

**Marcos Silva — 38:30**
Ok.

**Priyanka Namburu — 38:31**
Ok, obrigada. O que estávamos discutindo? Acho que é isso. Sohaib, mais alguma coisa?

**Sowjanya Kaligineedi — 38:39**
Não.

**Priyanka Namburu — 38:42**
Ok. Marcos, garanta que crie todos os tickets para todas as mudanças do AMS desse que discutimos, ok? Não precisa trabalhar em tudo de uma vez. É só pra que, criando os tickets, alguém possa pegar.

**Marcos Silva — 38:55**
Ok.

**Priyanka Namburu — 38:56**
Quem estiver disponível, ok? Mais alguma pergunta, pessoal?

**Yuri Araujo — 39:02**
Por enquanto não.

**Priyanka Namburu — 39:03**
Ok. Obrigada, e tenham um bom dia.

**Fernando Martins — 39:06**
Obrigado, vocês também. Tchau.

**Yuri Araujo — 39:06**
Obrigado, vocês também. Tchau.

**Priyanka Namburu — 39:08**
Tchau.

**Marcos Silva — 39:08**
Tchau.

*Yuri Araujo parou a transcrição.*
