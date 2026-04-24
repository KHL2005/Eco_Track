package com.ecotrack.iam.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares Kafka topics. Spring will auto-create them if they don't exist
 * (requires auto.create.topics.enable=true on the Kafka broker, which is the default).
 */
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic issueCreatedTopic() {
        return TopicBuilder.name("ecotrack.issue.created")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic analysisCompletedTopic() {
        return TopicBuilder.name("ecotrack.analysis.completed")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic complianceTriggeredTopic() {
        return TopicBuilder.name("ecotrack.compliance.triggered")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic projectEventsTopic() {
        return TopicBuilder.name("ecotrack.project.events")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
