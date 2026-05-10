package pagination

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestParseFromRequestParsesTupleSortAndFilters(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/examples?limit=25&offset=10&sort=%5B%5B%22name%22%2C1%5D%2C%5B%22created_at%22%2C-1%5D%5D&filters=%5B%5B%22name%22%2C%22like%22%2C%22Widget%22%5D%2C%5B%22is_active%22%2C%22%3D%22%2Ctrue%5D%5D", nil)

	params, err := ParseFromRequest(req)
	if err != nil {
		t.Fatalf("ParseFromRequest() error = %v", err)
	}

	if params.Limit != 25 {
		t.Fatalf("Limit = %d, want 25", params.Limit)
	}
	if params.Offset != 10 {
		t.Fatalf("Offset = %d, want 10", params.Offset)
	}
	if len(params.Sort) != 2 {
		t.Fatalf("len(Sort) = %d, want 2", len(params.Sort))
	}
	if params.Sort[0].Field != "name" || params.Sort[0].Direction != 1 {
		t.Fatalf("Sort[0] = %#v, want field name direction 1", params.Sort[0])
	}
	if params.Sort[1].Field != "created_at" || params.Sort[1].Direction != -1 {
		t.Fatalf("Sort[1] = %#v, want field created_at direction -1", params.Sort[1])
	}
	if len(params.Filters) != 2 {
		t.Fatalf("len(Filters) = %d, want 2", len(params.Filters))
	}
	if params.Filters[0].Field != "name" || params.Filters[0].Operator != "like" {
		t.Fatalf("Filters[0] = %#v, want field name operator like", params.Filters[0])
	}
	if v, ok := params.Filters[0].Value.(string); !ok || v != "Widget" {
		t.Fatalf("Filters[0].Value = %#v, want \"Widget\"", params.Filters[0].Value)
	}
	if params.Filters[1].Field != "is_active" || params.Filters[1].Operator != "=" {
		t.Fatalf("Filters[1] = %#v, want field is_active operator =", params.Filters[1])
	}
	if v, ok := params.Filters[1].Value.(bool); !ok || !v {
		t.Fatalf("Filters[1].Value = %#v, want true", params.Filters[1].Value)
	}
}

func TestParseFromRequestReturnsErrorForMalformedJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/examples?filters=%5Bbad-json", nil)

	_, err := ParseFromRequest(req)
	if err == nil {
		t.Fatal("ParseFromRequest() error = nil, want error")
	}
}
