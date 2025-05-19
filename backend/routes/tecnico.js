const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const upload = require('../middleware/upload');
const Instalacao = require('../models/Instalacao');
const User = require('../models/User');

// Listar todas as instalações pendentes
router.get('/pendentes', auth, checkRole('Tecnico'), async (req, res) => {
  const instalacoes = await Instalacao.find({ status: 'Pendente' }).populate('cliente', 'username');
  res.json(instalacoes);
});

// Aprovar instalação com certificado
router.post('/aprovar/:id', auth, checkRole('Tecnico'), upload.single('certificado'), async (req, res) => {
  try {
    const instalacao = await Instalacao.findById(req.params.id);
    if (!instalacao) return res.status(404).json({ message: 'Instalação não encontrada' });

    instalacao.status = 'Aprovado';
    instalacao.certificado = req.file.path;
    await instalacao.save();

    res.json({ message: 'Instalação aprovada com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao aprovar instalação', error: err.message });
  }
});

module.exports = router;
