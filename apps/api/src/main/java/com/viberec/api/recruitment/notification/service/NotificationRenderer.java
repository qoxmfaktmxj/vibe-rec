package com.viberec.api.recruitment.notification.service;

import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class NotificationRenderer {

    /**
     * {{key}} 변수를 치환하고, {{#key}}...{{/key}} 조건 블록을 처리합니다.
     * 값이 null이거나 빈 문자열이면 해당 블록을 제거합니다.
     */
    public String render(String template, Map<String, String> variables) {
        String result = template;

        // 조건 블록 처리: {{#key}}...{{/key}}
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            String blockStart = "{{#" + key + "}}";
            String blockEnd = "{{/" + key + "}}";

            if (value != null && !value.isBlank()) {
                // 태그만 제거하고 내용은 유지
                result = result.replace(blockStart, "").replace(blockEnd, "");
            } else {
                // 블록 전체 제거
                int start = result.indexOf(blockStart);
                while (start >= 0) {
                    int end = result.indexOf(blockEnd, start);
                    if (end >= 0) {
                        result = result.substring(0, start) + result.substring(end + blockEnd.length());
                    } else {
                        break;
                    }
                    start = result.indexOf(blockStart);
                }
            }
        }

        // 단순 변수 치환: {{key}}
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace(placeholder, value);
        }

        return result.trim();
    }
}
