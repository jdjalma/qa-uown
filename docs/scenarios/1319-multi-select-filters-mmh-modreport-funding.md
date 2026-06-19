OBS-01 - Campo Merchant perde o foco a cada seleção, impedindo seleção contínua
Ao selecionar um merchant digitando no filtro, o campo perde o foco logo após a escolha. Isso obriga o usuário a clicar duas vezes para abrir o dropdown novamente a cada merchant adicional, em vez de digitar e selecionar vários em sequência.
Esperado: após selecionar um merchant, o foco permanece no campo, permitindo digitar e adicionar o próximo sem reabrir o dropdown.

OBS-02 - Locations ficam presas quando o merchant é removido
Quando o usuário seleciona um merchant e suas locations e depois remove o merchant, as locations continuam preenchidas no campo. Como o filtro Location fica desabilitado na ausência de merchant, o usuário não consegue mais remover essas locations, elas ficam órfãs e travadas no campo.
Esperado: ao remover o merchant, as locations associadas devem ser limpas automaticamente (ou o campo Location deve permanecer acessível para remoção manual).

OBS-03 - Contador de Location se perde após troca de merchant
O contador de locations selecionadas fica inconsistente na seguinte sequência: adicionar merchant → adicionar location → remover o(s) merchant(s) → adicionar outro merchant → adicionar location. Após esse fluxo, o contador não reflete o número real de locations selecionadas.
Esperado: o contador deve recalcular e exibir corretamente o total de locations a cada mudança de merchant/location.

OBS-04 - Não é possível remover a seleção de uma location já marcada
Após selecionar um merchant e uma location, o filtro Location não permite remover a seleção: ao clicar no checkbox de uma location já marcada, ela não desmarca e permanece selecionada.
Esperado: o filtro Location deve permitir desmarcar uma location já selecionada, removendo-a do conjunto de valores aplicados.