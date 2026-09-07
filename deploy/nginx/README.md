# Templates Nginx

`andrestudio.dev.br.conf` é o único template mantido para o domínio canônico. Ele repete os cabeçalhos de segurança nos blocos que também declaram `add_header Cache-Control`, porque a herança padrão do Nginx é interrompida quando o nível filho tem qualquer `add_header`.

`adigitalartes.duckdns.org.conf`, `andrestudiodev.duckdns.org.conf`, `default.conf` e `feemdeusribamar-redirect.conf` são referências legadas/alternativas e não fazem parte do pacote público. A versão do Nginx e o template efetivamente ativo ainda precisam ser confirmados antes de uma implantação.

Validação pendente: este ambiente não possui o binário `nginx`, portanto ainda falta executar `nginx -t` e conferir respostas HTTP locais para home, assets, 404, robots e sitemap com uma versão documentada.
