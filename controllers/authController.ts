import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import thinky from '../config/db'
import { User, Password, Role, UserRole } from '../models/All'
import { validationResult } from 'express-validator'
import uuid from 'uuid'
import path from 'path'
import fs from 'fs'

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
			.filter({ email })
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
			.filter(r.row('userId').eq(userId))
			.eqJoin('userId', r.table(User.getTableName()))
			.zip()
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
		const userRole: string = await _getUserRole(userId as string)

		// Create a token
		const payload = {
			user: {
				id: userId,
				role: userRole,
			},
		}
		const token = await jwt.sign(
			payload,
			process.env.JWT_SECRET as string,
			{
				expiresIn: '100m',
			}
		)

		res.status(200).json({ message: 'Token generated', data: token })
	} catch (error: any) {
		res.status(500).json({ message: error.toString() })
	}
}

const _getUserRole = async (userId: string): Promise<string> => {
	const userRole = await r
		.table(UserRole.getTableName())
		.filter(r.row('userId').eq(userId))
		.eqJoin('userId', r.table(User.getTableName()))
		.zip()
		.eqJoin('roleId', r.table(Role.getTableName()))
		.zip()
		.run()

	return userRole[0]['name'] as string
}

export { login }
