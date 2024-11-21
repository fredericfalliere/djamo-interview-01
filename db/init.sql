CREATE TABLE transactions (
	id 			SERIAL PRIMARY KEY,
	amount		integer,
	status		integer,
	created_at	TIMESTAMPTZ DEFAULT NOW(),
	updated_at	TIMESTAMPTZ DEFAULT NOW()
);
