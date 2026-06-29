# JC Launcher Lite / Pro — integração preparada

Base: `Painel-JC-APK-TV-main(20).zip`.

## O que já está encaixado

- Demonstração no início de `geradores/index.html`, aberta por padrão e recolhível.
- Versão Pro selecionada inicialmente; Lite e Pro continuam separadas.
- Downloads Lite/Pro por código e por link, usando `links_catalog`.
- IDs nativos para Clientes/Permissões, Manutenção e Relatórios.
- Painel `jc-box-control.html` com modo demonstrativo e conexão automática às futuras tabelas.
- Relatório próprio do Launcher em `painel-relatorios.html`.
- Limpezas próprias do Launcher em `painel-limpeza.html`.
- Gerenciador do Launcher dentro do `criador-html.html`.
- SQL preparatório em `supabase/12A-JC-LAUNCHER-LITE-PRO-BASE.sql`.

## Regra comercial preservada

1 crédito = 1 mês de licença para 1 Box. O módulo é independente do plano principal. O SQL desta etapa registra `credits_used = months`, mas o débito no saldo atual ainda está marcado como pendente para ser ligado com segurança na próxima etapa.

## Próximas etapas

1. Revisar e executar o SQL 12A.
2. Sincronizar Funções, Botões de Manutenção e Links no ADM.
3. Cadastrar URLs/códigos dos APKs Lite e Pro.
4. Ligar débito real de créditos, revenda e vitalícios.
5. Criar os projetos Android Lite e Pro e implementar vínculo, heartbeat, fila de comandos e retorno.

Nenhum SQL foi executado e nenhum APK foi criado nesta entrega.


## Limite desta entrega

Esta etapa integra o módulo em toda a interface e entrega a base SQL preparatória. Ela **não publica o SQL**, **não desconta créditos reais ainda**, **não envia comandos para uma Box real** e **não contém os projetos Android dos APKs Lite/Pro**. Esses pontos pertencem à próxima etapa, depois da validação visual e funcional deste painel.
