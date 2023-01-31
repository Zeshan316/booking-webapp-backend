import thinky from '../config/db'

const type = thinky.type
const r = thinky.r

const Password = thinky.createModel('Passwords', {
	userId: type.string(),
	password: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
})

Password.ensureIndex('userId')

export default Password
