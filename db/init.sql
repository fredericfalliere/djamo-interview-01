CREATE TABLE Transaction (
	id 			SERIAL PRIMARY KEY,
	amount		integer NOT NULL,
	status		integer NOT NULL,
	created_at	TIMESTAMPTZ DEFAULT NOW() NOT NULL,
	updated_at	TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
