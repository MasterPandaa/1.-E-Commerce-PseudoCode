// PSEUDO: Middleware - Input validation aggregator
import { validationResult } from 'express-validator'

export const validate = (rules) => {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req)
      if (!result.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation error',
            details: result
              .array()
              .map((e) => ({ field: e.param, message: e.msg }))
          }
        })
      }
      next()
    }
  ]
}
