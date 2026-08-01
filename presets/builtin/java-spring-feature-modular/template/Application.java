package {{basePackage}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class {{applicationClass}}Application {
    public static void main(String[] args) {
        SpringApplication.run({{applicationClass}}Application.class, args);
    }
}
