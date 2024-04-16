CREATE TABLE mark (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL DEFAULT 'Untitled',
    contents text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT NOW()
)
