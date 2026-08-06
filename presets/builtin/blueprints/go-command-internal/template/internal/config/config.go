package config

type Config struct {
	AppName string
	Port    string
}

func Load() Config {
	return Config{
		AppName: "{{projectName}}",
		Port:    "8080",
	}
}
