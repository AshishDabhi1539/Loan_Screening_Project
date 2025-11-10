package com.tss.loan.entity.enums;

/**
 * Enum representing priority levels for loan applications and compliance cases
 */
public enum Priority {
    LOW("Low Priority", 1),
    MEDIUM("Medium Priority", 2), 
    HIGH("High Priority", 3),
    CRITICAL("Critical Priority", 4);
    
    private final String displayName;
    private final int level;
    
    Priority(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getLevel() {
        return level;
    }
    
    /**
     * Get priority from string value (case insensitive)
     * @param value the string value
     * @return Priority enum or LOW as default
     */
    public static Priority fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return LOW;
        }
        
        try {
            return Priority.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Return LOW as default for invalid values
            return LOW;
        }
    }
    
    /**
     * Check if this priority is higher than another
     * @param other the other priority
     * @return true if this priority is higher
     */
    public boolean isHigherThan(Priority other) {
        return this.level > other.level;
    }
    
    /**
     * Check if this priority is lower than another
     * @param other the other priority
     * @return true if this priority is lower
     */
    public boolean isLowerThan(Priority other) {
        return this.level < other.level;
    }
}
