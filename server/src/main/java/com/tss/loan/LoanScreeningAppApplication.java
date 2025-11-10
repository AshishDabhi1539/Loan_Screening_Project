package com.tss.loan;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@EnableScheduling // Enable scheduled tasks for cleanup jobs
@EnableAsync
public class LoanScreeningAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(LoanScreeningAppApplication.class, args);
	}

}
