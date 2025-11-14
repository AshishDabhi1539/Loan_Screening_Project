# Complete Java Concepts Analysis - Loan Screening Application

This document provides a comprehensive analysis of all Java concepts used in the codebase, from basic OOPs to advanced Spring Boot features.

---

## Table of Contents
1. [Basic Java Concepts](#basic-java-concepts)
2. [Object-Oriented Programming (OOPs)](#object-oriented-programming-oops)
3. [Java Collections Framework](#java-collections-framework)
4. [Exception Handling](#exception-handling)
5. [Java 8+ Features](#java-8-features)
6. [Java Persistence API (JPA) / Hibernate](#java-persistence-api-jpa--hibernate)
7. [Spring Framework Core](#spring-framework-core)
8. [Spring Boot](#spring-boot)
9. [Spring Data JPA](#spring-data-jpa)
10. [Spring Security](#spring-security)
11. [Spring Web (REST APIs)](#spring-web-rest-apis)
12. [Bean Validation](#bean-validation)
13. [Lombok](#lombok)
14. [Design Patterns](#design-patterns)
15. [Advanced Concepts](#advanced-concepts)

---

## Basic Java Concepts

### 1. **Packages**
- **Usage**: Organized code into logical groups
- **Example**: `package com.tss.loan.controller.auth;`
- **Details**: All classes are organized in packages following domain-driven structure (controller, service, repository, entity, dto, config, etc.)

### 2. **Import Statements**
- **Usage**: Import classes from other packages
- **Example**: `import org.springframework.beans.factory.annotation.Autowired;`
- **Details**: Used extensively for Spring Framework, JPA, Lombok, and custom classes

### 3. **Class Declaration**
- **Usage**: Define classes with access modifiers
- **Example**: `public class AuthController { }`
- **Details**: Classes are declared with `public` access modifier for Spring component scanning

### 4. **Variables (Fields)**
- **Usage**: Store data in classes
- **Types Used**:
  - Primitive types: `int`, `long`, `boolean`
  - Wrapper classes: `Integer`, `Long`, `Boolean`
  - Reference types: `String`, `UUID`, `BigDecimal`, `LocalDateTime`, `LocalDate`
- **Example**: `private String email;`, `private UUID id;`, `private BigDecimal requestedAmount;`

### 5. **Access Modifiers**
- **Usage**: Control visibility of classes, methods, and fields
- **Types Used**:
  - `private`: Fields in entities and DTOs
  - `public`: Methods in controllers and services
  - `protected`: Lifecycle callbacks in entities
- **Example**: `private String email;`, `public ResponseEntity<LoginResponse> login(...)`

### 6. **Methods**
- **Usage**: Define behavior in classes
- **Types**:
  - Instance methods: Most service and controller methods
  - Static methods: Utility methods (if any)
  - Constructor methods: Lombok-generated
- **Example**: `public RegistrationResponse register(UserRegistrationRequest request)`

### 7. **Method Parameters**
- **Usage**: Pass data to methods
- **Types**: Objects, primitives, varargs
- **Example**: `public ResponseEntity<LoginResponse> login(@Valid @RequestBody UserLoginRequest request)`

### 8. **Return Types**
- **Usage**: Return values from methods
- **Types**: Primitives, Objects, Collections, Optional
- **Example**: `public ResponseEntity<LoginResponse>`, `public Optional<User>`, `public List<User>`

### 9. **Primitive Data Types**
- **Usage**: Store simple values
- **Types Used**: `int`, `long`, `boolean`, `double`
- **Example**: `private Integer tenureMonths;`, `private Boolean isEmailVerified;`

### 10. **Wrapper Classes**
- **Usage**: Object representation of primitives
- **Types Used**: `Integer`, `Long`, `Boolean`, `Double`
- **Example**: `private Integer riskScore;`, `private Long version;`

### 11. **String Class**
- **Usage**: Text manipulation and storage
- **Methods Used**: `equals()`, `toString()`, `split()`, `trim()`, `isEmpty()`, `startsWith()`, `substring()`
- **Example**: `user.getEmail().split("@")[0]`, `authHeader.startsWith("Bearer ")`

### 12. **StringBuilder**
- **Usage**: Efficient string concatenation
- **Example**: In `ApplicantPersonalDetails.getFullName()` method
```java
StringBuilder name = new StringBuilder(firstName.trim());
if (middleName != null && !middleName.trim().isEmpty()) {
    name.append(" ").append(middleName.trim());
}
```

### 13. **Arrays**
- **Usage**: Store fixed-size collections
- **Example**: `Arrays.asList("*")` in CORS configuration

### 14. **Comments**
- **Usage**: Document code
- **Types**: Single-line (`//`), Multi-line (`/* */`), JavaDoc (`/** */`)
- **Example**: Extensive JavaDoc comments in service interfaces

---

## Object-Oriented Programming (OOPs)

### 1. **Classes**
- **Usage**: Blueprint for objects
- **Types in Codebase**:
  - Entity classes: `User`, `LoanApplication`, `ApplicantPersonalDetails`
  - Service classes: `AuthServiceImpl`, `LoanApplicationServiceImpl`
  - Controller classes: `AuthController`, `AdminController`
  - DTO classes: `UserRegistrationRequest`, `LoginResponse`
  - Configuration classes: `SecurityConfig`, `ModelMapperConfig`
- **Example**: `public class AuthController { }`

### 2. **Objects**
- **Usage**: Instances of classes created by Spring container
- **Example**: `User user = new User();` (manual) or `@Autowired private AuthService authService;` (Spring-managed)

### 3. **Encapsulation**
- **Usage**: Hide internal implementation details
- **Implementation**:
  - Private fields with public getters/setters (via Lombok `@Data`)
  - Access control through access modifiers
- **Example**: All entity fields are private, accessed via Lombok-generated getters/setters

### 4. **Inheritance**
- **Usage**: Reuse code and establish relationships
- **Types Used**:
  - Class inheritance: `LoanApiException extends RuntimeException`
  - Interface implementation: `AuthServiceImpl implements AuthService`
- **Example**:
```java
public class LoanApiException extends RuntimeException {
    // Custom exception extending RuntimeException
}
```

### 5. **Polymorphism**
- **Usage**: Same interface, different implementations
- **Types**:
  - **Runtime Polymorphism**: Interface implementations
    - `AuthServiceImpl implements AuthService`
    - `LoanApplicationServiceImpl implements LoanApplicationService`
  - **Method Overriding**: Override interface methods
  - **Method Overloading**: Same method name, different parameters
- **Example**: Multiple service implementations implementing the same interface

### 6. **Abstraction**
- **Usage**: Hide complexity, show only essential features
- **Implementation**:
  - **Interfaces**: Define contracts (`AuthService`, `UserService`, `LoanApplicationService`)
  - **Abstract Classes**: Not extensively used, but can be used
- **Example**:
```java
public interface AuthService {
    RegistrationResponse register(UserRegistrationRequest request);
    LoginResponse login(UserLoginRequest request);
}
```

### 7. **Interfaces**
- **Usage**: Define contracts for classes
- **Examples**:
  - Service interfaces: `AuthService`, `UserService`, `LoanApplicationService`
  - Repository interfaces: `UserRepository extends JpaRepository<User, UUID>`
- **Example**:
```java
public interface AuthService {
    RegistrationResponse register(UserRegistrationRequest request);
    LoginResponse login(UserLoginRequest request);
}
```

### 8. **Abstract Classes**
- **Usage**: Partial implementation, cannot be instantiated
- **Note**: Not extensively used in this codebase, but concept is available

### 9. **Constructors**
- **Usage**: Initialize objects
- **Types**:
  - Default constructor: Generated by Lombok `@NoArgsConstructor`
  - Parameterized constructor: Generated by Lombok `@AllArgsConstructor` or `@RequiredArgsConstructor`
- **Example**: Lombok annotations generate constructors automatically

### 10. **Method Overriding**
- **Usage**: Provide specific implementation in child class
- **Example**: Service implementations override interface methods
```java
@Override
public RegistrationResponse register(UserRegistrationRequest request) {
    // Implementation
}
```

### 11. **Method Overloading**
- **Usage**: Same method name, different parameters
- **Example**: Multiple constructors or methods with different signatures

### 12. **this Keyword**
- **Usage**: Reference current object instance
- **Example**: Used implicitly in setters and constructors

### 13. **super Keyword**
- **Usage**: Reference parent class
- **Example**: `super(source)` in `NotificationDomainEvent extends ApplicationEvent`

### 14. **static Keyword**
- **Usage**: Belongs to class, not instance
- **Example**: `public static void main(String[] args)` in main application class

### 15. **final Keyword**
- **Usage**: Prevent modification
- **Types**:
  - Final variables: Constants
  - Final methods: Cannot be overridden
  - Final classes: Cannot be extended
- **Example**: `private static final Logger log = LoggerFactory.getLogger(...)`

---

## Java Collections Framework

### 1. **List Interface**
- **Usage**: Ordered collection, allows duplicates
- **Implementation**: `ArrayList`, `LinkedList`
- **Example**: `List<User> findAllOfficers()`, `List<Notification> failed = ...`

### 2. **Set Interface**
- **Usage**: No duplicates collection
- **Implementation**: `HashSet`, `LinkedHashSet`, `TreeSet`
- **Example**: Used in collections where uniqueness is required

### 3. **Map Interface**
- **Usage**: Key-value pairs
- **Implementation**: `HashMap`, `LinkedHashMap`
- **Example**: 
```java
Map<String, String> errors = new HashMap<>();
Map<String, Object> variables; // In NotificationDomainEvent
```

### 4. **ArrayList**
- **Usage**: Dynamic array implementation of List
- **Example**: `List<User> users = new ArrayList<>();`

### 5. **HashMap**
- **Usage**: Hash table implementation of Map
- **Example**: `Map<String, String> errors = new HashMap<>();`

### 6. **Optional**
- **Usage**: Container object that may or may not contain a value
- **Example**: 
```java
Optional<User> findByEmail(String email);
Optional<User> user = userRepository.findByEmail(email);
user.orElseThrow(() -> new LoanApiException("User not found"));
```

### 7. **Collections Utility Methods**
- **Usage**: Static utility methods for collections
- **Example**: `Arrays.asList("*")` for creating lists

---

## Exception Handling

### 1. **try-catch Blocks**
- **Usage**: Handle exceptions gracefully
- **Example**:
```java
try {
    User user = userService.findByEmail(email);
} catch (LoanApiException e) {
    throw e;
} catch (Exception e) {
    throw new LoanApiException("Error: " + e.getMessage());
}
```

### 2. **throw Keyword**
- **Usage**: Explicitly throw exceptions
- **Example**: `throw new LoanApiException("User not found");`

### 3. **throws Keyword**
- **Usage**: Declare exceptions that method might throw
- **Example**: `public AuthenticationManager authenticationManager(...) throws Exception`

### 4. **Custom Exceptions**
- **Usage**: Application-specific exceptions
- **Example**: `LoanApiException extends RuntimeException`
```java
public class LoanApiException extends RuntimeException {
    private HttpStatus status;
    private String message;
}
```

### 5. **Exception Hierarchy**
- **Usage**: Organize exceptions
- **Types**:
  - `RuntimeException`: Unchecked exceptions
  - `Exception`: Checked exceptions
- **Example**: `LoanApiException extends RuntimeException`

### 6. **Global Exception Handler**
- **Usage**: Centralized exception handling
- **Implementation**: `@RestControllerAdvice` with `@ExceptionHandler`
- **Example**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(LoanApiException.class)
    public ResponseEntity<ErrorResponse> handleLoanApiException(...) { }
}
```

### 7. **Exception Types Used**
- `RuntimeException`: Base for custom exceptions
- `IllegalArgumentException`: Invalid arguments
- `NullPointerException`: Null references (handled)
- Custom: `LoanApiException`

---

## Java 8+ Features

### 1. **Lambda Expressions**
- **Usage**: Anonymous functions
- **Example**: Used in Stream API operations, functional interfaces

### 2. **Stream API**
- **Usage**: Process collections in functional style
- **Example**: Used in filtering, mapping, and processing collections

### 3. **Optional Class**
- **Usage**: Avoid null pointer exceptions
- **Example**: 
```java
Optional<User> user = userRepository.findByEmail(email);
user.ifPresent(u -> System.out.println(u.getEmail()));
```

### 4. **LocalDate and LocalDateTime**
- **Usage**: Modern date/time API (Java 8+)
- **Example**: 
```java
private LocalDateTime createdAt;
private LocalDate dateOfBirth;
LocalDateTime.now()
```

### 5. **Period and Duration**
- **Usage**: Calculate time differences
- **Example**: 
```java
java.time.Period.between(dateOfBirth, LocalDate.now()).getYears()
```

### 6. **Method References**
- **Usage**: Reference methods
- **Example**: Used in Stream API operations

### 7. **Functional Interfaces**
- **Usage**: Single abstract method interfaces
- **Example**: Used with lambda expressions

### 8. **Default Methods in Interfaces**
- **Usage**: Provide default implementation in interfaces
- **Example**: Spring Data JPA interfaces have default methods

---

## Java Persistence API (JPA) / Hibernate

### 1. **@Entity Annotation**
- **Usage**: Mark class as JPA entity
- **Example**: `@Entity public class User { }`

### 2. **@Table Annotation**
- **Usage**: Specify database table name
- **Example**: `@Table(name = "loan_applications")`

### 3. **@Id Annotation**
- **Usage**: Mark primary key field
- **Example**: `@Id @GeneratedValue private UUID id;`

### 4. **@GeneratedValue Annotation**
- **Usage**: Auto-generate primary key
- **Example**: `@GeneratedValue private UUID id;`

### 5. **@Column Annotation**
- **Usage**: Map field to database column
- **Attributes**: `name`, `nullable`, `length`, `unique`, `precision`, `scale`, `columnDefinition`
- **Example**: 
```java
@Column(nullable = false, length = 150, unique = true)
private String email;
```

### 6. **@OneToOne Relationship**
- **Usage**: One-to-one entity relationship
- **Example**: 
```java
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false, unique = true)
private User user;
```

### 7. **@OneToMany Relationship**
- **Usage**: One-to-many entity relationship
- **Example**: 
```java
@OneToMany(mappedBy = "loanApplication", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<LoanDocument> documents;
```

### 8. **@ManyToOne Relationship**
- **Usage**: Many-to-one entity relationship
- **Example**: 
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "applicant_id", nullable = false)
private User applicant;
```

### 9. **@ManyToMany Relationship**
- **Usage**: Many-to-many entity relationship
- **Note**: Not extensively used in this codebase

### 10. **@JoinColumn Annotation**
- **Usage**: Specify foreign key column
- **Example**: `@JoinColumn(name = "user_id")`

### 11. **@Enumerated Annotation**
- **Usage**: Map enum to database
- **Example**: 
```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 50)
private ApplicationStatus status;
```

### 12. **FetchType (LAZY vs EAGER)**
- **Usage**: Control when related entities are loaded
- **Types**: `LAZY` (default), `EAGER`
- **Example**: `@OneToOne(fetch = FetchType.LAZY)`

### 13. **CascadeType**
- **Usage**: Define cascade operations
- **Types**: `ALL`, `PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH`
- **Example**: `cascade = CascadeType.ALL`

### 14. **@PrePersist Annotation**
- **Usage**: Execute before entity is persisted
- **Example**: 
```java
@PrePersist
protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
}
```

### 15. **@PreUpdate Annotation**
- **Usage**: Execute before entity is updated
- **Example**: 
```java
@PreUpdate
protected void onUpdate() {
    updatedAt = LocalDateTime.now();
}
```

### 16. **@Version Annotation**
- **Usage**: Optimistic locking
- **Example**: `@Version private Long version;`

### 17. **@Index Annotation**
- **Usage**: Create database indexes
- **Example**: 
```java
@Table(name = "loan_applications", indexes = {
    @Index(name = "idx_loan_app_status", columnList = "status")
})
```

### 18. **Entity Lifecycle Callbacks**
- **Usage**: Hook into entity lifecycle
- **Methods**: `@PrePersist`, `@PreUpdate`, `@PostPersist`, `@PostUpdate`, etc.

---

## Spring Framework Core

### 1. **Dependency Injection (DI)**
- **Usage**: Invert control of object creation
- **Types**:
  - Constructor injection
  - Field injection (`@Autowired`)
  - Setter injection
- **Example**: 
```java
@Autowired
private AuthService authService;
```

### 2. **Inversion of Control (IoC) Container**
- **Usage**: Manage object lifecycle
- **Implementation**: Spring ApplicationContext
- **Example**: Spring automatically creates and manages beans

### 3. **@Component Annotation**
- **Usage**: Mark class as Spring component
- **Example**: `@Component public class LoanApplicationMapper { }`

### 4. **@Service Annotation**
- **Usage**: Mark class as service layer component
- **Example**: `@Service public class AuthServiceImpl implements AuthService { }`

### 5. **@Repository Annotation**
- **Usage**: Mark class as data access layer component
- **Example**: `@Repository public interface UserRepository extends JpaRepository<User, UUID> { }`

### 6. **@Controller Annotation**
- **Usage**: Mark class as web controller
- **Note**: Not used, `@RestController` is used instead

### 7. **@RestController Annotation**
- **Usage**: Combine `@Controller` and `@ResponseBody`
- **Example**: `@RestController @RequestMapping("/api/auth") public class AuthController { }`

### 8. **@Autowired Annotation**
- **Usage**: Inject dependencies
- **Example**: 
```java
@Autowired
private UserService userService;
```

### 9. **@RequiredArgsConstructor (Lombok)**
- **Usage**: Generate constructor for final fields
- **Example**: `@RequiredArgsConstructor` generates constructor for `private final` fields

### 10. **@Configuration Annotation**
- **Usage**: Mark class as configuration class
- **Example**: `@Configuration public class SecurityConfig { }`

### 11. **@Bean Annotation**
- **Usage**: Define Spring beans
- **Example**: 
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### 12. **@Value Annotation**
- **Usage**: Inject property values
- **Example**: 
```java
@Value("${app.jwt.secret}")
private String jwtSecret;
```

### 13. **@Primary Annotation**
- **Usage**: Mark bean as primary when multiple candidates exist
- **Note**: Not used in this codebase

### 14. **@Qualifier Annotation**
- **Usage**: Specify which bean to inject
- **Note**: Not used in this codebase

### 15. **@Scope Annotation**
- **Usage**: Define bean scope (singleton, prototype, etc.)
- **Note**: Default is singleton

### 16. **ApplicationContext**
- **Usage**: Spring container that manages beans
- **Example**: Created automatically by Spring Boot

### 17. **Bean Lifecycle**
- **Usage**: Control bean initialization and destruction
- **Methods**: `@PostConstruct`, `@PreDestroy`

---

## Spring Boot

### 1. **@SpringBootApplication Annotation**
- **Usage**: Enable Spring Boot auto-configuration
- **Composition**: `@Configuration`, `@EnableAutoConfiguration`, `@ComponentScan`
- **Example**: 
```java
@SpringBootApplication
public class LoanScreeningAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(LoanScreeningAppApplication.class, args);
    }
}
```

### 2. **SpringApplication.run()**
- **Usage**: Bootstrap Spring Boot application
- **Example**: `SpringApplication.run(LoanScreeningAppApplication.class, args);`

### 3. **Auto-Configuration**
- **Usage**: Automatically configure Spring beans based on classpath
- **Example**: Spring Boot auto-configures DataSource, JPA, Security, etc.

### 4. **Starter Dependencies**
- **Usage**: Pre-configured dependency groups
- **Examples Used**:
  - `spring-boot-starter-web`: Web applications
  - `spring-boot-starter-data-jpa`: JPA support
  - `spring-boot-starter-security`: Security
  - `spring-boot-starter-validation`: Bean validation
  - `spring-boot-starter-mail`: Email support
  - `spring-boot-starter-cache`: Caching support
  - `spring-boot-starter-actuator`: Monitoring

### 5. **application.properties**
- **Usage**: Externalize configuration
- **Example**: Database URLs, JWT secrets, etc.

### 6. **@EnableScheduling**
- **Usage**: Enable scheduled task execution
- **Example**: `@EnableScheduling` in main application class

### 7. **@Scheduled Annotation**
- **Usage**: Schedule method execution
- **Example**: 
```java
@Scheduled(cron = "0 */10 * * * *")
public void retryFailedEmails() { }
```

### 8. **@EnableAsync**
- **Usage**: Enable asynchronous method execution
- **Example**: `@EnableAsync` in main application class

### 9. **@EnableTransactionManagement**
- **Usage**: Enable declarative transaction management
- **Example**: `@EnableTransactionManagement` in main application class

### 10. **Spring Boot Actuator**
- **Usage**: Production-ready features (health checks, metrics)
- **Example**: `/actuator/**` endpoints

### 11. **Profile-based Configuration**
- **Usage**: Different configurations for different environments
- **Note**: Can be used with `@Profile` annotation

---

## Spring Data JPA

### 1. **JpaRepository Interface**
- **Usage**: Extend for CRUD operations
- **Example**: 
```java
public interface UserRepository extends JpaRepository<User, UUID> { }
```

### 2. **Query Methods**
- **Usage**: Define queries by method name
- **Example**: 
```java
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
```

### 3. **@Query Annotation**
- **Usage**: Define custom JPQL or native queries
- **Example**: 
```java
@Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
Optional<User> findByEmailAndStatus(@Param("email") String email, @Param("status") UserStatus status);
```

### 4. **@Param Annotation**
- **Usage**: Bind method parameters to query parameters
- **Example**: `@Param("email") String email`

### 5. **JPQL (Java Persistence Query Language)**
- **Usage**: Object-oriented query language
- **Example**: `SELECT u FROM User u WHERE u.role = :role`

### 6. **Native Queries**
- **Usage**: Execute SQL queries directly
- **Example**: `@Query(value = "SELECT * FROM users WHERE ...", nativeQuery = true)`

### 7. **PagingAndSortingRepository**
- **Usage**: Pagination and sorting support
- **Note**: JpaRepository extends this

### 8. **Specification API**
- **Usage**: Dynamic query building
- **Note**: Not used in this codebase

### 9. **Custom Repository Implementation**
- **Usage**: Implement custom data access logic
- **Example**: Custom repository implementations for complex queries

---

## Spring Security

### 1. **@EnableWebSecurity**
- **Usage**: Enable Spring Security
- **Example**: `@EnableWebSecurity` in `SecurityConfig`

### 2. **@EnableMethodSecurity**
- **Usage**: Enable method-level security
- **Example**: `@EnableMethodSecurity(prePostEnabled = true)`

### 3. **SecurityFilterChain**
- **Usage**: Configure security filter chain
- **Example**: 
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    // Security configuration
}
```

### 4. **PasswordEncoder**
- **Usage**: Encode and verify passwords
- **Implementation**: `BCryptPasswordEncoder`
- **Example**: 
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### 5. **AuthenticationManager**
- **Usage**: Authenticate users
- **Example**: 
```java
@Bean
public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
}
```

### 6. **JWT (JSON Web Token)**
- **Usage**: Stateless authentication
- **Implementation**: Custom `JwtTokenProvider` class
- **Example**: Token generation and validation

### 7. **JwtAuthenticationFilter**
- **Usage**: Filter to validate JWT tokens
- **Example**: Custom filter extending `OncePerRequestFilter`

### 8. **CORS Configuration**
- **Usage**: Cross-Origin Resource Sharing
- **Example**: 
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList("*"));
    // ...
}
```

### 9. **Role-Based Access Control (RBAC)**
- **Usage**: Control access based on roles
- **Example**: 
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/officer/**").hasAnyRole("LOAN_OFFICER", "COMPLIANCE_OFFICER")
```

### 10. **Session Management**
- **Usage**: Configure session creation policy
- **Example**: `session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)`

---

## Spring Web (REST APIs)

### 1. **@RequestMapping Annotation**
- **Usage**: Map HTTP requests to methods
- **Example**: `@RequestMapping("/api/auth")`

### 2. **@GetMapping Annotation**
- **Usage**: Map GET requests
- **Example**: `@GetMapping("/users")`

### 3. **@PostMapping Annotation**
- **Usage**: Map POST requests
- **Example**: `@PostMapping("/register")`

### 4. **@PutMapping Annotation**
- **Usage**: Map PUT requests
- **Note**: Used in update operations

### 5. **@PatchMapping Annotation**
- **Usage**: Map PATCH requests
- **Note**: Used for partial updates

### 6. **@DeleteMapping Annotation**
- **Usage**: Map DELETE requests
- **Note**: Used in delete operations

### 7. **@RequestBody Annotation**
- **Usage**: Bind HTTP request body to method parameter
- **Example**: `public ResponseEntity<LoginResponse> login(@RequestBody UserLoginRequest request)`

### 8. **@ResponseBody Annotation**
- **Usage**: Return value as HTTP response body
- **Note**: Included in `@RestController`

### 9. **@PathVariable Annotation**
- **Usage**: Extract path variable from URL
- **Example**: `@GetMapping("/users/{id}") public User getUser(@PathVariable UUID id)`

### 10. **@RequestParam Annotation**
- **Usage**: Extract query parameter from URL
- **Example**: `@GetMapping("/users") public List<User> getUsers(@RequestParam String role)`

### 11. **@RequestHeader Annotation**
- **Usage**: Extract header from request
- **Example**: `@RequestHeader("Authorization") String authHeader`

### 12. **ResponseEntity**
- **Usage**: Represent HTTP response with status and body
- **Example**: 
```java
return ResponseEntity.status(HttpStatus.CREATED).body(response);
return ResponseEntity.ok(response);
```

### 13. **HttpStatus**
- **Usage**: HTTP status codes
- **Examples**: `HttpStatus.CREATED`, `HttpStatus.OK`, `HttpStatus.BAD_REQUEST`, `HttpStatus.INTERNAL_SERVER_ERROR`

### 14. **@RestControllerAdvice**
- **Usage**: Global exception handling for REST controllers
- **Example**: `@RestControllerAdvice public class GlobalExceptionHandler { }`

### 15. **@ExceptionHandler**
- **Usage**: Handle specific exceptions
- **Example**: 
```java
@ExceptionHandler(LoanApiException.class)
public ResponseEntity<ErrorResponse> handleLoanApiException(...) { }
```

---

## Bean Validation

### 1. **@Valid Annotation**
- **Usage**: Trigger validation on object
- **Example**: `public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody UserRegistrationRequest request)`

### 2. **@NotBlank Annotation**
- **Usage**: Validate string is not blank
- **Example**: `@NotBlank(message = "Email is required") private String email;`

### 3. **@Email Annotation**
- **Usage**: Validate email format
- **Example**: `@Email(message = "Please provide a valid email address")`

### 4. **@Size Annotation**
- **Usage**: Validate size of string or collection
- **Example**: `@Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")`

### 5. **@Pattern Annotation**
- **Usage**: Validate string against regex pattern
- **Example**: 
```java
@Pattern(regexp = "^(\\+91|91|0)?[6-9]\\d{9}$", 
         message = "Please provide a valid 10-digit Indian mobile number")
```

### 6. **@AssertTrue Annotation**
- **Usage**: Validate boolean field is true
- **Example**: 
```java
@AssertTrue(message = "You must accept the terms and conditions")
private boolean acceptTerms = false;
```

### 7. **@NotNull Annotation**
- **Usage**: Validate field is not null
- **Note**: Used for non-primitive types

### 8. **@Min and @Max Annotations**
- **Usage**: Validate numeric range
- **Note**: Can be used for numeric validations

### 9. **@DecimalMin and @DecimalMax Annotations**
- **Usage**: Validate decimal range
- **Note**: Used for BigDecimal validations

### 10. **Custom Validation**
- **Usage**: Create custom validators
- **Example**: Custom validation methods like `isPasswordMatching()`

---

## Lombok

### 1. **@Data Annotation**
- **Usage**: Generate getters, setters, toString, equals, hashCode
- **Example**: `@Data public class User { }`

### 2. **@Getter and @Setter Annotations**
- **Usage**: Generate getters and setters
- **Note**: Included in `@Data`

### 3. **@Builder Annotation**
- **Usage**: Generate builder pattern
- **Example**: 
```java
@Builder
public class LoginResponse {
    // Fields
}
// Usage: LoginResponse.builder().token("...").email("...").build();
```

### 4. **@NoArgsConstructor Annotation**
- **Usage**: Generate no-argument constructor
- **Example**: `@NoArgsConstructor`

### 5. **@AllArgsConstructor Annotation**
- **Usage**: Generate constructor with all arguments
- **Example**: `@AllArgsConstructor`

### 6. **@RequiredArgsConstructor Annotation**
- **Usage**: Generate constructor for final fields
- **Example**: `@RequiredArgsConstructor` for dependency injection

### 7. **@Slf4j Annotation**
- **Usage**: Generate logger field
- **Example**: `@Slf4j` generates `private static final Logger log = LoggerFactory.getLogger(...)`

### 8. **@EqualsAndHashCode Annotation**
- **Usage**: Generate equals and hashCode methods
- **Note**: Included in `@Data`

### 9. **@ToString Annotation**
- **Usage**: Generate toString method
- **Note**: Included in `@Data`

---

## Design Patterns

### 1. **Repository Pattern**
- **Usage**: Abstract data access layer
- **Example**: `UserRepository`, `LoanApplicationRepository`

### 2. **Service Layer Pattern**
- **Usage**: Business logic separation
- **Example**: `AuthService`, `LoanApplicationService`

### 3. **DTO (Data Transfer Object) Pattern**
- **Usage**: Transfer data between layers
- **Example**: `UserRegistrationRequest`, `LoginResponse`

### 4. **Builder Pattern**
- **Usage**: Construct complex objects
- **Implementation**: Lombok `@Builder`
- **Example**: `LoginResponse.builder().token("...").email("...").build()`

### 5. **Singleton Pattern**
- **Usage**: Single instance of bean
- **Implementation**: Spring default scope

### 6. **Factory Pattern**
- **Usage**: Create objects without specifying exact class
- **Implementation**: Spring BeanFactory

### 7. **Dependency Injection Pattern**
- **Usage**: Invert control of dependencies
- **Implementation**: Spring IoC container

### 8. **Template Method Pattern**
- **Usage**: Define algorithm skeleton
- **Example**: Spring's JdbcTemplate, JpaTemplate

### 9. **Observer Pattern**
- **Usage**: Event-driven architecture
- **Example**: Spring ApplicationEvent and EventListeners

### 10. **Strategy Pattern**
- **Usage**: Define family of algorithms
- **Example**: Different service implementations

---

## Advanced Concepts

### 1. **Transactions**
- **Usage**: Ensure data consistency
- **Annotation**: `@Transactional`
- **Example**: 
```java
@Transactional
public LoanDecisionResponse approveLoanApplication(...) { }
```

### 2. **Transaction Management**
- **Usage**: Declarative transaction management
- **Example**: `@EnableTransactionManagement`

### 3. **AOP (Aspect-Oriented Programming)**
- **Usage**: Cross-cutting concerns
- **Implementation**: Spring AOP (used for transactions, security)

### 4. **Event-Driven Architecture**
- **Usage**: Loose coupling through events
- **Example**: 
```java
public class NotificationDomainEvent extends ApplicationEvent {
    // Event data
}
```

### 5. **ApplicationEventPublisher**
- **Usage**: Publish application events
- **Example**: Used to publish domain events

### 6. **@EventListener Annotation**
- **Usage**: Listen to application events
- **Example**: `@EventListener` methods in event listeners

### 7. **ModelMapper**
- **Usage**: Map between objects
- **Example**: 
```java
@Bean
public ModelMapper modelMapper() {
    ModelMapper mapper = new ModelMapper();
    // Configuration
}
```

### 8. **UUID (Universally Unique Identifier)**
- **Usage**: Generate unique identifiers
- **Example**: `private UUID id;`, `UUID.randomUUID()`

### 9. **BigDecimal**
- **Usage**: Precise decimal calculations
- **Example**: `private BigDecimal requestedAmount;`, `private BigDecimal approvedAmount;`

### 10. **Enum Types**
- **Usage**: Type-safe constants
- **Example**: 
```java
public enum ApplicationStatus {
    DRAFT, SUBMITTED, APPROVED, REJECTED
}
```

### 11. **Switch Statements**
- **Usage**: Multi-way branching
- **Example**: 
```java
switch (user.getStatus()) {
    case PENDING_VERIFICATION:
        throw new LoanApiException("...");
    case INACTIVE:
        throw new LoanApiException("...");
}
```

### 12. **Conditional Logic**
- **Usage**: Control flow
- **Types**: if-else, ternary operator, switch
- **Example**: Extensive use throughout codebase

### 13. **Null Safety**
- **Usage**: Handle null values
- **Methods**: Optional, null checks, try-catch
- **Example**: 
```java
if (entity == null) {
    return null;
}
```

### 14. **Logging**
- **Usage**: Application logging
- **Framework**: SLF4J with Logback
- **Example**: 
```java
log.info("Registration request received for email: {}", request.getEmail());
log.error("Error: {}", e.getMessage());
```

### 15. **Caching**
- **Usage**: Improve performance
- **Implementation**: Spring Cache with Caffeine
- **Example**: `@Cacheable`, `@CacheEvict` annotations

### 16. **Async Processing**
- **Usage**: Asynchronous method execution
- **Example**: `@Async` methods, `@EnableAsync`

### 17. **Scheduled Tasks**
- **Usage**: Periodic task execution
- **Example**: 
```java
@Scheduled(cron = "0 30 2 * * *")
public void cleanupOldRead() { }
```

### 18. **Cron Expressions**
- **Usage**: Schedule task execution
- **Example**: `"0 */10 * * * *"` (every 10 minutes), `"0 30 2 * * *"` (daily at 2:30 AM)

### 19. **External API Integration**
- **Usage**: Integrate with external services
- **Example**: WebFlux for reactive HTTP calls, HTTP Client

### 20. **File Processing**
- **Usage**: Handle file uploads and processing
- **Libraries**: Apache PDFBox, Tesseract OCR

### 21. **Email Service**
- **Usage**: Send emails
- **Implementation**: Spring Mail with Thymeleaf templates

### 22. **Template Engine**
- **Usage**: Render dynamic content
- **Implementation**: Thymeleaf for email templates

### 23. **Multi-Database Support**
- **Usage**: Connect to multiple databases
- **Example**: Primary database and external database configurations

### 24. **Custom Transaction Managers**
- **Usage**: Manage transactions for different data sources
- **Example**: `@Transactional(transactionManager = "externalTransactionManager")`

### 25. **Stored Procedures**
- **Usage**: Execute database stored procedures
- **Note**: Used in external database operations

### 26. **Rule Engine (Drools)**
- **Usage**: Business rule management
- **Library**: Drools for rule-based decision making

### 27. **Resilience4j**
- **Usage**: Resilience patterns (retry, circuit breaker)
- **Library**: Resilience4j for fault tolerance

### 28. **OpenAPI/Swagger**
- **Usage**: API documentation
- **Library**: SpringDoc OpenAPI

### 29. **Health Checks**
- **Usage**: Monitor application health
- **Implementation**: Spring Boot Actuator

### 30. **Configuration Properties**
- **Usage**: Externalize configuration
- **Example**: `@Value("${app.jwt.secret}")`

### 31. **Connection Pooling**
- **Usage**: Manage database connections efficiently
- **Implementation**: HikariCP (default in Spring Boot)
- **Configuration**: 
  - `spring.datasource.hikari.maximum-pool-size=50`
  - `spring.datasource.hikari.minimum-idle=10`
  - Connection timeout, idle timeout, max lifetime

### 32. **Multi-Datasource Configuration**
- **Usage**: Connect to multiple databases
- **Implementation**: Primary and external datasources
- **Example**: Separate configurations for main DB and external authority DB

### 33. **Hibernate Second-Level Cache**
- **Usage**: Cache entities at session factory level
- **Implementation**: Caffeine cache with JCache
- **Configuration**: 
  - `spring.jpa.properties.hibernate.cache.use_second_level_cache=true`
  - `spring.jpa.properties.hibernate.cache.use_query_cache=true`

### 34. **Batch Processing (Hibernate)**
- **Usage**: Optimize bulk operations
- **Configuration**: 
  - `spring.jpa.properties.hibernate.jdbc.batch_size=25`
  - `spring.jpa.properties.hibernate.order_inserts=true`
  - `spring.jpa.properties.hibernate.order_updates=true`

### 35. **N+1 Query Prevention**
- **Usage**: Avoid multiple queries for related entities
- **Configuration**: `spring.jpa.properties.hibernate.default_batch_fetch_size=20`

### 36. **File Upload Configuration**
- **Usage**: Configure multipart file handling
- **Configuration**: 
  - `spring.servlet.multipart.max-file-size=10MB`
  - `spring.servlet.multipart.max-request-size=50MB`

### 37. **Logging Configuration**
- **Usage**: Configure application logging levels
- **Framework**: SLF4J with Logback
- **Configuration**: 
  - `logging.level.root=INFO`
  - `logging.level.com.tss.loan=INFO`
  - `logging.level.org.hibernate=WARN`

### 38. **Database Dialect Configuration**
- **Usage**: Specify SQL dialect for Hibernate
- **Example**: `spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect`

### 39. **Naming Strategy**
- **Usage**: Control how Hibernate maps Java names to database names
- **Configuration**: Physical and implicit naming strategies

### 40. **Environment Variables**
- **Usage**: Externalize sensitive configuration
- **Example**: `${JWT_SECRET}`, `${MAIL_USERNAME}`, `${ADMIN_EMAIL}`

### 41. **Property Placeholders**
- **Usage**: Reference properties in configuration
- **Example**: `${username}`, `${password}` in datasource configuration

### 42. **Profile-based Properties**
- **Usage**: Different configurations for different environments
- **Note**: Can use `application-{profile}.properties`

### 43. **HikariCP Connection Pool Properties**
- **Usage**: Optimize connection pool performance
- **Configuration**: 
  - Prepared statement caching
  - Batch statement rewriting
  - Server-side prepared statements

### 44. **JPA DDL Auto Configuration**
- **Usage**: Control database schema generation
- **Example**: `spring.jpa.hibernate.ddl-auto=update`

### 45. **Query Statistics**
- **Usage**: Monitor query performance
- **Configuration**: `spring.jpa.properties.hibernate.generate_statistics=false`

---

## Summary

This codebase demonstrates a comprehensive use of Java and Spring Boot concepts:

- **Basic Java**: Packages, classes, methods, variables, data types, control flow
- **OOPs**: Encapsulation, inheritance, polymorphism, abstraction, interfaces
- **Collections**: List, Map, Set, Optional
- **Exception Handling**: Custom exceptions, global handlers, try-catch
- **Java 8+**: Lambda, Streams, Optional, LocalDateTime
- **JPA/Hibernate**: Entities, relationships, lifecycle callbacks, queries
- **Spring Core**: DI, IoC, components, configuration
- **Spring Boot**: Auto-configuration, starters, actuators
- **Spring Data JPA**: Repositories, query methods, custom queries
- **Spring Security**: JWT, authentication, authorization, CORS
- **Spring Web**: REST controllers, request/response handling
- **Validation**: Bean validation annotations
- **Lombok**: Code generation annotations
- **Design Patterns**: Repository, Service, DTO, Builder, etc.
- **Advanced**: Transactions, events, caching, scheduling, async processing

The application follows enterprise-level best practices with proper separation of concerns, layered architecture, and comprehensive use of Spring Boot ecosystem features.

