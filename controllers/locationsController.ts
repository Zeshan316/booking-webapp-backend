import { Request, Response } from 'express'
import thinky from '../config/db'
import { Location } from '../models/All'
import { validationResult } from 'express-validator'
import { rideDirections } from '../common/constants'

const { r } = thinky

// Get all locations and apply filters while fetching
const getLocations = async (req: Request, res: Response) => {
	try {
		const {
			order = 'desc',
			from = 0,
			to = 10,
			direction = '',
			locationName = '',
		} = req?.query

		// check is there any check to filter on
		let filterQuery = {}
		if (direction) filterQuery = r.row('direction').eq(`${direction}`)

		if (locationName)
			filterQuery = r.row('locationName').match(`(?i)${locationName}`)

		// Count total locations
		const totalLocations = await r
			.table(Location.getTableName())
			.filter(filterQuery)
			.filter({ deletedAt: null })
			.count()
			.run()

		// check sorting order of data
		const orderByField =
			order === 'desc' ? r.desc('createdAt') : r.asc('createdAt')

		const locations = await r
			.table(Location.getTableName())
			.orderBy(orderByField)
			.filter(filterQuery)
			.filter({ deletedAt: null })
			.skip(Number(from))
			.limit(Number(to))
			.run()

		res.status(200).json({
			message: 'All pick up and drop off locations',
			data: { totalLocations, locations },
		})
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

const getLocation = async (req: Request, res: Response) => {
	try {
		const { id: locationId } = req?.params

		const location = await r
			.table(Location.getTableName())
			.filter(r.row('id').eq(locationId))
			.run()

		if (location.length) {
			res
				.status(200)
				.json({ message: 'Location fetched', data: location[0] })
			return
		}

		res.status(200).json({ message: 'Location not found' })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Create a new location
const createLocation = async (req: Request, res: Response) => {
	try {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			res.status(400).json({
				message: `${errors.array()[0]['msg']} for ${
					errors.array()[0]['param']
				}`,
			})
			return
		}

		const { direction, locationName } = req?.body

		const isLocationExists = await r
			.table(Location.getTableName())
			.filter(
				r
					.row('locationName')
					.match(`(?i)^${locationName}$`)
					.and(r.row('direction').eq(direction))
			)
			.count()
			.run()

		if (isLocationExists) {
			res.status(400).json({ message: 'Location already exists.' })
			return
		}

		await new Location({
			direction,
			locationName,
		}).save()

		res
			.status(201)
			.json({ message: 'Location created successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Update a location
const updateLocation = async (req: Request, res: Response) => {
	try {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			res.status(400).json({
				message: `${errors.array()[0]['msg']} for ${
					errors.array()[0]['param']
				}`,
			})
			return
		}

		const { locationId } = req?.params

		// Check if location exists
		const existingLocation = await r
			.table(Location.getTableName())
			.filter(r.row('id').eq(locationId))
			.run()

		if (!existingLocation?.length) {
			res.status(400).json({ message: 'Location not exists.' })
			return
		}

		const {
			direction = existingLocation.direction,
			locationName = existingLocation.locationName,
		} = req?.body

		// update location data
		await r
			.table(Location.getTableName())
			.get(locationId)
			.update({ direction, locationName, updatedAt: r.now() })
			.run()

		res.status(200).json({ message: 'Location updated', data: [] })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Delete a location
const deleteLocation = async (req: Request, res: Response) => {
	try {
		const { locationId } = req?.params
		const location = await r
			.table(Location.getTableName())
			.get(locationId)
			.run()

		if (!location) {
			res
				.status(200)
				.json({ message: 'Location not found to delete' })
			return
		}

		await r
			.table(Location.getTableName())
			.get(locationId)
			.update({ deletedAt: r.now() })
			.run()

		res.status(200).json({ message: 'Location deleted' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

export {
	createLocation,
	updateLocation,
	getLocations,
	getLocation,
	deleteLocation,
}
