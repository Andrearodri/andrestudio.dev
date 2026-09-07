# Publicação do site estático

O pacote público é gerado por uma allowlist explícita. A hospedagem deve publicar somente `build/public/`; o diretório `build/` também fica fora do controle de versão.

```sh
python3 scripts/build-public.py --self-test
python3 scripts/build-public.py
```

O segundo comando cria `build/public/` e o inventário `build/public-inventory.json`. O processo valida referências locais de HTML e CSS e falha quando um arquivo permitido não existe. Relatórios, documentos, configurações de editor/infraestrutura, Git, caches e backups não são percorridos.

Para acrescentar uma notícia, imagem ou vídeo, adicione o caminho exato à tupla `ALLOWED_FILES` em `scripts/build-public.py`, confirme a referência a partir de uma página pública e rode os dois comandos acima. A reconstrução remove o diretório de saída anterior; o teste integrado também verifica que arquivos extras antigos não sobrevivem e que um caminho allowlisted ausente interrompe o processo.

O pipeline ativo da hospedagem não foi confirmado neste ambiente. A verificação futura deve conferir que o diretório publicado é exatamente `build/public/` e que os cabeçalhos aplicados em produção correspondem a `_headers`.
