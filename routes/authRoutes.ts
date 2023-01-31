import express, { IRouter, Router } from 'express'
const authRouter: IRouter = express.Router()
import { check } from 'express-validator'
import { login } from '../controllers/authController'

authRouter.post(
	'/',
	[
		check('email').exists().notEmpty(),
		check('password').exists().notEmpty(),
	],
	login
)

export default authRouter
