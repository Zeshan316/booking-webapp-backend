import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import thinky from '../config/db'
import { User, Password, Role, UserRole } from '../models/All'
import { validationResult } from 'express-validator'

const { r } = thinky

const login = async (req: Request, res: Response) => {
	try {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			res.status(400).json({
				message: `${errors.array()[0]['msg']} for ${
					errors.array()[0]['param']
				}`,
			})
			return
		}

		const { email, password } = req.body

		const user: userModelProps[] = await r
			.table(User.getTableName())
			.filter({ email, isActive: 1, deletedAt: null })
			.run()

		const { email: userEmail = false, id: userId = null } =
			user[0] || {}

		if (!userEmail) {
			res
				.status(200)
				.json({ message: 'Email or password is invalid', data: [] })
			return
		}

		const userPasswordData: userPasswordModelProps[] = await r
			.table(Password.getTableName())
			.eqJoin('userId', r.table(User.getTableName()))
			.zip()
			.filter(r.row('userId').eq(userId))
			.run()

		const { password: userPassword = false } =
			userPasswordData[0] || {}

		if (!userPassword) {
			res
				.status(200)
				.json({ message: 'Email or password is invalid', data: [] })
			return
		}

		if (!bcrypt.compareSync(password, userPassword)) {
			res.status(400).json({
				message: 'Email or password do not match',
				data: [],
			})
			return
		}

		// Get user role
		const userRole: GenericObject = await _getUserRole(
			userId as string
		)

		// Create a token
		const payload = {
			user: {
				id: userId,
				role: userRole['name'],
				roleId: userRole['id'],
			},
		}
		const token = await jwt.sign(
			payload,
			process.env.JWT_SECRET as string,
			{
				expiresIn: '100m',
			}
		)

		res.status(200).json({
			message: 'Token generated',
			data: {
				token,
				user: { ...user[0], role: userRole },
			},
		})
	} catch (error: any) {
		res.status(500).json({ message: error.toString() })
	}
}

const _getUserRole = async (
	userId: string
): Promise<GenericObject> => {
	const userRole = await r
		.table(UserRole.getTableName())
		.filter(r.row('userId').eq(userId))
		.eqJoin('userId', r.table(User.getTableName()))
		.zip()
		.eqJoin('roleId', r.table(Role.getTableName()))
		.zip()
		.run()

	return {
		id: userRole[0]['id'],
		name: userRole[0]['name'] as string,
	}
}

const getUser = async (req: Request, res: Response) => {
	try {
		const user: userModelProps[] = await r
			.table(User.getTableName())
			.filter({ id: req.userId, isActive: 1, deletedAt: null })
			.run()

		const { email: userEmail = false, id: userId } = user[0] || {}

		if (!userEmail) {
			res
				.status(400)
				.json({ message: 'User does not exist', data: [] })
			return
		}

		const userRole: GenericObject = await _getUserRole(
			userId as string
		)

		// Fetching token from header
		const bearerToken = req.headers?.authorization as string
		const [, token] = bearerToken.split(' ')

		res.status(200).json({
			data: {
				token: token,
				user: {
					...user[0],
					role: userRole['name'],
					roleId: userRole['id'],
				},
			},
		})
	} catch (error: any) {
		res.status(500).json({ message: error.toString() })
	}
}

export { login, getUser }
