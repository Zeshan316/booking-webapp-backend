import express, { IRouter } from 'express'
const rideRouter: IRouter = express.Router()
import { check } from 'express-validator'

import {
	getRides,
	getRide,
	createRide,
	updateRide,
	deleteRide,
} from '../controllers/ridesController'

rideRouter.get('/', getRides)
rideRouter.get('/:id', getRide)
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
rideRouter.patch('/:id', updateRide)
rideRouter.delete('/:id', deleteRide)

export default rideRouter
