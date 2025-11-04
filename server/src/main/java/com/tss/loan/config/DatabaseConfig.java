package com.tss.loan.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

/**
 * Configuration for Primary Database (loan_screening_db)
 * This configuration handles the main application database
 * which stores user data, loan applications, and internal system data
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.tss.loan.repository",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX, 
        pattern = "com\\.tss\\.loan\\.repository\\.external\\..+"
    )
)
public class DatabaseConfig {

    /**
     * Primary DataSource for main application database
     * Uses spring.datasource.primary.* properties from application.properties
     */
    @Primary
    @Bean(name = "dataSource")
    @ConfigurationProperties(prefix = "spring.datasource.primary")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

    /**
     * Primary EntityManagerFactory for main application entities
     * Scans all packages except external
     */
    @Primary
    @Bean(name = "entityManagerFactory")
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("dataSource") DataSource dataSource) {
        return builder
                .dataSource(dataSource)
                .packages(
                    "com.tss.loan.entity.user",
                    "com.tss.loan.entity.applicant",
                    "com.tss.loan.entity.financial",
                    "com.tss.loan.entity.loan",
                    "com.tss.loan.entity.fraud",
                    "com.tss.loan.entity.security",
                    "com.tss.loan.entity.system",
                    "com.tss.loan.entity.workflow",
                    "com.tss.loan.entity.officer",
                    "com.tss.loan.entity.compliance",
                    "com.tss.loan.entity.enums"
                )
                .persistenceUnit("primary")
                .properties(java.util.Map.of(
                    "hibernate.hbm2ddl.auto", "update",
                    "hibernate.dialect", "org.hibernate.dialect.MySQLDialect",
                    "hibernate.show_sql", "true",
                    "hibernate.format_sql", "true"
                ))
                .build();
    }

    /**
     * Primary TransactionManager for main application operations
     */
    @Primary
    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(
            @Qualifier("entityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
