package main

type Config struct {
	AppName string
	Port    string
}

func LoadConfig() Config {
	return Config{
		AppName: "{{projectName}}",
		Port:    "8080",
	}
}
