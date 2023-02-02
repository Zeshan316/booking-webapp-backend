import { Request, Response } from 'express'
import thinky from '../config/db'
import { User, Password, Role, UserRole } from '../models/All'
import { validationResult } from 'express-validator'

const { r } = thinky

// Get all users and apply filters while fetching
const getRoles = async (req: Request, res: Response) => {
	try {
		const {
			order = 'desc',
			from = 0,
			to = 10,
			name = '',
			level = '',
		} = req?.query

		// Count total users
		const totalUsers = await r
			.table(Role.getTableName())
			.count()
			.run()

		// check is there any check to filter on
		const filterObject = name.length
			? r.row('name').match(`(?i)${name}`)
			: {
					...(level.length && { level: Number(level) }),
			  }

		// check sorting order of data
		const orderByField =
			order === 'desc' ? r.desc('createdAt') : r.asc('createdAt')

		const roles = await r
			.table(Role.getTableName())
			.orderBy(orderByField)
			.filter(filterObject)
			.skip(Number(from))
			.limit(Number(to))
			.run()

		res
			.status(200)
			.json({ message: 'All roles', data: { totalUsers, roles } })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Create a new user, it's password and role
const createRole = async (req: Request, res: Response) => {
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

		const { name, level } = req?.body

		const isRoleExists = await r
			.table(Role.getTableName())
			.filter(
				r
					.row('name')
					.match(`(?i)^${name}$`)
					.or(r.row('level').eq(level))
			)
			.count()
			.run()

		if (isRoleExists) {
			res.status(400).json({ message: 'Role already exists.' })
			return
		}

		await new Role({
			name,
			level,
		}).save()

		res.status(201).json({ message: 'Role created successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Update a user
const updateRole = async (req: Request, res: Response) => {
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

		const { roleId } = req?.params
		const { name } = req?.body

		// Check if role exists
		const isRoleExists = await r
			.table(Role.getTableName())
			.filter(r.row('id').eq(roleId))
			.count()
			.run()

		if (!isRoleExists) {
			res.status(400).json({ message: 'Role not exists.' })
			return
		}

		// update user data
		const role = await r
			.table(Role.getTableName())
			.get(roleId)
			.update({ name })
			.run()

		res.status(200).json({ message: 'Role data updated', data: [] })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

export { createRole, updateRole, getRoles }
