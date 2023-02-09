import express, { IRouter } from 'express'
const userRouter: IRouter = express.Router()
import { check, param, sanitize } from 'express-validator'

import {
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
	uploadProfile,
} from '../controllers/usersController'

userRouter.get('/', getUsers)
userRouter.get('/:id', getUser)
userRouter.post(
	'/',
	[
		check('firstName')
			.exists()
			.notEmpty()
			.isLength({ min: 2, max: 60 }),
		check('lastName')
			.exists()
			.notEmpty()
			.isLength({ min: 2, max: 60 }),
		check('email')
			.exists()
			.notEmpty()
			.isEmail()
			.normalizeEmail()
			.isLength({ max: 60 }),
		check('password').exists().notEmpty().isLength({ max: 60 }),
		check('roleId').exists().notEmpty(),
	],
	createUser
)
// userRouter.post('/uploadAvtar/:id', uploadProfile)
userRouter.patch(
	'/:id',
	[
		param('id').exists().notEmpty(),
		check('firstName').exists().notEmpty().isLength({ max: 60 }),
		check('lastName').exists().notEmpty().isLength({ max: 60 }),
	],
	[sanitize('id').trim()],
	updateUser
)
userRouter.delete(
	'/:id',
	[param('id').exists().notEmpty()],
	[sanitize('id').trim()],
	deleteUser
)

export default userRouter
