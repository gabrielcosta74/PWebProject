const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/energia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB ligado')).catch(console.error);

app.use('/api/auth', authRoutes);

app.listen(3000, () => console.log('Servidor na porta 3000'));
