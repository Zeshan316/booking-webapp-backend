import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { User, Password, Role, UserRole } from '../models/All'
import thinky from '../config/db'

const { r } = thinky

const resetPassword = async (req: Request, res: Response) => {
	res.send('resetPassword endpoint...')
}

// Get all users and apply filters while fetching
const getUsers = async (req: Request, res: Response) => {
	try {
		const {
			order = 'desc',
			from = 0,
			to = 10,
			firstName = '',
			email = '',
		} = req?.query

		// Count total users
		const totalUsers = await r
			.table(User.getTableName())
			.count()
			.run()

		// check is there any check to filter on
		const filterObject = {
			...(firstName.length && { firstName }),
			...(email.length && { email }),
		}

		// check sorting order of data
		const orderByField =
			order === 'desc' ? r.desc('createdAt') : r.asc('createdAt')

		const users = await r
			.table(User.getTableName())
			.orderBy(orderByField, {
				index: orderByField,
			})
			.eqJoin('id', r.table(UserRole.getTableName()), {
				index: 'userId',
			})
			.zip()
			.eqJoin('roleId', r.table(Role.getTableName()))
			.zip()
			.filter(filterObject)
			.skip(Number(from))
			.limit(Number(to))
			.run()

		res
			.status(200)
			.json({ message: 'All users', data: { totalUsers, users } })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
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

		res.status(200).json({ message: 'User not found' })
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
			res.status(200).json({ message: 'User exists already' })
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

		res.status(201).json({ message: 'User created successfully.' })
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
			})
			return
		}

		// update user role
		const userRole: boolean = await _updateUserRole(userId, roleId)
		if (!userRole) {
			res.status(400).json({
				message: 'Role not updated',
			})
			return
		}

		res.status(200).json({ message: 'User data updated' })
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
	if (
		!oldPassword.length ||
		!newPassword.length ||
		oldPassword === newPassword
	)
		return true

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

export { getUsers, getUser, createUser, updateUser, deleteUser }
