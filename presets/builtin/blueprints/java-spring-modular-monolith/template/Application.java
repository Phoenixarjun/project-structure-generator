package {{javaPackage}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/* {{EXTENSION_POINT:application-imports}} */

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        /* {{EXTENSION_POINT:application-bootstrap}} */
        SpringApplication.run(Application.class, args);
    }
}
