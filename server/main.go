package main

import (
	"context"
	"encoding/json"
	"marks/db"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func main() {
	ctx := context.Background()

	conn, err := pgx.Connect(ctx, "postgres://postgres:111222@localhost:5432/postgres")

	if err != nil {
		panic(err)
	}

	queries := db.New(conn)

	r := chi.NewRouter()

	r.Route("/marks", func(r chi.Router) {
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", "json")

			marks, err := queries.GetMarks(ctx)

			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte("Internal server error"))
				return
			}

			json, err := json.Marshal(marks)

			w.Write([]byte(json))
		})

		r.Post("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", "json")

			mark, err := queries.CreateMark(ctx)

			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte(err.Error()))
				return
			}
			
			json, err := json.Marshal(mark)

			w.Write([]byte(json))
		})

		r.Put("/{id}/name/{name}", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", "json")

            id, name := chi.URLParam(r, "id"), chi.URLParam(r, "name")

            var byteId [16]byte

            copy(byteId[:], id)
                
            parsedId := pgtype.UUID{
                Bytes: byteId, 
                Valid: true,
            }

            err = parsedId.ScanUUID(parsedId)

			if err != nil {
				w.WriteHeader(400)
				w.Write([]byte("Invalid uuid"))
				return
			}

            payload := db.UpdateMarkNameParams{
                ID: parsedId, 
                Name: name,
            }

			err := queries.UpdateMarkName(ctx, payload)

			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte("Internal server error"))
				return
			}
		})

		r.Put("/{id}/contents/{contents}", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", "json")

            id, contents := chi.URLParam(r, "id"), chi.URLParam(r, "contents")

            var byteId [16]byte

            copy(byteId[:], id)
                
            parsedId := pgtype.UUID{
                Bytes: byteId, 
                Valid: true,
            }

            err = parsedId.ScanUUID(parsedId)

			if err != nil {
				w.WriteHeader(400)
				w.Write([]byte("Invalid uuid"))
				return
			}

            payload := db.UpdateMarkContentsParams{
                ID: parsedId, 
                Contents: contents,
            }

			err := queries.UpdateMarkContents(ctx, payload)

			if err != nil {
				w.WriteHeader(500)
				w.Write([]byte("Internal server error"))
				return
			}
		})
	})

	http.ListenAndServe(":8000", r)
}
