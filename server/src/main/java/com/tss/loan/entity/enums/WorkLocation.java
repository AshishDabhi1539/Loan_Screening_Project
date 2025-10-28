package com.tss.loan.entity.enums;

/**
 * Enum representing real-world banking work locations in India
 */
public enum WorkLocation {
    // Major Metro Cities - Head Offices
    MUMBAI_HEAD_OFFICE("Mumbai Head Office", "MUM-HO", "Main head office in Mumbai"),
    DELHI_HEAD_OFFICE("Delhi Head Office", "DEL-HO", "Regional head office in Delhi"),
    BANGALORE_HEAD_OFFICE("Bangalore Head Office", "BLR-HO", "Regional head office in Bangalore"),
    CHENNAI_HEAD_OFFICE("Chennai Head Office", "CHE-HO", "Regional head office in Chennai"),
    KOLKATA_HEAD_OFFICE("Kolkata Head Office", "KOL-HO", "Regional head office in Kolkata"),
    HYDERABAD_HEAD_OFFICE("Hyderabad Head Office", "HYD-HO", "Regional head office in Hyderabad"),
    
    // Regional Offices
    MUMBAI_REGIONAL("Mumbai Regional Office", "MUM-RO", "Regional processing center in Mumbai"),
    DELHI_REGIONAL("Delhi Regional Office", "DEL-RO", "Regional processing center in Delhi"),
    BANGALORE_REGIONAL("Bangalore Regional Office", "BLR-RO", "Regional processing center in Bangalore"),
    CHENNAI_REGIONAL("Chennai Regional Office", "CHE-RO", "Regional processing center in Chennai"),
    PUNE_REGIONAL("Pune Regional Office", "PUN-RO", "Regional processing center in Pune"),
    AHMEDABAD_REGIONAL("Ahmedabad Regional Office", "AHM-RO", "Regional processing center in Ahmedabad"),
    
    // Branch Offices - Major Cities
    MUMBAI_ANDHERI("Mumbai Andheri Branch", "MUM-AND", "Andheri branch office"),
    MUMBAI_BKC("Mumbai BKC Branch", "MUM-BKC", "Bandra Kurla Complex branch"),
    DELHI_CP("Delhi Connaught Place Branch", "DEL-CP", "Connaught Place branch"),
    DELHI_GURGAON("Gurgaon Branch", "GUR-BR", "Gurgaon branch office"),
    BANGALORE_KORAMANGALA("Bangalore Koramangala Branch", "BLR-KOR", "Koramangala branch"),
    BANGALORE_WHITEFIELD("Bangalore Whitefield Branch", "BLR-WHT", "Whitefield branch"),
    CHENNAI_TNAGAR("Chennai T.Nagar Branch", "CHE-TNG", "T.Nagar branch"),
    PUNE_BANER("Pune Baner Branch", "PUN-BAN", "Baner branch office"),
    
    // Tier 2 Cities
    SURAT_BRANCH("Surat Branch", "SUR-BR", "Surat branch office"),
    INDORE_BRANCH("Indore Branch", "IND-BR", "Indore branch office"),
    LUCKNOW_BRANCH("Lucknow Branch", "LKW-BR", "Lucknow branch office"),
    JAIPUR_BRANCH("Jaipur Branch", "JAI-BR", "Jaipur branch office"),
    COIMBATORE_BRANCH("Coimbatore Branch", "COI-BR", "Coimbatore branch office"),
    KOCHI_BRANCH("Kochi Branch", "KOC-BR", "Kochi branch office"),
    NAGPUR_BRANCH("Nagpur Branch", "NAG-BR", "Nagpur branch office"),
    VADODARA_BRANCH("Vadodara Branch", "VAD-BR", "Vadodara branch office"),
    
    // Processing Centers
    MUMBAI_PROCESSING_CENTER("Mumbai Processing Center", "MUM-PC", "Centralized loan processing center"),
    BANGALORE_PROCESSING_CENTER("Bangalore Processing Center", "BLR-PC", "Centralized loan processing center"),
    CHENNAI_PROCESSING_CENTER("Chennai Processing Center", "CHE-PC", "Centralized loan processing center"),
    DELHI_PROCESSING_CENTER("Delhi Processing Center", "DEL-PC", "Centralized loan processing center"),
    
    // Back Office Operations
    MUMBAI_BACK_OFFICE("Mumbai Back Office", "MUM-BO", "Back office operations center"),
    BANGALORE_BACK_OFFICE("Bangalore Back Office", "BLR-BO", "Back office operations center"),
    CHENNAI_BACK_OFFICE("Chennai Back Office", "CHE-BO", "Back office operations center"),
    
    // Remote/Work from Home
    REMOTE_WORK("Remote Work", "REMOTE", "Work from home/remote location"),
    HYBRID_WORK("Hybrid Work", "HYBRID", "Hybrid work model (office + remote)"),
    
    // Default
    UNSPECIFIED("Unspecified Location", "UNS", "Location not specified");
    
    private final String displayName;
    private final String code;
    private final String description;
    
    WorkLocation(String displayName, String code, String description) {
        this.displayName = displayName;
        this.code = code;
        this.description = description;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Get work location from display name (case insensitive)
     */
    public static WorkLocation fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return UNSPECIFIED;
        }
        
        String name = displayName.toUpperCase().trim();
        for (WorkLocation location : values()) {
            if (location.displayName.toUpperCase().equals(name) || 
                location.name().equals(name.replace(" ", "_"))) {
                return location;
            }
        }
        return UNSPECIFIED;
    }
    
    /**
     * Get all metro city locations
     */
    public static WorkLocation[] getMetroCities() {
        return new WorkLocation[]{
            MUMBAI_HEAD_OFFICE, DELHI_HEAD_OFFICE, BANGALORE_HEAD_OFFICE,
            CHENNAI_HEAD_OFFICE, KOLKATA_HEAD_OFFICE, HYDERABAD_HEAD_OFFICE
        };
    }
    
    /**
     * Get all processing centers
     */
    public static WorkLocation[] getProcessingCenters() {
        return new WorkLocation[]{
            MUMBAI_PROCESSING_CENTER, BANGALORE_PROCESSING_CENTER,
            CHENNAI_PROCESSING_CENTER, DELHI_PROCESSING_CENTER
        };
    }
}
