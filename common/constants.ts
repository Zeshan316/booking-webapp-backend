const rideDirections: string[] = ['north', 'south']

const rideStatuses: GenericObject = {
	awaiting: 'awaiting',
	completed: 'completed',
	cancelled: 'cancelled',
}

const defaultProfileUrl: string =
	'static/images/defaultProfileImg.png'

const INITIAL_SYSTEM_ROLES: Role[] = [
	{
		name: 'System Administrator',
		level: 0,
	},
	{
		name: 'App Administrator',
		level: 1,
	},
	{
		name: 'User',
		level: 2,
	},
	{
		name: 'Driver',
		level: 3,
	},
]

const INITIAL_SYSTEM_LOCATIONS: any = [
	{
		direction: 'north',
		locationName: 'DNA Micro',
	},
	{
		direction: 'north',
		locationName: 'UCMA',
	},
	{
		direction: 'north',
		locationName: 'Camp Lapulapu road, Apas',
	},
	{
		direction: 'north',
		locationName: 'Talamban',
	},
	{
		direction: 'north',
		locationName: 'M. Lhuillier, Guizo| Panagdait | Hernan Cortes',
	},
	{
		direction: 'north',
		locationName: 'San Narciso Church, Consolacion',
	},

	{
		direction: 'north',
		locationName: 'Gaisano Grand Mall, Basak, Lapulapu',
	},

	{
		direction: 'north',
		locationName: 'Marigondon Crossing',
	},

	{
		direction: 'south',
		locationName: 'DNA Micro',
	},

	{
		direction: 'south',
		locationName: 'Baseline, Juana Osmena',
	},

	{
		direction: 'south',
		locationName: 'T.Padilla Bgy Hall',
	},

	{
		direction: 'south',
		locationName: 'Waiting Shed, Suba, Pasil',
	},

	{
		direction: 'south',
		locationName: 'Jollibee, Punta Princesa | F. Llamas',
	},
	{
		direction: 'south',
		locationName: 'Gaisano, Tisa',
	},

	{
		direction: 'south',
		locationName: 'Deca Homes, Tisa | Arbees, Tisa',
	},

	{
		direction: 'south',
		locationName: 'Calamba Flyover, V. Rama',
	},

	{
		direction: 'south',
		locationName: "Jollibee Banawa Junction, Mama Susan's V.Rama",
	},
]

export {
	rideDirections,
	rideStatuses,
	defaultProfileUrl,
	INITIAL_SYSTEM_ROLES,
	INITIAL_SYSTEM_LOCATIONS,
}
