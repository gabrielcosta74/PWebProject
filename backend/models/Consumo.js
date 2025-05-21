const mongoose = require('mongoose');

const consumoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  valor: Number, // kWh
  timestamp: Date
});

module.exports = mongoose.model('Consumo', consumoSchema);
