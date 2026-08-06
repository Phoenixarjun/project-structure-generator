package main

import (
	"fmt"
	"net/http"
)

func main() {
	cfg := LoadConfig()
	svc := NewHealthService()
	h := NewHandler(svc)

	http.HandleFunc("/health", h.HealthHandler)
	fmt.Printf("Starting %s on port %s...\n", cfg.AppName, cfg.Port)
	_ = http.ListenAndServe(":"+cfg.Port, nil)
}
