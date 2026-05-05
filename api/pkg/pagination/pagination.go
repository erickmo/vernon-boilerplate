package pagination

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

const (
	defaultLimit = 20
	maxLimit     = 500
)

// ListParams berisi parameter pagination dan sorting.
type ListParams struct {
	Limit   int
	Offset  int
	Sort    []SortTuple
	Filters []FilterTuple
}

// SortTuple merepresentasikan urutan sorting dari query string.
// Format JSON: [["field", 1], ["field2", -1]]
type SortTuple struct {
	Field     string
	Direction int
}

// FilterTuple merepresentasikan satu filter dari query string.
// Format JSON: [["field", "operator", value], ...]
type FilterTuple struct {
	Field    string
	Operator string
	Value    any
}

// ParseFromRequest membaca parameter limit, offset, sort, order, dan filters dari HTTP request.
func ParseFromRequest(r *http.Request) (ListParams, error) {
	q := r.URL.Query()

	limit := defaultLimit
	if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 {
		if l > maxLimit {
			limit = maxLimit
		} else {
			limit = l
		}
	}

	offset := 0
	if o, err := strconv.Atoi(q.Get("offset")); err == nil && o >= 0 {
		offset = o
	}

	params := ListParams{
		Limit:  limit,
		Offset: offset,
	}

	if rawSort := strings.TrimSpace(q.Get("sort")); rawSort != "" {
		if strings.HasPrefix(rawSort, "[") {
			sortTuples, err := parseSortTuples(rawSort)
			if err != nil {
				return ListParams{}, fmt.Errorf("invalid sort query: %w", err)
			}
			params.Sort = sortTuples
		} else {
			order := q.Get("order")
			if order != "asc" && order != "desc" {
				order = "desc"
			}
			direction := -1
			if order == "asc" {
				direction = 1
			}
			params.Sort = []SortTuple{{Field: rawSort, Direction: direction}}
		}
	}

	if rawFilters := strings.TrimSpace(q.Get("filters")); rawFilters != "" {
		filterTuples, err := parseFilterTuples(rawFilters)
		if err != nil {
			return ListParams{}, fmt.Errorf("invalid filters query: %w", err)
		}
		params.Filters = filterTuples
	}

	return params, nil
}

func parseSortTuples(raw string) ([]SortTuple, error) {
	var arr [][]any
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		return nil, err
	}

	parsed := make([]SortTuple, 0, len(arr))
	for _, item := range arr {
		if len(item) != 2 {
			return nil, fmt.Errorf("sort tuple must contain 2 values")
		}
		field, ok := item[0].(string)
		if !ok || strings.TrimSpace(field) == "" {
			return nil, fmt.Errorf("sort field must be a non-empty string")
		}
		dir, err := parseSortDirection(item[1])
		if err != nil {
			return nil, err
		}
		parsed = append(parsed, SortTuple{Field: field, Direction: dir})
	}
	return parsed, nil
}

func parseSortDirection(v any) (int, error) {
	switch n := v.(type) {
	case float64:
		switch int(n) {
		case 1:
			return 1, nil
		case -1:
			return -1, nil
		default:
			return 0, fmt.Errorf("sort direction must be 1 or -1")
		}
	case int:
		switch n {
		case 1, -1:
			return n, nil
		default:
			return 0, fmt.Errorf("sort direction must be 1 or -1")
		}
	default:
		return 0, fmt.Errorf("sort direction must be numeric")
	}
}

func parseFilterTuples(raw string) ([]FilterTuple, error) {
	var arr [][]any
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		return nil, err
	}

	parsed := make([]FilterTuple, 0, len(arr))
	for _, item := range arr {
		if len(item) != 3 {
			return nil, fmt.Errorf("filter tuple must contain 3 values")
		}
		field, ok := item[0].(string)
		if !ok || strings.TrimSpace(field) == "" {
			return nil, fmt.Errorf("filter field must be a non-empty string")
		}
		operator, ok := item[1].(string)
		if !ok || strings.TrimSpace(operator) == "" {
			return nil, fmt.Errorf("filter operator must be a non-empty string")
		}
		parsed = append(parsed, FilterTuple{Field: field, Operator: operator, Value: item[2]})
	}
	return parsed, nil
}
