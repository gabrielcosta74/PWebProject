const mongoose = require('mongoose');

const producaoSchema = new mongoose.Schema({
  instalacao: { type: mongoose.Schema.Types.ObjectId, ref: 'Instalacao', required: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  valor: Number,
  timestamp: Date
});

module.exports = mongoose.model('Producao', producaoSchema);
