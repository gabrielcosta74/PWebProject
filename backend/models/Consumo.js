const mongoose = require('mongoose');

const consumoSchema = new mongoose.Schema({
  instalacao: { type: mongoose.Schema.Types.ObjectId, ref: 'Instalacao', required: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  valor: Number,
  timestamp: Date
});

module.exports = mongoose.model('Consumo', consumoSchema);
