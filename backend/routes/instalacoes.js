const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Instalacao = require('../models/Instalacao');
const Producao = require('../models/Producao');
const Consumo = require('../models/Consumo');

// Criar nova instalação
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

// Obter instalações do cliente logado com dados mensais
router.get('/', auth, checkRole('Cliente'), async (req, res) => {
  try {
    const clienteId = req.user.id;
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const instalacoes = await Instalacao.find({ cliente: clienteId });

    const instalacoesDetalhadas = await Promise.all(instalacoes.map(async (inst) => {
      const producoes = await Producao.find({
        instalacao: inst._id,
        timestamp: { $gte: inicioMes }
      });

      const consumos = await Consumo.find({
        instalacao: inst._id,
        timestamp: { $gte: inicioMes }
      });

      const producaoMes = producoes.reduce((sum, p) => sum + p.valor, 0);
      const consumoMes = consumos.reduce((sum, c) => sum + c.valor, 0);

      return {
        _id: inst._id,
        localizacao: inst.localizacao,
        capacidadeKW: inst.capacidadeKW,
        marcaPainel: inst.marcaPainel,
        status: inst.status,
        certificado: inst.certificado,
        producaoMes: producaoMes.toFixed(2),
        consumoMes: consumoMes.toFixed(2)
      };
    }));

    res.json(instalacoesDetalhadas);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter instalações', error: err.message });
  }
});


module.exports = router;
