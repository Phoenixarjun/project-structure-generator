from fastapi import FastAPI
# {{EXTENSION_POINT:application-imports}}

app = FastAPI(title="{{projectName}}")
# {{EXTENSION_POINT:application-bootstrap}}

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "{{projectName}}"}
