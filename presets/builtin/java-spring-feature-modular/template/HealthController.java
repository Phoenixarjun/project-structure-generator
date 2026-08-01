package {{basePackage}}.{{featureName}}.api;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import {{basePackage}}.{{featureName}}.application.HealthQuery;

@RestController
@RequestMapping("/health")
public class HealthController {
    private final HealthQuery healthQuery;

    public HealthController(HealthQuery healthQuery) {
        this.healthQuery = healthQuery;
    }

    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", healthQuery.execute().value());
    }
}
