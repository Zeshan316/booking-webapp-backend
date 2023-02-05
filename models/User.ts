import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const User = thinky.createModel('Users', {
	firstName: type.string(),
	lastName: type.string(),
	email: type.string(),
	phoneNumber: type.string().optional(),
	profileImgUrl: type.string().optional(),
	isActive: type.number().default(1),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
	deletedAt: type.date().default(null),
})

User.ensureIndex('createdAt')
User.ensureIndex('updatedAt')
User.ensureIndex('deletedAt')

export default User
