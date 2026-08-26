// src/validation.js
// Esquemas de validação centralizados (Joi) para toda entrada mutável da API,
// conforme a diretriz de "Validação de Inputs" antes de qualquer execução na
// camada de serviço.

const Joi = require('joi');

const noteSchema = Joi.object({
  nota: Joi.string().trim().min(1).max(500).required(),
});

const teamMemberSchema = Joi.object({
  nome: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().max(120).allow('').optional(),
  papel: Joi.string().trim().max(60).allow('').optional(),
});

const STATUS_VALIDOS = ['todo', 'doing', 'done'];
const PRIORIDADES_VALIDAS = ['baixa', 'media', 'alta'];

const taskSchema = Joi.object({
  titulo: Joi.string().trim().min(1).max(120).required(),
  descricao: Joi.string().trim().max(1000).allow('').optional(),
  prioridade: Joi.string().valid(...PRIORIDADES_VALIDAS).default('media'),
  assigneeId: Joi.string().trim().allow(null, '').optional(),
});

const taskStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUS_VALIDOS).required(),
});

const taskAssignSchema = Joi.object({
  assigneeId: Joi.string().trim().allow(null, '').optional(),
});

const chatMessageSchema = Joi.object({
  username: Joi.string().trim().min(1).max(40).required(),
  msg: Joi.string().trim().min(1).max(1000).required(),
});

// Middleware genérico de validação de req.body para rotas Express.
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        erro: 'Dados inválidos',
        detalhes: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

module.exports = {
  noteSchema,
  teamMemberSchema,
  taskSchema,
  taskStatusSchema,
  taskAssignSchema,
  chatMessageSchema,
  STATUS_VALIDOS,
  PRIORIDADES_VALIDAS,
  validateBody,
};
