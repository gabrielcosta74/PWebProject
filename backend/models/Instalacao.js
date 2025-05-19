const mongoose = require('mongoose');

const InstalacaoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  localizacao: { type: String, required: true },
  capacidadeKW: { type: Number, required: true },
  marcaPainel: { type: String, required: true },
  status: { type: String, enum: ['Pendente', 'Aprovado'], default: 'Pendente' },
  certificado: { type: String } // caminho do ficheiro PDF
}, { timestamps: true });

module.exports = mongoose.model('Instalacao', InstalacaoSchema);
