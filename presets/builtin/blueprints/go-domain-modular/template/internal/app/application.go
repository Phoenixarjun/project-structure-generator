package app

type Application struct {
	Name string
}

func NewApplication(name string) *Application {
	return &Application{Name: name}
}
