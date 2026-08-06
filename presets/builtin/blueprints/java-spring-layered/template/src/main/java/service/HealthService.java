package {{javaPackage}}.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class HealthService {
    public Map<String, String> getHealthStatus() {
        return Map.of("status", "ok", "app", "{{projectName}}");
    }
}
