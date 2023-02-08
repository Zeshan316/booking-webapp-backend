import express, { IRouter } from 'express'
const userRouter: IRouter = express.Router()
import { check } from 'express-validator'

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
		check('firstName').exists().notEmpty().isLength({ max: 60 }),
		check('lastName').optional(),
		check('email')
			.exists()
			.notEmpty()
			.isEmail()
			.isLength({ max: 60 }),
		check('password').exists().notEmpty().isLength({ max: 60 }),
	],
	createUser
)
userRouter.post('/uploadAvtar/:id', uploadProfile)
userRouter.patch('/:id', updateUser)
userRouter.delete('/:id', deleteUser)

export default userRouter
