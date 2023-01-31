import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const Role = thinky.createModel('Roles', {
	name: type.string(),
	level: type.number(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
})

Role.ensureIndex('createdAt')
Role.ensureIndex('updatedAt')

export default Role
