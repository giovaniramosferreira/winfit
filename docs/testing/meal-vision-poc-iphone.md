# Roteiro opcional de iPhone — requisito dispensado pelo usuário

Em 04/11/2026 o usuário determinou validação no navegador com fotos da web e dispensou a exigência de aparelho físico. Este roteiro permanece como referência opcional; não bloqueia a POC nem exige ação do usuário. O texto abaixo registra a preparação anterior.

Este roteiro é uma preparação para o requisito da AURAVIZ-75, não uma evidência de aprovação. Nenhum iPhone está disponível ao agente nesta execução. A consulta USB retornou lista vazia; `devicectl` não está disponível nesta instalação de ferramentas Apple. O WebKit do Playwright não substitui aparelho físico ou Safari instalado.

## Ambiente necessário

- iPhone físico, modelo/versão de iOS/Safari registrados, com espaço e bateria conhecidos.
- Origem HTTPS de desenvolvimento acessível ao aparelho. Não expor o servidor em produção. A POC depende de Web Crypto (`crypto.subtle` e `crypto.randomUUID`); HTTP por IP da rede local não fornece o mesmo contexto seguro.
- A flag `VITE_MEAL_VISION_POC=true` só funciona no servidor de desenvolvimento. O build de produção exclui o laboratório mesmo com a flag; um build estático não habilita este ensaio.
- Pesos/rótulos de pesquisa verificados, selecionados explicitamente em Arquivos do iPhone. Não incluir esses pesos no produto nem configurar provedor remoto para facilitar o teste.
- Fotos públicas licenciadas do conjunto preparado e registro das suas atribuições. Para avaliar porção, usar também fotografias autorizadas com peso medido e receita conhecida; não preencher peso desconhecido por aproximação.

## Verificações a registrar no aparelho

1. Iniciar um registro manual sem foto e sem calorias; salvar, recarregar e consultar no dia correto. Verificar também zero explícito e item pendente.
2. Selecionar uma imagem autorizada pela galeria e pela câmera quando disponível. Conferir consentimento, erro de tipo/tamanho e redimensionamento; nenhuma coleta automática da galeria.
3. Carregar o modelo/rótulos e medir inicialização, cada análise, memória/pressão de memória quando observável e comportamento térmico. Registrar APIs indisponíveis como ausentes.
4. Executar as 24 imagens, incluindo feijoada, arroz/feijão/farofa e paisagens. Comparar alternativas e alimentos anotados por imagem; não tratar uma classe de prato como ingredientes separados identificados.
5. Recusar imagem sem comida ou candidato incorreto. Confirmar que análise sozinha não grava nem altera totais.
6. Escolher referência/preparo, informar gramas e confirmar. Salvar e editar porção; verificar recálculo de kcal/P/C/G e proveniência. Repetir a mesma análise/revisão sem duplicar consumo.
7. Fechar o editor durante preparação/análise, trocar de refeição e trocar de alternativa. Não deixar foto, confirmação ou resultado anterior reaparecer.
8. Com o laboratório carregado, ativar modo avião/desligar rede no aparelho e analisar nova foto autorizada. Confirmar edição e gravação manual offline, erros recuperáveis e preservação dos registros. Não substituir isso por `setOffline(true)` do Playwright.
9. Excluir/restaurar refeição e conferir totais; descartar foto e fechar editor. Verificar que pixels/modelos não aparecem no armazenamento do diário ou no export.
10. Registrar dia/fuso e horário perto da virada do dia, resultado dos testes, limitações, URLs/arquivos de evidência sem fotos pessoais em logs.

## Registro de resultado

Preencher somente após execução: modelo do aparelho, iOS/Safari, origem de teste, hashes dos artefatos, imagens e permissões, medições por análise, resultados/erros por item, dados de porção medida e comportamento offline. Até então, `physicalIPhoneTest` permanece `null` e a issue permanece em andamento.

## Acesso local preparado no Mac

Foi adicionado `scripts/dev-meal-vision-iphone.mjs`, sem modificar a configuração de produção. Execute da raiz do projeto:

```sh
node scripts/dev-meal-vision-iphone.mjs
```

O comando detecta um IPv4 privado, cria certificados temporários, inicia uma página HTTP de instalação do certificado na porta 5442 e a POC HTTPS na 5443. Imprime os links reais. `WINFIT_LAN_IP` permite selecionar a interface quando necessário. Mac e iPhone devem estar na mesma rede; mantenha o processo aberto. Ctrl+C encerra os dois servidores. Nenhum túnel público, deploy ou instalação de confiança no Mac é feito. O helper não configura login/sync neste servidor de teste.

No iPhone:

1. Abra no Safari o link `setup` impresso e baixe o certificado temporário.
2. Instale em Ajustes → Perfil Baixado → Instalar. Depois, em Ajustes → Geral → Sobre → Certificados Confiáveis, habilite a confiança da raiz “Winfit POC local - teste temporario”.
3. Volte à página e abra o link HTTPS de arquivos. Baixe ONNX, JSON e fotos `cc-23.jpg` e `cc-24.jpg`; conserve os arquivos no aparelho para o teste offline.
4. Abra o link da POC → Adicionar refeição → POC de reconhecimento local (pesquisa). Selecione ONNX e JSON, confirme pesquisa e carregue. Escolha a imagem de teste, confirme autorização local e analise.
5. Revise a correspondência: o classificador experimental erra pratos brasileiros. Para conferir apenas aritmética, referência Feijoada TACO com 150 g hipotéticos resulta em 175,5 kcal; 200 g resulta em 234 kcal. Esses gramas não são pesos medidos da fotografia.
6. Teste edição, exclusão/restauração e recarga. Para o teste offline, carregue modelo/tela antes; depois ative modo avião e desligue Wi-Fi, sem recarregar a página, e tente analisar e salvar. Registre o resultado real.
7. Após o teste, remova o perfil do certificado em Ajustes → Geral → VPN e Gerenciamento de Dispositivo. O certificado é temporário; não é necessário mantê-lo confiável.

Referências oficiais: [instalar perfil](https://support.apple.com/pt-br/102400), [habilitar confiança SSL/TLS](https://support.apple.com/pt-br/102390).

Validação do preparo no Mac: certificado/hostname/cadeia verificados com a CA local; contexto seguro e APIs Web Crypto presentes no endereço HTTPS; laboratório visível; downloads públicos acessíveis e chaves privadas não servidas. Teste `scripts/test-meal-vision-iphone-server.mjs` valida IP privado e lista explícita de arquivos. Isso valida o acesso de desenvolvimento, não registra teste físico em iPhone como executado.
