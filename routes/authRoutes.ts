import express, { IRouter } from 'express'
const authRouter: IRouter = express.Router()
import { check } from 'express-validator'
import { login, getUser } from '../controllers/authController'
import sessionAuthentication from '../middleware/session'

authRouter.post(
	'/',
	[
		check('email').exists().notEmpty().isEmail().normalizeEmail(),
		check('password')
			.exists()
			.notEmpty()
			.trim()
			.isLength({ max: 30 }),
	],
	login
)
authRouter.get('/', sessionAuthentication, getUser)

export default authRouter
