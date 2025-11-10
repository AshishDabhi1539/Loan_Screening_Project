package com.tss.loan.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

/**
 * Configuration for External Authority Database
 * This configuration handles the external_authority_db database
 * which stores credit profiles, fraud records, and loan history
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.tss.loan.repository.external",
    entityManagerFactoryRef = "externalEntityManagerFactory",
    transactionManagerRef = "externalTransactionManager"
)
public class ExternalDatabaseConfig {

    /**
     * External DataSource for external authority database
     * Uses spring.datasource.external.* properties from application.properties
     */
    @Bean(name = "externalDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.external")
    public DataSource externalDataSource() {
        return DataSourceBuilder.create().build();
    }

    /**
     * External EntityManagerFactory for external authority entities
     * Only scans com.tss.loan.entity.external package
     */
    @Bean(name = "externalEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean externalEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("externalDataSource") DataSource dataSource) {
        return builder
                .dataSource(dataSource)
                .packages("com.tss.loan.entity.external")
                .persistenceUnit("external")
                .properties(java.util.Map.of(
                    "hibernate.hbm2ddl.auto", "update",
                    "hibernate.dialect", "org.hibernate.dialect.MySQLDialect",
                    "hibernate.show_sql", "true",
                    "hibernate.format_sql", "true"
                ))
                .build();
    }

    /**
     * External TransactionManager for external authority operations
     */
    @Bean(name = "externalTransactionManager")
    public PlatformTransactionManager externalTransactionManager(
            @Qualifier("externalEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
