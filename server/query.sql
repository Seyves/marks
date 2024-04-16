-- name: GetMarks :many 
SELECT * FROM mark
ORDER BY mark.created_at;

-- name: CreateMark :one
INSERT INTO mark DEFAULT VALUES
RETURNING *;

-- name: UpdateMarkName :exec
UPDATE mark
  SET name = $2
WHERE id = $1;

-- name: UpdateMarkContents :exec
UPDATE mark
  SET contents = $2
WHERE id = $1;
