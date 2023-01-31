import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User, Password, Role, UserRole } from '../models/All'
import path from 'path'
import fs from 'fs'
import uuid, { v4 } from 'uuid'
import thinky from '../config/db'

const { r } = thinky

/* const forgotPassword = async (req, res) => {
	const { email } = req?.body

	if (!email) {
		res.status(400).json({ message: 'Email not found' })
		return
	}

	const user = await User.findOne({ email: email })
	if (!user) {
		res.status(400).json({ message: 'Invalid email.' })
		return
	}

	const hash = uuid.v4()

	sendEmail(
		email,
		'forgotpassword',
		{
			resetPasswordLink: path.join(
				process.env.APP_URL,
				`/api/user/resetpassword/${hash}`
			),
		},
		hash
	)

	res.status(200).json({ message: 'Check your email address.' })
}
*/

const resetPassword = async (req: Request, res: Response) => {
	res.send('resetPassword endpoint...')
}

const test = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'ok' })
}

// Get all users and apply filters while fetching
const getUsers = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'done' })
}

// Get a single user by id
const getUser = async (req: Request, res: Response) => {
	try {
		const { id } = req?.params
		const user = await r
			.table(UserRole.getTableName())
			.filter(r.row('userId').eq(id))
			.eqJoin('userId', r.table(User.getTableName()))
			.zip()
			.eqJoin('roleId', r.table(Role.getTableName()))
			.zip()
			.run()

		if (user.length) {
			const userData = _formatUserData(user[0])
			res
				.status(200)
				.json({ message: 'User fetched', data: userData })
			return
		}

		res.status(200).json({ message: 'User not found', data: [] })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Formate userdata
const _formatUserData = (data: GenericObject) => {
	const { level, id, userId, ...restData } = data
	return {
		...restData,
		id: userId,
	}
}

// Create a new user, it's password and role
const createUser = async (req: Request, res: Response) => {
	try {
		const {
			firstName,
			lastName,
			email,
			password,
			phoneNumber,
			roleId,
		} = req.body

		const alreadyUser = await r
			.table(User.getTableName())
			.filter({ email })
			.run()

		if (alreadyUser.length) {
			res
				.status(200)
				.json({ message: 'User exists already', data: [] })
			return
		}

		const salt = bcrypt.genSaltSync()
		const hashedPassword = bcrypt.hashSync(password, salt)

		const user = await new User({
			firstName,
			lastName,
			email,
			phoneNumber,
		}).save()

		await new Password({
			userId: user.id,
			password: hashedPassword,
		}).save()

		const role = await Role.filter(r.row('name').eq('User')).run()

		await new UserRole({
			userId: user.id,
			roleId: roleId ? roleId : role.length ? role[0]['id'] : '0',
		}).save()

		res
			.status(201)
			.json({ message: 'User created successfully.', data: [] })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Update a user
const updateUser = async (req: Request, res: Response) => {
	try {
		const { id: userId } = req?.params
		const {
			firstName,
			lastName,
			phoneNumber,
			profileImgUrl = '',
			oldPassword = '',
			newPassword = '',
			roleId,
		} = req?.body

		// update user data
		const user = await r
			.table(User.getTableName())
			.get(userId)
			.update({ firstName, lastName, phoneNumber, profileImgUrl })
			.run()

		// update user password
		const userPasswordUpdation: boolean = await _updateUserPassword(
			userId,
			oldPassword,
			newPassword
		)

		if (!userPasswordUpdation as boolean) {
			res.status(400).json({
				message: 'Password not updated',
				data: [],
			})
			return
		}

		// update user role
		const userRole: boolean = await _updateUserRole(userId, roleId)
		if (!userRole) {
			res.status(400).json({
				message: 'Role not updated',
				data: [],
			})
			return
		}

		res.status(200).json({ message: 'User data updated', data: [] })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Private user password updation
const _updateUserPassword = async (
	userId: string,
	oldPassword: string,
	newPassword: string
): Promise<boolean> => {
	// if user do not want to update password
	if (!oldPassword.length || !newPassword.length) return true

	const userPassword = await r
		.table(Password.getTableName())
		.filter(r.row('userId').eq(userId))
		.run()

	if (!userPassword[0]['password']) return false

	// verify user password
	if (!bcrypt.compareSync(oldPassword, userPassword[0]['password'])) {
		return false
	}

	// update user password

	const salt = bcrypt.genSaltSync()
	const hashedPassword = bcrypt.hashSync(newPassword, salt)

	const { replaced, errors } = await r
		.table(Password.getTableName())
		.filter(r.row('userId').eq(userId))
		.update({ password: hashedPassword })
		.run()

	return errors ? false : true
}

// Private user role updation
const _updateUserRole = async (
	userId: string,
	roleId: string
): Promise<boolean> => {
	const { replaced, errors } = await r
		.table(UserRole.getTableName())
		.filter(r.row('userId').eq(userId))
		.update({ roleId })
		.run()

	return errors ? false : true
}

// Delete a user
const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id: userId } = req?.params
		const user = await r.table(User.getTableName()).get(userId).run()

		if (!user) {
			res.status(200).json({ message: 'User not found to delete' })
			return
		}

		const { deleted } = await r
			.table(User.getTableName())
			.get(userId)
			.delete()
			.run()

		// delete password
		await r
			.table(Password.getTableName())
			.filter(r.row('userId').eq(userId))
			.delete()
			.run()

		// delete userrole
		await r
			.table(UserRole.getTableName())
			.filter(r.row('userId').eq(userId))
			.delete()
			.run()

		if (deleted) {
			res.status(200).json({ message: 'User deleted sucessfully' })
			return
		}

		res.status(200).json({ message: 'User not deleted' })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

export { test, getUsers, getUser, createUser, updateUser, deleteUser }
