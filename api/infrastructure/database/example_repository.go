package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/yourorg/boilerplate/internal/domain/example"
	"github.com/yourorg/boilerplate/pkg/pagination"
	"github.com/yourorg/boilerplate/pkg/scope"
)

// ExampleRepository adalah concrete implementation dari example.WriteRepository + ReadRepository.
// Semua query menyertakan tenant_id + company_id agar isolasi data antar org terjamin.
type ExampleRepository struct {
	db *sqlx.DB
}

// NewExampleRepository membuat instance baru ExampleRepository.
func NewExampleRepository(db *sqlx.DB) *ExampleRepository {
	return &ExampleRepository{db: db}
}

// ── WriteRepository ───────────────────────────────────────────────────────────

// Save menyimpan entity Example baru ke database.
func (r *ExampleRepository) Save(ctx context.Context, s scope.Scope, e *example.Example) error {
	const q = `
		INSERT INTO examples (id, tenant_id, company_id, name, description, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := r.db.ExecContext(ctx, q,
		e.ID, s.TenantID, s.CompanyID,
		e.Name, e.Description, e.IsActive,
		e.CreatedAt, e.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save example: %w", err)
	}
	return nil
}

// Update mengupdate Example yang sudah ada berdasarkan ID + scope.
func (r *ExampleRepository) Update(ctx context.Context, s scope.Scope, e *example.Example) error {
	const q = `
		UPDATE examples
		SET name = $4, description = $5, is_active = $6, updated_at = $7
		WHERE tenant_id = $1 AND company_id = $2 AND id = $3 AND deleted_at IS NULL`

	res, err := r.db.ExecContext(ctx, q,
		s.TenantID, s.CompanyID, e.ID,
		e.Name, e.Description, e.IsActive, time.Now().UTC(),
	)
	if err != nil {
		return fmt.Errorf("update example: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return example.ErrNotFound
	}
	return nil
}

// Delete melakukan soft delete (mengisi deleted_at = now()).
func (r *ExampleRepository) Delete(ctx context.Context, s scope.Scope, id uuid.UUID) error {
	const q = `
		UPDATE examples SET deleted_at = NOW(), updated_at = NOW()
		WHERE tenant_id = $1 AND company_id = $2 AND id = $3 AND deleted_at IS NULL`

	res, err := r.db.ExecContext(ctx, q, s.TenantID, s.CompanyID, id)
	if err != nil {
		return fmt.Errorf("delete example: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return example.ErrNotFound
	}
	return nil
}

// ── ReadRepository ────────────────────────────────────────────────────────────

// GetByID mengambil satu Example berdasarkan ID + scope.
func (r *ExampleRepository) GetByID(ctx context.Context, s scope.Scope, id uuid.UUID) (*example.Example, error) {
	const q = `
		SELECT id, name, description, is_active, created_at, updated_at, deleted_at
		FROM examples
		WHERE tenant_id = $1 AND company_id = $2 AND id = $3 AND deleted_at IS NULL`

	var e example.Example
	err := r.db.QueryRowContext(ctx, q, s.TenantID, s.CompanyID, id).Scan(
		&e.ID, &e.Name, &e.Description, &e.IsActive, &e.CreatedAt, &e.UpdatedAt, &e.DeletedAt,
	)
	if err == sql.ErrNoRows {
		return nil, example.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get example by id: %w", err)
	}
	return &e, nil
}

// List mengambil daftar Example dengan pagination + sorting.
// Filter dan sort sudah dinormalisasi oleh HTTP handler layer, tapi repository tetap whitelisted.
func (r *ExampleRepository) List(ctx context.Context, s scope.Scope, params pagination.ListParams) ([]*example.Example, int, error) {
	total, err := r.countExamples(ctx, s, params.Filters)
	if err != nil {
		return nil, 0, err
	}
	rows, err := r.selectExamples(ctx, s, params)
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

// countExamples menghitung total Example aktif milik scope ini.
func (r *ExampleRepository) countExamples(ctx context.Context, s scope.Scope, filters []pagination.FilterTuple) (int, error) {
	whereClause, args, err := buildWhereClause(s, filters)
	if err != nil {
		return 0, err
	}
	q := `SELECT COUNT(*) FROM examples WHERE ` + whereClause
	var total int
	if err := r.db.QueryRowContext(ctx, q, args...).Scan(&total); err != nil {
		return 0, fmt.Errorf("count examples: %w", err)
	}
	return total, nil
}

// selectExamples mengambil baris dengan ORDER BY + LIMIT/OFFSET.
func (r *ExampleRepository) selectExamples(ctx context.Context, s scope.Scope, params pagination.ListParams) ([]*example.Example, error) {
	whereClause, args, err := buildWhereClause(s, params.Filters)
	if err != nil {
		return nil, err
	}
	orderClause := buildOrderClause(params.Sort)
	limitPos := len(args) + 1
	offsetPos := len(args) + 2
	q := fmt.Sprintf(
		`SELECT id, name, description, is_active, created_at, updated_at, deleted_at
		 FROM examples
		 WHERE %s%s LIMIT $%d OFFSET $%d`,
		whereClause, orderClause, limitPos, offsetPos,
	)
	args = append(args, params.Limit, params.Offset)
	rows, err := r.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list examples: %w", err)
	}
	defer rows.Close()
	return scanExamples(rows)
}

func buildWhereClause(s scope.Scope, filters []pagination.FilterTuple) (string, []any, error) {
	clauses := []string{
		"tenant_id = $1",
		"company_id = $2",
		"deleted_at IS NULL",
	}
	args := []any{s.TenantID, s.CompanyID}
	nextArg := 3

	for _, filter := range filters {
		column, ok := allowedFilterColumns[filter.Field]
		if !ok {
			continue
		}
		clause, values, ok, err := buildFilterClause(column, filter.Operator, filter.Value, nextArg)
		if err != nil {
			return "", nil, err
		}
		if !ok {
			continue
		}
		clauses = append(clauses, clause)
		args = append(args, values...)
		nextArg += len(values)
	}

	return strings.Join(clauses, " AND "), args, nil
}

func buildOrderClause(sortTuples []pagination.SortTuple) string {
	if len(sortTuples) == 0 {
		return " ORDER BY created_at DESC"
	}

	parts := make([]string, 0, len(sortTuples))
	for _, tuple := range sortTuples {
		column, ok := allowedSortColumns[tuple.Field]
		if !ok {
			continue
		}
		direction := "ASC"
		if tuple.Direction < 0 {
			direction = "DESC"
		}
		parts = append(parts, fmt.Sprintf("%s %s", column, direction))
	}
	if len(parts) == 0 {
		return " ORDER BY created_at DESC"
	}
	return " ORDER BY " + strings.Join(parts, ", ")
}

func buildFilterClause(column, operator string, value any, argPos int) (string, []any, bool, error) {
	switch strings.ToLower(operator) {
	case "=":
		return fmt.Sprintf("%s = $%d", column, argPos), []any{value}, true, nil
	case "!=", "<>":
		return fmt.Sprintf("%s <> $%d", column, argPos), []any{value}, true, nil
	case "like":
		s, ok := value.(string)
		if !ok {
			return "", nil, false, fmt.Errorf("like filter must use a string value")
		}
		return fmt.Sprintf("%s ILIKE $%d", column, argPos), []any{"%" + s + "%"}, true, nil
	case "in":
		items, err := toSlice(value)
		if err != nil {
			return "", nil, false, fmt.Errorf("in filter must use an array value: %w", err)
		}
		if len(items) == 0 {
			return "", nil, false, fmt.Errorf("in filter must contain at least one value")
		}
		placeholders := make([]string, 0, len(items))
		args := make([]any, 0, len(items))
		for i, item := range items {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argPos+i))
			args = append(args, item)
		}
		return fmt.Sprintf("%s IN (%s)", column, strings.Join(placeholders, ", ")), args, true, nil
	case ">":
		return fmt.Sprintf("%s > $%d", column, argPos), []any{value}, true, nil
	case ">=":
		return fmt.Sprintf("%s >= $%d", column, argPos), []any{value}, true, nil
	case "<":
		return fmt.Sprintf("%s < $%d", column, argPos), []any{value}, true, nil
	case "<=":
		return fmt.Sprintf("%s <= $%d", column, argPos), []any{value}, true, nil
	case "between":
		items, err := toSlice(value)
		if err != nil {
			return "", nil, false, fmt.Errorf("between filter must use an array value: %w", err)
		}
		if len(items) != 2 {
			return "", nil, false, fmt.Errorf("between filter must contain exactly two values")
		}
		return fmt.Sprintf("%s BETWEEN $%d AND $%d", column, argPos, argPos+1), []any{items[0], items[1]}, true, nil
	case "is":
		switch v := value.(type) {
		case nil:
			return fmt.Sprintf("%s IS NULL", column), nil, true, nil
		case bool:
			if v {
				return fmt.Sprintf("%s IS TRUE", column), nil, true, nil
			}
			return fmt.Sprintf("%s IS FALSE", column), nil, true, nil
		case string:
			switch strings.ToLower(strings.TrimSpace(v)) {
			case "", "null":
				return fmt.Sprintf("%s IS NULL", column), nil, true, nil
			case "not null":
				return fmt.Sprintf("%s IS NOT NULL", column), nil, true, nil
			case "true":
				return fmt.Sprintf("%s IS TRUE", column), nil, true, nil
			case "false":
				return fmt.Sprintf("%s IS FALSE", column), nil, true, nil
			default:
				return "", nil, false, fmt.Errorf("unsupported is filter value %q", v)
			}
		default:
			return "", nil, false, fmt.Errorf("unsupported is filter value type %T", value)
		}
	default:
		return "", nil, false, fmt.Errorf("unsupported filter operator %q", operator)
	}
}

func toSlice(value any) ([]any, error) {
	switch v := value.(type) {
	case []any:
		return v, nil
	case []string:
		out := make([]any, 0, len(v))
		for _, item := range v {
			out = append(out, item)
		}
		return out, nil
	case nil:
		return nil, fmt.Errorf("value is nil")
	default:
		return nil, fmt.Errorf("expected array, got %T", value)
	}
}

func scanExamples(rows *sql.Rows) ([]*example.Example, error) {
	var results []*example.Example
	for rows.Next() {
		var e example.Example
		if err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.IsActive, &e.CreatedAt, &e.UpdatedAt, &e.DeletedAt); err != nil {
			return nil, err
		}
		results = append(results, &e)
	}
	return results, rows.Err()
}

var allowedSortColumns = map[string]string{
	"name":       "name",
	"created_at": "created_at",
}

var allowedFilterColumns = map[string]string{
	"name":        "name",
	"description": "description",
	"is_active":   "is_active",
	"created_at":  "created_at",
}
