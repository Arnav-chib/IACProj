const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        errors
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
  }),

  form: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    fields: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().required(),
        name: Joi.string().required(),
        required: Joi.boolean(),
        position: Joi.number(),
        groupId: Joi.string(),
        population: Joi.object({
          options: Joi.array(),
          multiple: Joi.boolean()
        })
      })
    ),
    groups: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        columns: Joi.number().required(),
        columnConfig: Joi.string().required(),
        rows: Joi.number().required(),
        canAddRows: Joi.boolean()
      })
    )
  }),

  formResponse: Joi.object({
    respondentInfo: Joi.object(),
    values: Joi.object().required()
  })
};

module.exports = {
  validate,
  schemas
}; 