package main

import (
	"fmt"
	"net/http"

	"{{goModule}}/internal/config"
	infraHttp "{{goModule}}/internal/http"
	"{{goModule}}/internal/service"
)

func main() {
	cfg := config.Load()
	svc := service.NewHealthService()
	h := infraHttp.NewHandler(svc)

	http.HandleFunc("/health", h.HealthHandler)
	fmt.Printf("Starting %s on port %s...\n", cfg.AppName, cfg.Port)
	_ = http.ListenAndServe(":"+cfg.Port, nil)
}
