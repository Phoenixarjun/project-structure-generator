package {{basePackage}}.{{featureName}}.application;

import org.springframework.stereotype.Service;
import {{basePackage}}.{{featureName}}.domain.HealthStatus;

@Service
public class HealthQuery {
    public HealthStatus execute() {
        return new HealthStatus("ok");
    }
}
