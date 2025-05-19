const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Instalacao = require('../models/Instalacao');

router.post('/', auth, checkRole('Cliente'), async (req, res) => {
  const { localizacao, capacidadeKW, marcaPainel } = req.body;

  if (!localizacao || !capacidadeKW || !marcaPainel) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  try {
    const novaInstalacao = new Instalacao({
      cliente: req.user.id,
      localizacao,
      capacidadeKW,
      marcaPainel
    });

    await novaInstalacao.save();
    res.status(201).json({ message: 'Instalação registada com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registar instalação', error: err.message });
  }
});

module.exports = router;
