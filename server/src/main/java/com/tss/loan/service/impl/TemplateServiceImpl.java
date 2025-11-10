package com.tss.loan.service.impl;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.tss.loan.service.TemplateService;

@Service
public class TemplateServiceImpl implements TemplateService {
    @Autowired
    private TemplateEngine templateEngine;

    @Override
    public String render(String templateCode, Map<String, Object> variables) {
        Context ctx = new Context();
        if (variables != null) {
            variables.forEach(ctx::setVariable);
        }
        return templateEngine.process("notifications/" + templateCode, ctx);
    }

    @Override
    public String subject(String templateCode, Map<String, Object> variables) {
        // convention: subject templates under notifications/subject/{code}
        Context ctx = new Context();
        if (variables != null) {
            variables.forEach(ctx::setVariable);
        }
        return templateEngine.process("notifications/subject/" + templateCode, ctx);
    }
}


