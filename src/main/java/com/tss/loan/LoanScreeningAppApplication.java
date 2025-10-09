package com.tss.loan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.tss.loan.repository")
@EnableTransactionManagement
@EnableAsync
public class LoanScreeningAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(LoanScreeningAppApplication.class, args);
	}

}
