import express from 'express'
import { getMember } from '../controllers/member_controller.js'
import { validateId, validateRequestSchema } from '../middleware/validation_middleware.js'

const memberRoutes = express.Router()

// GET route to get one member with id
memberRoutes.get('/:id', 
    validateId,
    validateRequestSchema,
    getMember
    )

export default memberRoutes
