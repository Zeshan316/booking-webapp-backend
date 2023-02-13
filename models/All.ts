import User from './User'
import Password from './Password'
import Role from './Role'
import UserRole from './UserRole'
import Location from './Location'
import Ride from './Ride'

User.hasOne(Password, 'password', 'id', 'userId', {})
User.hasOne(UserRole, 'role', 'id', 'userId', {})
Password.belongsTo(User, 'user', 'userId', 'id', {})

export { User, Password, Role, UserRole, Location, Ride }
