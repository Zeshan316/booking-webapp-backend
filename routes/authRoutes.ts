import express, { IRouter } from 'express'
const authRouter: IRouter = express.Router()
import { check } from 'express-validator'
import { login, getUser } from '../controllers/authController'
import sessionAuthentication from '../middleware/session'

authRouter.post(
	'/',
	[
		check('email').exists().notEmpty(),
		check('password').exists().notEmpty(),
	],
	login
)
authRouter.get('/', sessionAuthentication, getUser)

export default authRouter
