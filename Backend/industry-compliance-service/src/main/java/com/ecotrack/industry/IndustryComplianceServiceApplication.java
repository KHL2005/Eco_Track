package com.ecotrack.industry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(exclude = {
        MongoRepositoriesAutoConfiguration.class
})
@EnableDiscoveryClient
@EnableFeignClients
public class IndustryComplianceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IndustryComplianceServiceApplication.class, args);
    }
}

