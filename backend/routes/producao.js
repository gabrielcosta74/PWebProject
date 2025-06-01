const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const Producao = require('../models/Producao');
const Instalacao = require('../models/Instalacao');
const Consumo = require('../models/Consumo'); 

// Registar produção
router.post('/registar', auth, checkRole('Cliente'), async (req, res) => {
  const { instalacaoId, valor, timestamp } = req.body;

  if (!instalacaoId || !valor) {
    return res.status(400).json({ message: 'Dados de produção incompletos' });
  }

  try {
    const instalacao = await Instalacao.findOne({ _id: instalacaoId, cliente: req.user.id });
    if (!instalacao) {
      return res.status(404).json({ message: 'Instalação não encontrada ou não pertence a este utilizador' });
    }

    const novaProducao = new Producao({
      instalacao: instalacao._id,
      cliente: req.user.id, 
      valor,
      timestamp: timestamp || Date.now()
    });

    await novaProducao.save();
    res.status(201).json({ message: 'Produção registada com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registar produção', error: err.message });
  }
});

// Última produção por instalação
router.get('/ultima/:instalacaoId', auth, checkRole('Cliente'), async (req, res) => {
  try {
    const instalacaoId = req.params.instalacaoId;

    const ultima = await Producao.findOne({ instalacao: instalacaoId })
      .sort({ timestamp: -1 });

    if (!ultima) return res.json({ valor: null });

    res.json({ valor: ultima.valor });
  } catch (err) {
    console.error('[ERRO ultima produção]', err);
    res.status(500).json({ message: 'Erro ao obter última produção' });
  }
});





// Produção mensal + créditos acumulados
router.get('/cliente', auth, checkRole('Cliente'), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar todas as instalações do cliente
    const instalacoes = await Instalacao.find({ cliente: userId });
    const instalacaoIds = instalacoes.map(inst => inst._id);

    // Buscar produção do mês atual
    const producoes = await Producao.find({
      instalacao: { $in: instalacaoIds },
      timestamp: { $gte: inicioMes }
    });

    // Buscar consumo do mês atual
    const consumos = await Consumo.find({
      cliente: userId,
      timestamp: { $gte: inicioMes }
    });

    const totalProducao = producoes.reduce((sum, p) => sum + p.valor, 0);
    const totalConsumo = consumos.reduce((sum, c) => sum + c.valor, 0);
    const creditos = totalProducao - totalConsumo;

    res.json({
      totalProducao: totalProducao.toFixed(2),
      totalConsumo: totalConsumo.toFixed(2),
      creditos: creditos.toFixed(2)
    });
  } catch (err) {
    console.error('[ERRO producao/cliente]', err);
    res.status(500).json({ message: 'Erro ao calcular dados do cliente' });
  }
});

// Atualizar produção (Gestor de Operações)
router.post('/atualizar', auth, checkRole('GestorOperacoes'), async (req, res) => {
  const { instalacaoId, valor, timestamp } = req.body;

  if (!instalacaoId || !valor) {
    return res.status(400).json({ message: 'Dados de produção incompletos' });
  }

  try {
    const instalacao = await Instalacao.findById(instalacaoId);
    if (!instalacao) {
      return res.status(404).json({ message: 'Instalação não encontrada' });
    }

    const clienteId = instalacao.cliente; 
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const producaoExistente = await Producao.findOne({
      instalacao: instalacaoId,
      timestamp: { $gte: inicioMes }
    });

    if (producaoExistente) {
      producaoExistente.valor = valor;
      producaoExistente.timestamp = timestamp || Date.now();
      await producaoExistente.save();
      return res.json({ message: 'Produção atualizada com sucesso' });
    } else {
      const novaProducao = new Producao({
        instalacao: instalacao._id,
        cliente: clienteId,
        valor,
        timestamp: timestamp || Date.now()
      });

      await novaProducao.save();
      return res.status(201).json({ message: 'Produção registada com sucesso' });
    }

  } catch (err) {
    console.error('[ERRO atualizar produção]', err);
    res.status(500).json({ message: 'Erro ao atualizar produção', error: err.message });
  }
});




module.exports = router;
