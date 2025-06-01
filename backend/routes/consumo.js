// routes/consumo.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Consumo = require('../models/Consumo');
const Instalacao = require('../models/Instalacao');

// Atualizar consumo
router.post('/atualizar', auth, checkRole('GestorOperacoes'), async (req, res) => {
  const { instalacaoId, valor, timestamp } = req.body;

  if (!instalacaoId || !valor) {
    return res.status(400).json({ message: 'Dados de consumo incompletos' });
  }

  try {
    const instalacao = await Instalacao.findOne({ _id: instalacaoId});
    if (!instalacao) {
      return res.status(404).json({ message: 'Instalação não encontrada ou não pertence a este cliente' });
    }

    const consumoExistente = await Consumo.findOne({ instalacao: instalacaoId }).sort({ timestamp: -1 });

    if (!consumoExistente) {
      // Se ainda não existe consumo, criar um novo
      const novoConsumo = new Consumo({
        instalacao: instalacaoId,
        cliente: req.user.id,
        valor,
        timestamp: timestamp || Date.now()
      });
      await novoConsumo.save();
      return res.status(201).json({ message: 'Consumo registado com sucesso' });
    }

    // Atualizar o último
    consumoExistente.valor = valor;
    consumoExistente.timestamp = timestamp || Date.now();
    await consumoExistente.save();

    res.json({ message: 'Consumo atualizado com sucesso' });
  } catch (err) {
    console.error('[ERRO CONSUMO]', err);
    res.status(500).json({ message: 'Erro ao atualizar consumo' });
  }
});

// Último consumo por instalação
router.get('/ultima/:instalacaoId', auth, checkRole('Cliente'), async (req, res) => {
    try {
      const instalacaoId = req.params.instalacaoId;
  
      const ultimo = await Consumo.findOne({ instalacao: instalacaoId })
        .sort({ timestamp: -1 });
  
      if (!ultimo) return res.json({ valor: null });
  
      res.json({ valor: ultimo.valor });
    } catch (err) {
      console.error('[ERRO ultima consumo]', err);
      res.status(500).json({ message: 'Erro ao obter último consumo' });
    }
  });
  

module.exports = router;
