interface userModelProps {
	id?: string
	firstName: string
	lastName: string
	email: string
	phoneNumber: string
	profileImgUrl: string
	role: string
	createdAt: Date | any
	updatedAt: Date | any
}

interface userPasswordModelProps {
	id?: string
	userId: string
	password: string
	createdAt: Date | any
	updatedAt: Date | any
}

interface AuthResponse {}

declare namespace Express {
	interface Request {
		userId?: string
		userRole?: string
	}
}

declare type GenericObject = { [key: string]: any }
