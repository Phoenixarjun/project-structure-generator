package main

import (
	"fmt"
	"net/http"

	"{{goModule}}/internal/app"
)
/* {{EXTENSION_POINT:application-imports}} */

func main() {
	/* {{EXTENSION_POINT:application-bootstrap}} */
	application := app.NewApplication("{{projectName}}")
	fmt.Printf("Starting %s...\n", application.Name)
	_ = http.ListenAndServe(":8080", nil)
}
