import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/All'
import path from 'path'
import fs from 'fs'
import uuid, { v4 } from 'uuid'

/* const forgotPassword = async (req, res) => {
	const { email } = req?.body

	if (!email) {
		res.status(400).json({ message: 'Email not found' })
		return
	}

	const user = await User.findOne({ email: email })
	if (!user) {
		res.status(400).json({ message: 'Invalid email.' })
		return
	}

	const hash = uuid.v4()

	sendEmail(
		email,
		'forgotpassword',
		{
			resetPasswordLink: path.join(
				process.env.APP_URL,
				`/api/user/resetpassword/${hash}`
			),
		},
		hash
	)

	res.status(200).json({ message: 'Check your email address.' })
}
*/

const resetPassword = async (req: Request, res: Response) => {
	res.send('resetPassword endpoint...')
}

const test = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'ok' })
}

// Get all users and apply filters while fetching
const getUsers = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'done' })
}

// Get a single user by id
const getUser = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'fetch single user' })
}
// Create a new user, it's password and role
const createUser = async (req: Request, res: Response) => {}

// Update a user
const updateUser = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'update single user' })
}

// Delete a user
const deleteUser = async (req: Request, res: Response) => {
	res.status(200).json({ message: 'delete single user' })
}

export { test, getUsers, getUser, createUser, updateUser, deleteUser }
