import thinky from '../config/db'
import { rideDirections } from '../common/constants'

const type = thinky.type
const r = thinky.r

const Location = thinky.createModel('Locations', {
	direction: type.string().enum([...rideDirections]),
	locationName: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
	deletedAt: type.date().default(null),
})

Location.ensureIndex('createdAt')
Location.ensureIndex('updatedAt')
Location.ensureIndex('deletedAt')

export default Location
