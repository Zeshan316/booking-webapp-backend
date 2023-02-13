import express, { IRouter } from 'express'
const roleRouter: IRouter = express.Router()
import { check } from 'express-validator'

import {
	createRole,
	updateRole,
	getRoles,
	deleteRole,
} from '../controllers/rolesController'

roleRouter.get('/', getRoles)
roleRouter.post(
	'/',
	[
		check('name').exists().notEmpty().isString(),
		check('level').exists().isNumeric().notEmpty(),
	],
	createRole
)
roleRouter.patch(
	'/:roleId',
	[check('name').exists().notEmpty().isString()],
	updateRole
)

roleRouter.delete('/:roleId', deleteRole)

export default roleRouter
