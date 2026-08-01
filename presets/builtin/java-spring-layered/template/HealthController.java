package {{basePackage}}.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import {{basePackage}}.service.HealthService;

@RestController
@RequestMapping("/health")
public class HealthController {
    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public Map<String, String> health() {
        return healthService.health();
    }
}
