import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const User = thinky.createModel('Users', {
	firstName: type.string(),
	lastName: type.string(),
	email: type.string(),
	phoneNumber: type.string(),
	profileImgUrl: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
})

User.ensureIndex('createdAt')
User.ensureIndex('updatedAt')

export default User
