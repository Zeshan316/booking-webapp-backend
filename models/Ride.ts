import thinky from '../config/db'
import { rideDirections } from '../common/constants'

const type = thinky.type
const r = thinky.r

const Ride = thinky.createModel('Rides', {
	userId: type.string(),
	tripDateTime: type.date(),
	direction: type.string().enum([...rideDirections]),
	pickupId: type.string(),
	destinationId: type.string(),
	status: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
	deletedAt: type.date().default(null),
})

Ride.ensureIndex('createdAt')
Ride.ensureIndex('updatedAt')
Ride.ensureIndex('deletedAt')

export default Ride

//actual: 2023-02-06T07:30:04.828Z

//2023-02-05T13:28:51.611Z
