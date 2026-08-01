package {{basePackage}}.service.impl;

import java.util.Map;
import org.springframework.stereotype.Service;
import {{basePackage}}.service.HealthService;

@Service
public class HealthServiceImpl implements HealthService {
    @Override
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
