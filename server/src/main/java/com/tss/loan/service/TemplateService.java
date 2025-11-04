package com.tss.loan.service;

import java.util.Map;

public interface TemplateService {
    String render(String templateCode, Map<String, Object> variables);
    String subject(String templateCode, Map<String, Object> variables);
}


