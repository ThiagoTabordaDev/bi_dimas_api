const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();

// Configuração da conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados MySQL");
});

const query = async (query) => {
  return await new Promise((resolve, reject) => {
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
        return [];
      }
      resolve(results || []);
    });
  });
};
const getEnterprise = async () => {
  return await query(`SELECT 
    idempresa,
    concat(idempresa, ' - ', nomefantasia) as nome
    FROM empresa`);
};

const getSales = async (dataInicial, dataFinal) => {
  return await query(`SELECT 
    idempresa,
    sum(cupom) as cupom,
    sum(cmv) as cmv,
    sum(custo) as custo,
    sum(total) as venda,
    sum(total)/sum(cupom) as ticket,
    case sum(total) when 0 then 0 else cast((sum(total) - sum(cmv)) / sum(total) as decimal(15,4)) end as margem
  FROM vendascupom WHERE datamovimento BETWEEN ${dataInicial} AND ${dataFinal}
  group by idempresa
  order by idempresa`);
};

const getBuy = async (dataInicial, dataFinal) => {
  await query(`SELECT 
    idempresa,
    sum(total) as compras
  FROM compras WHERE datamovimento BETWEEN ${dataInicial} AND ${dataFinal}
  group by idempresa
  order by idempresa`);
};

const getReturnSales = async (dataInicial, dataFinal) => {
  return await query(`SELECT 
    idempresa,
    sum(total) as devolucaoVendas
  FROM devolucaovenda WHERE datamovimento BETWEEN ${dataInicial} AND ${dataFinal}
  group by idempresa
  order by idempresa`);
};

const getReturnBuy = async (dataInicial, dataFinal) => {
  return await query(`SELECT 
    idempresa,
    sum(total) as devolucaoCompra
  FROM devolucaocompra WHERE datamovimento BETWEEN ${dataInicial} AND ${dataFinal}
  group by idempresa
  order by idempresa`);
};

const getLost = async (dataInicial, dataFinal) => {
  return await query(`SELECT 
    idempresa,
    sum(total) as perda
  FROM perdas WHERE datamovimento BETWEEN ${dataInicial} AND ${dataFinal}
  group by idempresa
  order by idempresa`);
};

const buildJson = async (dataInicial, dataFinal) => {
  const enterprises = await getEnterprise();
  const sales = await getSales(dataInicial, dataFinal);
  const buy = await getBuy(dataInicial, dataFinal);
  const returnSales = await getReturnSales(dataInicial, dataFinal);
  const returnBuy = await getReturnBuy(dataInicial, dataFinal);
  const lost = await getLost(dataInicial, dataFinal);
  const enterprisesJson = enterprises.map((enterprise) => {
    const sale = sales?.find((sale) => sale.idempresa === enterprise.idempresa);
    const buyItem = buy?.find(
      (buyItem) => buyItem.idempresa === enterprise.idempresa
    );
    const returnSalesItem = returnSales?.find(
      (returnSalesItem) => returnSalesItem.idempresa === enterprise.idempresa
    );
    const returnBuyItem = returnBuy?.find(
      (returnBuyItem) => returnBuyItem.idempresa === enterprise.idempresa
    );
    const lostItem = lost?.find(
      (lostItem) => lostItem.idempresa === enterprise.idempresa
    );
    return {
      ...enterprise,
      ...sale,
      ...buyItem,
      ...returnSalesItem,
      ...returnBuyItem,
      ...lostItem,
    };
  });
  return enterprisesJson;
};

router.get("/getall", async (req, res) => {
  const { dataInicial, dataFinal } = req.query;
  const enterprisesData = await buildJson(dataInicial, dataFinal);
  res.json(enterprisesData);
});

module.exports = router;
