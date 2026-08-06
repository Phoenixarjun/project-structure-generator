package main

type HealthService struct{}

func NewHealthService() *HealthService {
	return &HealthService{}
}

func (s *HealthService) GetStatus() map[string]string {
	return map[string]string{
		"status": "ok",
		"app":    "{{projectName}}",
	}
}
