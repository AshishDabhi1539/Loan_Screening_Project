package com.tss.loan.entity.enums;

public enum RiskLevel {
    VERY_LOW,
    LOW,
    MEDIUM,
    HIGH,
    VERY_HIGH,
    CRITICAL;

    public static RiskLevel fromScore(Integer score) {
        if (score == null) {
            return MEDIUM;
        }
        int s = score.intValue();
        if (s <= 20)
            return VERY_LOW;
        if (s <= 40)
            return LOW;
        if (s <= 60)
            return MEDIUM;
        if (s <= 75)
            return HIGH;
        if (s <= 90)
            return VERY_HIGH;
        return CRITICAL;
    }
}