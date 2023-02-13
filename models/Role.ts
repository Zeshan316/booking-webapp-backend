import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const Role = thinky.createModel('Roles', {
	name: type.string(),
	level: type.number(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
	deletedAt: type.date().default(null),
})

Role.ensureIndex('createdAt')
Role.ensureIndex('updatedAt')
Role.ensureIndex('deletedAt')

export default Role
