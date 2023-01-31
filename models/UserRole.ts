import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const UserRole = thinky.createModel('UserRoles', {
	userId: type.string(),
	roleId: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
})

UserRole.ensureIndex('userId')
UserRole.ensureIndex('roleId')

export default UserRole
