package com.tss.loan.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Jackson Configuration for proper datetime handling
 * Handles MySQL datetime format: "yyyy-MM-dd HH:mm:ss.SSSSSS"
 */
@Configuration
public class JacksonConfig {

    // MySQL datetime format pattern
    private static final String MYSQL_DATETIME_PATTERN = "yyyy-MM-dd HH:mm:ss.SSSSSS";
    private static final DateTimeFormatter MYSQL_DATETIME_FORMATTER = DateTimeFormatter.ofPattern(MYSQL_DATETIME_PATTERN);
    
    // ISO datetime format for output
    private static final String ISO_DATETIME_PATTERN = "yyyy-MM-dd'T'HH:mm:ss.SSS";
    private static final DateTimeFormatter ISO_DATETIME_FORMATTER = DateTimeFormatter.ofPattern(ISO_DATETIME_PATTERN);

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Register JavaTimeModule for LocalDateTime support
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Custom deserializer for MySQL datetime format
        javaTimeModule.addDeserializer(LocalDateTime.class, 
            new LocalDateTimeDeserializer(MYSQL_DATETIME_FORMATTER));
        
        // Custom serializer for ISO format output
        javaTimeModule.addSerializer(LocalDateTime.class, 
            new LocalDateTimeSerializer(ISO_DATETIME_FORMATTER));
        
        mapper.registerModule(javaTimeModule);
        
        // Disable writing dates as timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Configure to handle unknown properties gracefully
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        return mapper;
    }
}
