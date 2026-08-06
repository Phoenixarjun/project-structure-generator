package http

import (
	"encoding/json"
	"net/http"

	"{{goModule}}/internal/service"
)

type Handler struct {
	service *service.HealthService
}

func NewHandler(svc *service.HealthService) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.service.GetStatus())
}
