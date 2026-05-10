package http

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/yourorg/boilerplate/pkg/commandbus"
	"github.com/yourorg/boilerplate/pkg/querybus"
)

func TestExampleHandlerListReturnsBadRequestForMalformedQueryJSON(t *testing.T) {
	h := NewExampleHandler(&commandbus.CommandBus{}, &querybus.QueryBus{})
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/examples?filters=%5Bbad-json", nil)

	h.List(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusBadRequest)
	}
}
