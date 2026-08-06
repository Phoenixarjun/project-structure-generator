package main

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	service *HealthService
}

func NewHandler(svc *HealthService) *Handler {
	return &Handler{service: svc}
}

func (h *Handler) HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.service.GetStatus())
}
