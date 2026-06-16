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



async function importarFretes(buffer){

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
        INSERT INTO contratacao_fretes (

          pipefy_card_id,
            titulo,
            fase,
            etiquetas,
            data_vencimento,
            responsaveis,
            necessidade,
            transportadora,
            contratante,
            cargas_relacionadas,
            data_carregamento,
            preco_frete_acertado,
            prazo_negociado,
            observacoes,
            balanca_1,
            granja_1,
            balanca_2,
            granja_2,
            balanca_3,
            granja_3,
            balanca_destino,
            localizacao_destino,
            km_estimado,
            data_descarga,
            placa,
            km_realizado,
            numero_cte,
            numero_nota_fiscal,
            valor_final_servico,
            pagamento,
            nf_servico,
            responsavel,
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

          const base = index * 33;

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
            $${base + 33}
            
          )`);

          valores.push(

             Number(carga["Código"]),

             texto(carga["Título"]),
             texto(carga["Fase atual"]),
             texto(carga["Etiquetas"]),

             data(carga["Data de vencimento"]),

             texto(carga["Responsáveis"]),

             texto(carga["Necessidade"]),
             texto(carga["Transportadora"]),
             texto(carga["Contratante"]),
             texto(carga["Cargas Relacionadas"]),

             data(carga["Data e Hora de Carregamento"]),

             numero(carga["Preço Frete Acertado"]),
             numero(carga["Prazo Negociado"]),

             texto(carga["Observações"]),

             texto(carga["1 - Balança"]),
             texto(carga["1 - Granja"]),

             texto(carga["2 - Balança"]),
             texto(carga["2 - Granja"]),

             texto(carga["3 - Balança"]),
             texto(carga["3 - Granja"]),

             texto(carga["Balança Destino:"]),
             texto(carga["Localização do Destino:"]),

             numero(carga["Km de Frete Estimada"]),

             data(carga["Data e Hora de descarga"]),

             texto(carga["Placa"]),

             numero(carga["Km de Frete Realizado"]),
 
             texto(carga["Nº CTe"]),
             texto(carga["Nº Nota Fiscal"]),

             numero(carga["Valor Final do Serviço"]),

             texto(carga["Pagamento"]),

             texto(carga["NF Serviço"]),

             texto(carga["Responsável"]),

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
            etiquetas = EXCLUDED.etiquetas,
            data_vencimento = EXCLUDED.data_vencimento,
            responsaveis = EXCLUDED.responsaveis,

            necessidade = EXCLUDED.necessidade,
            transportadora = EXCLUDED.transportadora,
            contratante = EXCLUDED.contratante,
            cargas_relacionadas = EXCLUDED.cargas_relacionadas,

            data_carregamento = EXCLUDED.data_carregamento,

            preco_frete_acertado = EXCLUDED.preco_frete_acertado,
            prazo_negociado = EXCLUDED.prazo_negociado,

            observacoes = EXCLUDED.observacoes,

            balanca_1 = EXCLUDED.balanca_1,
            granja_1 = EXCLUDED.granja_1,

            balanca_2 = EXCLUDED.balanca_2,
            granja_2 = EXCLUDED.granja_2,

            balanca_3 = EXCLUDED.balanca_3,
            granja_3 = EXCLUDED.granja_3,

            balanca_destino = EXCLUDED.balanca_destino,
            localizacao_destino = EXCLUDED.localizacao_destino,

            km_estimado = EXCLUDED.km_estimado,

            data_descarga = EXCLUDED.data_descarga,

            placa = EXCLUDED.placa,

            km_realizado = EXCLUDED.km_realizado,

            numero_cte = EXCLUDED.numero_cte,
            numero_nota_fiscal = EXCLUDED.numero_nota_fiscal,

            valor_final_servico = EXCLUDED.valor_final_servico,

            pagamento = EXCLUDED.pagamento,

            nf_servico = EXCLUDED.nf_servico,

            responsavel = EXCLUDED.responsavel,

            raw_data = EXCLUDED.raw_data

         WHERE contratacao_fretes.raw_data
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

module.exports = importarFretes;