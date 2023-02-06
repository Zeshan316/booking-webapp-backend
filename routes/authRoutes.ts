import express, { IRouter } from 'express'
const authRouter: IRouter = express.Router()
import { check } from 'express-validator'
import { login, getUser } from '../controllers/authController'

authRouter.post(
	'/',
	[
		check('email').exists().notEmpty(),
		check('password').exists().notEmpty(),
	],
	login
)
authRouter.get('/', getUser)

export default authRouter
