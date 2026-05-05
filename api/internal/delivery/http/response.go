package http

import (
	"encoding/json"
	"net/http"

	"github.com/yourorg/boilerplate/pkg/commandbus"
	"github.com/yourorg/boilerplate/pkg/pagination"
	"github.com/yourorg/boilerplate/pkg/querybus"
)

// SortConfig mendefinisikan konfigurasi sorting yang diizinkan per domain handler.
type SortConfig struct {
	AllowedFields  map[string]string
	AllowedFilters map[string]string
	DefaultField   string
	DefaultOrder   string
}

// BaseHandler adalah struct yang di-embed oleh semua domain handler.
type BaseHandler struct {
	commandBus *commandbus.CommandBus
	queryBus   *querybus.QueryBus
}

// NewBaseHandler membuat instance BaseHandler baru.
func NewBaseHandler(cb *commandbus.CommandBus, qb *querybus.QueryBus) BaseHandler {
	return BaseHandler{commandBus: cb, queryBus: qb}
}

// ParsePagination membaca parameter pagination dan memvalidasi tuple sort/filter terhadap whitelist.
func (h *BaseHandler) ParsePagination(r *http.Request, cfg SortConfig) (pagination.ListParams, error) {
	p, err := pagination.ParseFromRequest(r)
	if err != nil {
		return pagination.ListParams{}, err
	}

	p.Sort = normalizeSortTuples(p.Sort, cfg)
	if len(p.Sort) == 0 && cfg.DefaultField != "" {
		p.Sort = []pagination.SortTuple{{Field: cfg.DefaultField, Direction: sortDirection(cfg.DefaultOrder)}}
	}

	p.Filters = normalizeFilterTuples(p.Filters, cfg)
	return p, nil
}

func normalizeSortTuples(sortTuples []pagination.SortTuple, cfg SortConfig) []pagination.SortTuple {
	normalized := make([]pagination.SortTuple, 0, len(sortTuples))
	for _, tuple := range sortTuples {
		if col, ok := cfg.AllowedFields[tuple.Field]; ok {
			normalized = append(normalized, pagination.SortTuple{Field: col, Direction: tuple.Direction})
		}
	}
	return normalized
}

func normalizeFilterTuples(filterTuples []pagination.FilterTuple, cfg SortConfig) []pagination.FilterTuple {
	if len(cfg.AllowedFilters) == 0 {
		return filterTuples
	}

	normalized := make([]pagination.FilterTuple, 0, len(filterTuples))
	for _, tuple := range filterTuples {
		if col, ok := cfg.AllowedFilters[tuple.Field]; ok {
			tuple.Field = col
			normalized = append(normalized, tuple)
		}
	}
	return normalized
}

func sortDirection(order string) int {
	switch order {
	case "asc":
		return 1
	case "desc":
		return -1
	default:
		return -1
	}
}

// RespondJSON menulis response JSON dengan status code yang diberikan.
func (h *BaseHandler) RespondJSON(w http.ResponseWriter, status int, body any) {
	respondJSON(w, status, body)
}

// RespondError menulis error response dengan format {"error": "pesan"}.
func (h *BaseHandler) RespondError(w http.ResponseWriter, status int, msg string) {
	respondError(w, status, msg)
}

func respondJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
