package http

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"{{goModule}}/internal/service"
)

func TestHealthHandler(t *testing.T) {
	svc := service.NewHealthService()
	h := NewHandler(svc)

	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()

	h.HealthHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}
