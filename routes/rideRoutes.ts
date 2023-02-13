import express, { IRouter } from 'express'
const rideRouter: IRouter = express.Router()
import { check, param } from 'express-validator'

import {
	getRides,
	getRide,
	createRide,
	updateRide,
	deleteRide,
	updateRideStatus,
} from '../controllers/ridesController'

rideRouter.get('/', getRides)
rideRouter.get('/:id', [param('id').exists().notEmpty()], getRide)
rideRouter.post(
	'/',
	[
		check('tripDate').exists().notEmpty(),
		check('tripTime').exists().notEmpty(),
		check('direction').exists().notEmpty().isString(),
		check('pickupId').exists().notEmpty().isString(),
		check('destinationId').exists().notEmpty(),
	],
	createRide
)

rideRouter.put(
	'/change-status/:id',
	[param('id').exists().notEmpty()],
	updateRideStatus
)

rideRouter.patch(
	'/:id',
	[param('id').exists().notEmpty()],
	updateRide
)

rideRouter.delete(
	'/:id',
	[param('id').exists().notEmpty()],
	deleteRide
)

export default rideRouter
