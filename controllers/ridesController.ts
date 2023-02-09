import { Request, Response } from 'express'
import moment, { now } from 'moment'
import dayjs from 'dayjs'
import { Ride, User, Location } from '../models/All'
import thinky from '../config/db'
import { rideStatuses } from '../common/constants'
import { validationResult } from 'express-validator'

const { r } = thinky

// Get all rides and apply filters while fetching
const getRides = async (req: Request, res: Response) => {
	try {
		const {
			order = 'desc',
			from = 0,
			to = 10,
			pickupId = '',
			destinationId = '',
			tripStartDateTime = '',
			tripEndDateTime = '',
			status = '',
		} = req?.query

		console.log(req.userId)

		// check is there any check to filter on
		// let filterObject = { deletedAt: null }
		let filterObject = {}
		if (status) filterObject = r.row('status').match(`(?i)${status}`)
		if (pickupId) filterObject = r.row('pickupId').eq(pickupId)
		if (destinationId)
			filterObject = r.row('destinationId').eq(destinationId)
		if (status) filterObject = r.row('status').match(`(?i)${status}`)

		if (tripStartDateTime && tripEndDateTime) {
			const fromDate = dayjs(
				dayjs(tripStartDateTime as string).format(
					'YYYY-MM-DD HH:mm:ss'
				)
			).toDate()
			const toDate = dayjs(
				dayjs(tripEndDateTime as string).format('YYYY-MM-DD HH:mm:ss')
			).toDate()
			filterObject = r.row('tripDateTime').during(fromDate, toDate)
		}

		// Count total rides
		const totaRides = await r
			.table(Ride.getTableName())
			.filter(r.row('userId').eq(req.userId))
			.filter(filterObject)
			.filter({ deletedAt: null })
			.count()
			.run()

		// check sorting order of data
		const orderByField =
			order === 'desc' ? r.desc('createdAt') : r.asc('createdAt')

		const rides = await r
			.table(Ride.getTableName())
			.orderBy(orderByField, {
				index: orderByField,
			})
			.eqJoin('userId', r.table(User.getTableName()))
			.map((row) => row('left').merge({ user: row('right') }))
			.eqJoin('pickupId', r.table(Location.getTableName()))
			.map((row) => row('left').merge({ pickup: row('right') }))
			.eqJoin('destinationId', r.table(Location.getTableName()))
			.map((row) => row('left').merge({ destination: row('right') }))
			.filter(r.row('userId').eq(req.userId))
			.filter(filterObject)
			.filter({ deletedAt: null })
			.skip(Number(from))
			.limit(Number(to))
			.run()

		res
			.status(200)
			.json({ message: 'All rides', data: { totaRides, rides } })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Get a single ride by id
const getRide = async (req: Request, res: Response) => {
	try {
		const { id: rideId } = req?.params

		const ride = await r
			.table(Ride.getTableName())
			.filter(r.row('id').eq(rideId))
			.eqJoin('userId', r.table(User.getTableName()))
			.map((row) => row('left').merge({ user: row('right') }))
			.eqJoin('pickupId', r.table(Location.getTableName()))
			.map((row) => row('left').merge({ pickup: row('right') }))
			.eqJoin('destinationId', r.table(Location.getTableName()))
			.map((row) => row('left').merge({ destination: row('right') }))
			.run()

		if (ride.length) {
			res.status(200).json({ message: 'Ride fetched', data: ride[0] })
			return
		}

		res.status(200).json({ message: 'Ride not found' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Create a new ride
const createRide = async (req: Request, res: Response) => {
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

		const { tripDate, tripTime, direction, pickupId, destinationId } =
			req.body

		const tripDateTime = dayjs(
			`${tripDate} ${tripTime}`,
			'YYYY-MM-DD, HH:mm:ss'
		).toDate()

		// validate if there is no entry
		const previousDateTime = dayjs().subtract(30, 'minute').toDate()

		// Lock user next ride for atleast 30 min
		const rides = await r
			.table(Ride.getTableName())
			.orderBy(r.desc('createdAt'), {
				index: r.desc('createdAt'),
			})
			.eqJoin('userId', r.table(User.getTableName()))
			.without('right', 'id')
			.zip()
			.filter(r.row('createdAt').gt(previousDateTime))
			.run()

		/* if (rides.length) {
			res.status(400).json({ message: 'You already created a ride' })
			return
		} */

		const ride = await new Ride({
			userId: req.userId,
			tripDateTime,
			direction,
			pickupId,
			destinationId,
			status: rideStatuses.awaiting,
		}).save()

		res.status(201).json({ message: 'Ride booked successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Update a ride
const updateRide = async (req: Request, res: Response) => {
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

		const { id: rideId } = req?.params

		// get ride and set previous status
		const existingRide = await r
			.table(Ride.getTableName())
			.filter(r.row('id').eq(rideId))
			.run()

		if (!existingRide.length) {
			res.status(200).json({ message: 'This ride not exists' })
			return
		}

		const {
			tripDate,
			tripTime,
			direction,
			pickupId,
			destinationId,
			status = existingRide.status,
		} = req?.body

		// update ride data
		const tripDateTime = dayjs(
			`${tripDate} ${tripTime}`,
			'YYYY-MM-DD, HH:mm:ss'
		).toDate()
		await r
			.table(Ride.getTableName())
			.get(rideId)
			.update({
				tripDateTime,
				direction,
				pickupId,
				destinationId,
				status,
				updatedAt: r.now(),
			})
			.run()

		res.status(200).json({ message: 'Your ride has been updated' })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

// Delete a ride
const deleteRide = async (req: Request, res: Response) => {
	try {
		const { id: rideId } = req?.params
		const ride = await r.table(Ride.getTableName()).get(rideId).run()

		if (!ride) {
			res.status(200).json({ message: 'Ride not found to delete' })
			return
		}

		r.table(Ride.getTableName())
			.get(rideId)
			.update({ deletedAt: r.now() })
			.run()

		res.status(200).json({ message: 'Ride deleted' })
	} catch (error) {
		res.status(500).json({ message: 'Some error occured' })
	}
}

export { getRides, getRide, createRide, updateRide, deleteRide }
