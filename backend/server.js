const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const instalacoesRoutes = require('./routes/instalacoes');
const tecnicoRoutes = require('./routes/tecnico');
const producaoRoutes = require('./routes/producao');
const consumoRoutes = require('./routes/consumo');
const gestorOperacoesRoutes = require('./routes/gestorOperacoes');
const clienteRoutes = require('./routes/cliente');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/energia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB ligado')).catch(console.error);

app.use('/api/auth', authRoutes);
app.use('/api/instalacoes', instalacoesRoutes);
app.use('/api/tecnico', tecnicoRoutes);
// Tornar os PDFs acessíveis 
app.use('/uploads', express.static('uploads'));
app.use('/api/producao', producaoRoutes);
app.use('/api/consumo', consumoRoutes);
app.use('/api/gestorOperacoes', gestorOperacoesRoutes);
app.use('/api/cliente', clienteRoutes);

app.listen(3000, () => console.log('Servidor na porta 3000'));
