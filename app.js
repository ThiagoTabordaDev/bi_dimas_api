const express = require('express');
// const dotenv = require('dotenv');
const routes = require('./routes');
const cors = require('cors'); 


// dotenv.config({ path: '/.env' }) // Carrega as variáveis de ambiente do arquivo .env

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json()); // Middleware para parse de JSON
app.use('/', routes); // Usando as rotas do arquivo routes.js

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});