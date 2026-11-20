// Dados FICTÍCIOS da demonstração do Scout. Nenhum anunciante real.
// Os sinais imitam o que a Biblioteca de Anúncios da Meta mostra publicamente:
// dias no ar, variações do criativo, anúncios ativos da página e criativos novos em 14 dias.
// A Biblioteca não mostra gasto, alcance, cliques nem vendas, e a demonstração também não.

export const NICHOS = {
  academia: {
    nome: 'Academias',
    anuncios: [
      {
        id: 'a1', anunciante: 'Anunciante A (fictício)', formato: 'vídeo', dias: 214, variacoes: 6, ativosPagina: 9, novos14: 3,
        gancho: '“Você não precisa de motivação. Precisa de um horário que caiba na sua semana.”',
        esqueleto: ['Gancho: quebra a ideia de que falta força de vontade', 'Problema: rotina corrida, desistência no 2º mês', 'Prova: aluna real mostrando a agenda dela', 'Oferta: aula experimental com horário marcado', 'Chamada: “escolha seu horário no WhatsApp”'],
        angulo: 'Rotina possível (tempo, não força de vontade)'
      },
      {
        id: 'a2', anunciante: 'Anunciante B (fictício)', formato: 'vídeo', dias: 132, variacoes: 4, ativosPagina: 5, novos14: 1,
        gancho: '“3 erros que fazem você treinar e não ver diferença no espelho.”',
        esqueleto: ['Gancho: lista de erros', 'Problema: treina e não vê resultado', 'Prova: professor explicando cada erro', 'Oferta: avaliação física gratuita', 'Chamada: “agende sua avaliação”'],
        angulo: 'Educativo (erros comuns)'
      },
      {
        id: 'a3', anunciante: 'Anunciante C (fictício)', formato: 'imagem', dias: 61, variacoes: 2, ativosPagina: 2, novos14: 0,
        gancho: '“Matrícula com 50% de desconto só esta semana.”',
        esqueleto: ['Gancho: desconto', 'Oferta: preço reduzido', 'Chamada: “garanta sua vaga”'],
        angulo: 'Preço e promoção'
      },
      {
        id: 'a4', anunciante: 'Anunciante A (fictício)', formato: 'vídeo', dias: 9, variacoes: 3, ativosPagina: 9, novos14: 3,
        gancho: '“Começou e parou de novo? Aqui o primeiro mês é com acompanhamento.”',
        esqueleto: ['Gancho: identificação com quem já desistiu', 'Problema: começar sozinho', 'Prova: bastidor do acompanhamento', 'Oferta: primeiro mês acompanhado', 'Chamada: “fale com a equipe”'],
        angulo: 'Recomeço sem culpa'
      },
      {
        id: 'a5', anunciante: 'Anunciante D (fictício)', formato: 'imagem', dias: 18, variacoes: 1, ativosPagina: 1, novos14: 1,
        gancho: '“Estrutura completa, ar-condicionado e estacionamento.”',
        esqueleto: ['Gancho: lista de estrutura', 'Chamada: “venha conhecer”'],
        angulo: 'Estrutura física'
      }
    ],
    lacunas: ['Ninguém mostra o resultado do aluno comum depois de 90 dias (só antes/depois extremos).', 'Ninguém fala com quem tem vergonha de começar na frente dos outros.'],
    roteiro: {
      titulo: 'Exemplo de roteiro modelado: “Primeiro dia sem vergonha”',
      cenas: ['0–3s · Texto na tela: “Medo de ser o único iniciante?” (rosto do professor, câmera na mão)', '3–10s · Professor: “Todo mundo aqui já foi o mais perdido da sala. Por isso o primeiro treino é só seu e meu.”', '10–20s · Bastidor: recepção, ficha simples, aparelho explicado devagar', '20–27s · Prova: aluno real (com autorização) contando como foi o primeiro dia', '27–30s · Chamada: “Marque seu primeiro treino guiado pelo WhatsApp.”'],
      nota: 'Roteiro novo, com ângulo que os concorrentes não usam. Não copia texto, cena nem gancho de ninguém.'
    }
  },
  odonto: {
    nome: 'Clínicas odontológicas',
    anuncios: [
      {
        id: 'o1', anunciante: 'Anunciante E (fictício)', formato: 'vídeo', dias: 287, variacoes: 8, ativosPagina: 11, novos14: 2,
        gancho: '“Por que o seu dente sensível piora no inverno?”',
        esqueleto: ['Gancho: pergunta curiosa', 'Explicação: dentista em linguagem simples', 'Prova: consultório e equipamentos reais', 'Oferta: avaliação', 'Chamada: “agende pelo WhatsApp”'],
        angulo: 'Educativo (dúvida do dia a dia)'
      },
      {
        id: 'o2', anunciante: 'Anunciante F (fictício)', formato: 'vídeo', dias: 156, variacoes: 5, ativosPagina: 4, novos14: 1,
        gancho: '“Medo de dentista? Veja como é a primeira consulta aqui.”',
        esqueleto: ['Gancho: medo', 'Prova: tour pela sala, voz calma', 'Oferta: primeira consulta sem procedimento', 'Chamada: “converse com a recepção”'],
        angulo: 'Acolhimento do medo'
      },
      {
        id: 'o3', anunciante: 'Anunciante G (fictício)', formato: 'imagem', dias: 44, variacoes: 1, ativosPagina: 2, novos14: 0,
        gancho: '“Clareamento em até 10x.”',
        esqueleto: ['Gancho: parcelamento', 'Chamada: “saiba mais”'],
        angulo: 'Preço e parcelamento'
      },
      {
        id: 'o4', anunciante: 'Anunciante E (fictício)', formato: 'vídeo', dias: 12, variacoes: 2, ativosPagina: 11, novos14: 2,
        gancho: '“O que a gente olha numa criança de 3 anos na primeira consulta.”',
        esqueleto: ['Gancho: curiosidade dos pais', 'Explicação: odontopediatra', 'Oferta: consulta infantil', 'Chamada: “agende”'],
        angulo: 'Educativo (pais)'
      }
    ],
    lacunas: ['Ninguém explica quanto tempo leva cada tratamento (a dúvida mais comum no WhatsApp).', 'Ninguém mostra a recepção e o atendimento antes da cadeira.'],
    roteiro: {
      titulo: 'Exemplo de roteiro modelado: “Quanto tempo leva?”',
      cenas: ['0–3s · Texto na tela: “Quantas consultas para resolver?”', '3–15s · Dentista responde para 3 casos comuns, sem prometer resultado', '15–24s · Recepção mostrando como marca as sessões', '24–30s · Chamada: “Mande sua dúvida no WhatsApp que a gente responde.”'],
      nota: 'Saúde é área regulada: o cliente confirma o texto com as regras do conselho antes de publicar.'
    }
  },
  restaurante: {
    nome: 'Restaurantes e delivery',
    anuncios: [
      {
        id: 'r1', anunciante: 'Anunciante H (fictício)', formato: 'vídeo', dias: 176, variacoes: 7, ativosPagina: 6, novos14: 4,
        gancho: '“O prato que sai mais aqui não está no cardápio.”',
        esqueleto: ['Gancho: segredo da casa', 'Prova: preparo em close, som da chapa', 'Oferta: pedir pelo nome no WhatsApp', 'Chamada: “peça o prato secreto”'],
        angulo: 'Curiosidade (bastidor da cozinha)'
      },
      {
        id: 'r2', anunciante: 'Anunciante I (fictício)', formato: 'vídeo', dias: 95, variacoes: 3, ativosPagina: 3, novos14: 1,
        gancho: '“Almoço em 12 minutos ou a sobremesa é por nossa conta.”',
        esqueleto: ['Gancho: promessa de tempo', 'Prova: cronômetro real no balcão', 'Oferta: sobremesa', 'Chamada: “venha no horário do almoço”'],
        angulo: 'Rapidez'
      },
      {
        id: 'r3', anunciante: 'Anunciante J (fictício)', formato: 'imagem', dias: 30, variacoes: 1, ativosPagina: 1, novos14: 0,
        gancho: '“Peça já no app.”',
        esqueleto: ['Foto do prato', 'Chamada: “peça agora”'],
        angulo: 'Foto do produto'
      }
    ],
    lacunas: ['Ninguém mostra quem cozinha (rosto e história da equipe).', 'Ninguém fala de pedido para grupo ou empresa.'],
    roteiro: {
      titulo: 'Exemplo de roteiro modelado: “Quem faz o seu almoço”',
      cenas: ['0–3s · Close da cozinheira olhando para a câmera: “Faço esse feijão há 14 anos.”', '3–15s · Preparo do prato do dia com som ambiente', '15–25s · Balcão cheio, cliente recebendo', '25–30s · Chamada: “O cardápio do dia sai às 10h no WhatsApp.”'],
      nota: 'Números e histórias só se forem verdadeiros e confirmados pelo cliente.'
    }
  }
};
