import express, { IRouter } from 'express'
const locationRouter: IRouter = express.Router()
import { check } from 'express-validator'

import {
	createLocation,
	updateLocation,
	getLocations,
	deleteLocation,
} from '../controllers/locationsController'

locationRouter.get('/', getLocations)
locationRouter.post(
	'/',
	[
		check('direction').exists().notEmpty().isString(),
		check('locationName').exists().notEmpty().isString(),
	],
	createLocation
)
locationRouter.patch(
	'/:locationId',
	[
		check('direction').exists().notEmpty().isString(),
		check('locationName').exists().notEmpty().isString(),
	],
	updateLocation
)

locationRouter.delete('/:locationId', deleteLocation)

export default locationRouter
