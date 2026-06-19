//FUNÇÕES DO ARQUIVO

//Recebe um arquivo Excel (.xlsx) em memória.
//Lê a primeira aba da planilha.
//Converte as linhas para JSON.
//Mapeia as colunas do relatório do Pipefy para os campos da tabela controle_cargas.
//Trata números, textos e datas.
//Insere os registros no PostgreSQL.
//Atualiza registros existentes usando pipefy_card_id como chave única.
//Só atualiza quando os dados realmente mudaram (raw_data IS DISTINCT FROM).
//Processa tudo em lotes de 200 registros para ganhar desempenho.

//RESUMO: Converte uma planilha exportada do Pipefy em registros da tabela controle_cargas.


const XLSX = require("xlsx");
const pool = require("../src/db/database");

const BATCH_SIZE = 200;

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  const n = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isNaN(n)
    ? null
    : n;
}

function texto(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) return null;

  return String(valor).trim();
}

function data(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  return valor;
}



async function importarCargas(buffer){

    const workbook = XLSX.read(
        buffer,
        { type: "buffer" }
    );

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const dados = XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: null,
          raw: false
        }
      );

      console.time("IMPORTACAO_TOTAL");


      console.log("Total linhas:", dados.length);

      const LIMITE_LINHAS = 50000;

       if (dados.length > LIMITE_LINHAS) {
           throw new Error(
           `Planilha excede o limite de ${LIMITE_LINHAS} linhas`
         );
      }

      const sql = `
        INSERT INTO controle_cargas (

          pipefy_card_id,
          titulo,
          fase,
          comprador,
          fornecedor,
          quantidade,
          peso,
          peso_quebra,
          tipo_suino,
          valor_total_bruto,
          valor_total_liquido,
          mortos_transporte,
          condenacoes_totais,
          condenacoes_parciais,
          nf_taxa_fornec,
          nf_taxa_compr,
          nota_fiscal_venda,
          pagamento_realizado,
          embarque,
          descarga,
          data_vencimento_financeiro,
          etiquetas,
          preco_kg,
          peso_medio,
          valor_mortos,
          valor_condenacoes,
          outros_descontos,
          transportadora,
          motorista,
          placa,
          responsaveis,
          observacoes_negociacao,
          frete,
          prazo_negociado,
          vendedor_comprador,
          vendedor_fornecedor,
          finalidade_gta,
          local_abate,
          numero_gta,
          embutido_cozido,
          senar_funrural,
          verificacao,
          crm,
          nota_fiscal,
          cnpj,
          documentacao,
          verificacao_peso,
          verificacao_condenacoes,
          verificacao_mortalidade,
          observacao_pagamento,
          motivo_cancelamento,
          responsavel,
          criado_em,
          raw_data

        )
        VALUES
      `;

      let importados = 0;

      for (let i = 0; i < dados.length; i += BATCH_SIZE) {

        console.time(`LOTE_${i}`);

        const lote = dados.slice(
          i,
          i + BATCH_SIZE
        );

        const valores = [];
        const placeholders = [];

        lote.forEach((carga, index) => {

          const base = index * 54;

          placeholders.push(`(

            $${base + 1},
            $${base + 2},
            $${base + 3},
            $${base + 4},
            $${base + 5},
            $${base + 6},
            $${base + 7},
            $${base + 8},
            $${base + 9},
            $${base + 10},
            $${base + 11},
            $${base + 12},
            $${base + 13},
            $${base + 14},
            $${base + 15},
            $${base + 16},
            $${base + 17},
            $${base + 18},
            $${base + 19},
            $${base + 20},
            $${base + 21},
            $${base + 22},
            $${base + 23},
            $${base + 24},
            $${base + 25},
            $${base + 26},
            $${base + 27},
            $${base + 28},
            $${base + 29},
            $${base + 30},
            $${base + 31},
            $${base + 32},
            $${base + 33},
            $${base + 34},
            $${base + 35},
            $${base + 36},
            $${base + 37},
            $${base + 38},
            $${base + 39},
            $${base + 40},
            $${base + 41},
            $${base + 42},
            $${base + 43},
            $${base + 44},
            $${base + 45},
            $${base + 46},
            $${base + 47},
            $${base + 48},
            $${base + 49},
            $${base + 50},
            $${base + 51},
            $${base + 52},
            $${base + 53},
            $${base + 54}

          )`);


          valores.push(

            Number(carga["Código"]),

            texto(carga["Título"]),
            texto(carga["Fase atual"]),
            texto(carga["Comprador"]),
            texto(carga["Fornecedor"]),

            numero(carga["Quantidade"]),
            numero(carga["Peso"]),
            numero(carga["Peso Quebra"]),
            texto(carga["Tipo Suíno"]),

            numero(carga["Valor Total Bruto"]),
            numero(carga["Valor Total Líquido"]),

            numero(carga["Mortos em transporte"]),
            numero(carga["Condenações Totais"]),
            numero(carga["Condenações Parciais"]),

            texto(carga["NF Taxa Fornec."]),
            texto(carga["NF Taxa Compr."]),

            texto(carga["N Nota de Venda"]),
            texto(carga["Pagamento realizado?"]),

            data(carga["Embarque"]),
            data(carga["Descarga"]),
            data(carga["Data Vencimento Financeiro"]),

            texto(carga["Etiquetas"]),

            numero(carga["Preço / kg"]),
            numero(carga["Peso Médio"]),

            numero(carga["Valor dos Mortos"]),
            numero(carga["Valor das Condenações"]),
            numero(carga["Outros Descontos"]),

            texto(carga["Transportadora"]),
            texto(carga["Motorista"]),
            texto(carga["Placa"]),

            texto(carga["Responsáveis"]),
            texto(carga["Observações da Negociação"]),

            texto(carga["Frete"]),
            texto(carga["Prazo Negociado"]),

            texto(carga["Vend. Comprador"]),
            texto(carga["Vend. Fornecedor"]),

            texto(carga["Finalidade da GTA"]),
            texto(carga["Local de Abate"]),
            texto(carga["Numero da GTA"]),

            texto(carga["Embutido / Cozido"]),

            numero(carga["Senar / Funrural"]),

            texto(carga["Verificação"]),
            texto(carga["CRM"]),

            texto(carga["Nota Fiscal"]),
            texto(carga["CNPJ"]),

            texto(carga["Documentação"]),
            texto(carga["Peso"]),
            texto(carga["Condenações"]),
            texto(carga["Mortalidade"]),

            texto(carga["Observação pagamento"]),
            texto(carga["Motivo do Cancelamento"]),

            texto(carga["Responsável"]),

            data(carga["Criado em"]),

            JSON.stringify(carga)

          );

        });

        const sqlFinal =
          sql +
          placeholders.join(",") +
          `
          ON CONFLICT (pipefy_card_id)
          DO UPDATE SET

            titulo = EXCLUDED.titulo,
            fase = EXCLUDED.fase,
            comprador = EXCLUDED.comprador,
            fornecedor = EXCLUDED.fornecedor,
            quantidade = EXCLUDED.quantidade,
            peso = EXCLUDED.peso,
            peso_quebra = EXCLUDED.peso_quebra,
            tipo_suino = EXCLUDED.tipo_suino,
            valor_total_bruto = EXCLUDED.valor_total_bruto,
            valor_total_liquido = EXCLUDED.valor_total_liquido,
            mortos_transporte = EXCLUDED.mortos_transporte,
            condenacoes_totais = EXCLUDED.condenacoes_totais,
            condenacoes_parciais = EXCLUDED.condenacoes_parciais,
            nf_taxa_fornec = EXCLUDED.nf_taxa_fornec,
            nf_taxa_compr = EXCLUDED.nf_taxa_compr,
            nota_fiscal_venda = EXCLUDED.nota_fiscal_venda,
            pagamento_realizado = EXCLUDED.pagamento_realizado,
            embarque = EXCLUDED.embarque,
            descarga = EXCLUDED.descarga,
            data_vencimento_financeiro = EXCLUDED.data_vencimento_financeiro,
            etiquetas = EXCLUDED.etiquetas,
            preco_kg = EXCLUDED.preco_kg,
            peso_medio = EXCLUDED.peso_medio,
            valor_mortos = EXCLUDED.valor_mortos,
            valor_condenacoes = EXCLUDED.valor_condenacoes,
            outros_descontos = EXCLUDED.outros_descontos,
            transportadora = EXCLUDED.transportadora,
            motorista = EXCLUDED.motorista,
            placa = EXCLUDED.placa,
            responsaveis = EXCLUDED.responsaveis,
            observacoes_negociacao = EXCLUDED.observacoes_negociacao,
            frete = EXCLUDED.frete,
            prazo_negociado = EXCLUDED.prazo_negociado,
            vendedor_comprador = EXCLUDED.vendedor_comprador,
            vendedor_fornecedor = EXCLUDED.vendedor_fornecedor,
            finalidade_gta = EXCLUDED.finalidade_gta,
            local_abate = EXCLUDED.local_abate,
            numero_gta = EXCLUDED.numero_gta,
            embutido_cozido = EXCLUDED.embutido_cozido,
            senar_funrural = EXCLUDED.senar_funrural,
            verificacao = EXCLUDED.verificacao,
            crm = EXCLUDED.crm,
            nota_fiscal = EXCLUDED.nota_fiscal,
            cnpj = EXCLUDED.cnpj,
            documentacao = EXCLUDED.documentacao,
            verificacao_peso = EXCLUDED.verificacao_peso,
            verificacao_condenacoes = EXCLUDED.verificacao_condenacoes,
            verificacao_mortalidade = EXCLUDED.verificacao_mortalidade,
            observacao_pagamento = EXCLUDED.observacao_pagamento,
            motivo_cancelamento = EXCLUDED.motivo_cancelamento,
            responsavel = EXCLUDED.responsavel,
            criado_em = EXCLUDED.criado_em,
            raw_data = EXCLUDED.raw_data

            WHERE controle_cargas.raw_data
            IS DISTINCT FROM EXCLUDED.raw_data
        `;

        await pool.query(
          sqlFinal,
          valores
        );

          console.timeEnd(`LOTE_${i}`);

        importados += lote.length;

        console.log(
          `Importados ${importados}/${dados.length}`
        );
      }

      console.timeEnd("IMPORTACAO_TOTAL");

      return {
        sucesso: true,
        importados
    };

}

module.exports = importarCargas;