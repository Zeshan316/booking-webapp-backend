import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import {
	User,
	Password,
	Role,
	UserRole,
	Location,
} from '../models/All'
import thinky from '../config/db'
import chalk from 'chalk'
import {
	INITIAL_SYSTEM_ROLES,
	INITIAL_SYSTEM_LOCATIONS,
} from '../common/constants'

const { r } = thinky

const insertDefaultUser = async () => {
	try {
		await Role.on('ready', async () => await initiateSystemRoles())
		await Role.on(
			'ready',
			async () => await initiateSystemLocations()
		)

		/* return

		await initiateSystemRoles()
		await initiateSystemLocations() */

		await Role.on('ready', async () => {
			const existingUser = await r
				.table(User.getTableName())
				.filter({ email: 'admin@dna.com' })
				.run()

			if (existingUser.length) {
				return
			}

			const salt = bcrypt.genSaltSync()
			const hashedPassword = bcrypt.hashSync('123456', salt)

			const user = await new User({
				firstName: 'Administrator',
				lastName: 'Dna',
				email: 'admin@dna.com',
				phoneNumber: '',
				isActive: 1,
			}).save()

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
		})

		return
	} catch (error) {
		console.log(chalk.red(error))
	}
}

const initiateSystemRoles = async () => {
	// INITIAL_SYSTEM_ROLES

	const allRoles = await r.table(Role.getTableName()).count().run()

	if (!allRoles) await Role.save(INITIAL_SYSTEM_ROLES)
}

const initiateSystemLocations = async () => {
	// INITIAL_SYSTEM_ROLES
	const allLocations = await r
		.table(Location.getTableName())
		.count()
		.run()

	if (!allLocations) await Location.save(INITIAL_SYSTEM_LOCATIONS)
}
export { insertDefaultUser }
