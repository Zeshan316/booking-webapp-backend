import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { User, Password, Role, UserRole } from '../models/All'
import thinky from '../config/db'
import path from 'path'
import { UploadedFile } from 'express-fileupload'
import chalk from 'chalk'
import { validationResult } from 'express-validator'

const { r } = thinky

const resetPassword = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'resetPassword endpoint...' })
}

// Get all users and apply filters while fetching
const getUsers = async (req: Request, res: Response) => {
	try {
		const {
			order = 'desc',
			from = 0,
			to = 10,
			firstName = '',
			lastName = '',
			email = '',
			phoneNumber = '',
		} = req?.query

		// check is there any check to filter on
		let filterObject = {}
		if (firstName)
			filterObject = r.row('firstName').match(`(?i)${firstName}`)
		if (lastName)
			filterObject = r.row('lastName').match(`(?i)${lastName}`)
		if (email) filterObject = r.row('email').match(`(?i)${email}`)
		if (phoneNumber)
			filterObject = r.row('phoneNumber').match(`(?i)${phoneNumber}`)

		// Count total users
		const totalUsers = await r
			.table(User.getTableName())
			.filter(filterObject)
			.count()
			.run()

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
			.without('createdAt', 'updatedAt', 'deletedAt')
			.zip()
			.eqJoin('roleId', r.table(Role.getTableName()))
			.map((row) => {
				return row('left').merge({ role: row('right') })
			})
			.without('id')
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

		if (!id) {
			res.status(400).json({ message: 'User id not found' })
			return
		}

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
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			res.status(400).json({
				message: `${errors.array()[0]['msg']} for ${
					errors.array()[0]['param']
				}`,
			})
			return
		}

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

// Update a user
const updateUser = async (req: Request, res: Response) => {
	try {
		const { id: userId } = req?.params

		if (!userId) {
			res.status(400).json({ message: 'User id not found' })
			return
		}

		const existingUser = await r
			.table(User.getTableName())
			.get(userId)
			.run()

		if (!existingUser) {
			res.status(400).json({
				message: 'User not updated',
			})
		}

		const {
			firstName,
			lastName,
			phoneNumber,
			profileImgUrl = existingUser.profileImgUrl,
			oldPassword = '',
			newPassword = '',
			roleId,
			isActive = existingUser.isActive,
		} = req?.body

		// update user data
		await r
			.table(User.getTableName())
			.get(userId)
			.update({
				firstName,
				lastName,
				phoneNumber,
				profileImgUrl,
				isActive,
				updatedAt: r.now(),
			})
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

// Delete a user
const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id: userId } = req?.params
		if (!userId) {
			res.status(400).json({ message: 'User id not found' })
			return
		}

		const user = await r.table(User.getTableName()).get(userId).run()

		if (!user) {
			res.status(200).json({ message: 'User not found to delete' })
			return
		}

		await r
			.table(User.getTableName())
			.get(userId)
			.update({ deletedAt: r.now() })
			.run()

		// delete password
		/* await r
			.table(Password.getTableName())
			.filter(r.row('userId').eq(userId))
			.delete()
			.run() */

		// delete userrole
		/* await r
			.table(UserRole.getTableName())
			.filter(r.row('userId').eq(userId))
			.delete()
			.run() */

		res.status(200).json({ message: 'User deleted sucessfully' })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

const uploadProfile = async (req: Request, res: Response) => {
	try {
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send('No files were uploaded.')
		}

		const { id: userId } = req?.params
		if (!userId) {
			res.status(400).json({ message: 'User id not found.' })
		}

		const allowedExtensions = ['.png', '.jpg', '.jpeg']
		const profileImg: any = req.files?.profile

		if (!allowedExtensions.includes(path.extname(profileImg.name))) {
			res.status(400).json({
				message: 'Only png, jpg files are allowed to upload.',
			})
			return
		}

		const fileName: string = `${userId}-${profileImg.name}`
		const uploadPath: string = path.join(
			path.resolve(__dirname, '..'),
			`public/images/${fileName}`
		)

		profileImg.mv(uploadPath, async function (err: any) {
			if (err) {
				res.status(400).json({ message: err?.message })
				return
			}

			await r
				.table(User.getTableName())
				.get(userId)
				.update({ profileImgUrl: `static/images/${fileName}` })
				.run()

			res.status(200).json({
				message: 'File uploaded!',
				data: { filePath: `static/images/${fileName}` },
			})
			return
		})
	} catch (error: any) {
		res.status(500).json({ message: error?.message })
	}
}

const insertDefaultUser = async () => {
	try {
		const existingUser = await r
			.table(User.getTableName())
			.filter({ email: 'admin@gmail.com' })
			.run()

		if (existingUser.length) {
			return
		}

		const salt = bcrypt.genSaltSync()
		const hashedPassword = bcrypt.hashSync('123456', salt)

		const user = await new User({
			firstName: 'Administrator',
			lastName: 'Administrator',
			email: 'admin@gmail.com',
			phoneNumber: '',
			isActive: 1,
		}).save()

		console.log(user)

		await new Password({
			userId: user.id,
			password: hashedPassword,
		}).save()

		const role = await Role.filter(r.row('level').eq(1)).run()

		if (!role) {
			console.log(
				chalk.blue(
					'Create role first and then update this user with role.'
				)
			)
			return
		}

		await new UserRole({
			userId: user.id,
			roleId: role[0]['id'],
		}).save()

		console.log(chalk.blue('Default user created'))
		return
	} catch (error) {
		console.log(chalk.red(error))
	}
}

export {
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
	uploadProfile,
	insertDefaultUser,
}
