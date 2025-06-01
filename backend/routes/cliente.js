const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Instalacao = require('../models/Instalacao');
const Producao = require('../models/Producao');
const Consumo = require('../models/Consumo');
const checkRole = require('../middleware/checkRole');


// GET /api/cliente/resumo-mensal
router.get('/resumo-mensal', auth, async (req, res) => {
  try {
    const clienteId = req.user.id;

    // Data do início do mês atual
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Buscar instalações do cliente
    const instalacoes = await Instalacao.find({ cliente: clienteId });

    let producaoMes = 0;
    let consumoMes = 0;

    for (const inst of instalacoes) {
      const producoes = await Producao.find({
        instalacao: inst._id,
        timestamp: { $gte: inicioMes }
      });

      const consumos = await Consumo.find({
        instalacao: inst._id,
        timestamp: { $gte: inicioMes }
      });

      producaoMes += producoes.reduce((sum, p) => sum + p.valor, 0);
      consumoMes += consumos.reduce((sum, c) => sum + c.valor, 0);
    }

    res.json({
      producaoMes: producaoMes.toFixed(2),
      consumoMes: consumoMes.toFixed(2)
    });

  } catch (err) {
    console.error('[ERRO resumo-mensal]', err);
    res.status(500).json({ message: 'Erro ao obter resumo mensal' });
  }
});

router.get('/historico-anual', auth, checkRole('Cliente'), async (req, res) => {
    try {
      const clienteId = req.user.id;
      const anoAtual = new Date().getFullYear();
  
      const historico = {
        producao: Array(12).fill(0),
        consumo: Array(12).fill(0),
      };
  
      const producoes = await Producao.find({
        cliente: clienteId,
        timestamp: {
          $gte: new Date(`${anoAtual}-01-01T00:00:00Z`),
          $lt: new Date(`${anoAtual + 1}-01-01T00:00:00Z`)
        }
      });
  
      producoes.forEach(p => {
        const mes = new Date(p.timestamp).getMonth(); // 0-11
        historico.producao[mes] += p.valor;
      });
  
      const consumos = await Consumo.find({
        cliente: clienteId,
        timestamp: {
          $gte: new Date(`${anoAtual}-01-01T00:00:00Z`),
          $lt: new Date(`${anoAtual + 1}-01-01T00:00:00Z`)
        }
      });
  
      consumos.forEach(c => {
        const mes = new Date(c.timestamp).getMonth(); // 0-11
        historico.consumo[mes] += c.valor;
      });
  
      res.json(historico);
    } catch (err) {
      console.error('[ERRO HISTÓRICO ANUAL]', err);
      res.status(500).json({ message: 'Erro ao obter histórico anual' });
    }
  });

module.exports = router;
