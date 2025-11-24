package com.t2404e.democrawler.controller.admin;
import com.t2404e.democrawler.service.CrawlerNetworkProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/api")
public class AdminCrawlerNetWorkController {
    private final CrawlerNetworkProfileService crawlerNetworkProfileService;

    // POST /admin/api/network/user-agents
    @PostMapping("/network/user-agents")
    public String overwriteUserAgents(@RequestBody List<String> userAgents) {
        crawlerNetworkProfileService.overwriteUserAgents(userAgents);
        return "OK - overwrote user agents, size=" + userAgents.size();
    }

    // POST /admin/api/network/fake-ips
    @PostMapping("/network/fake-ips")
    public String overwriteFakeIps(@RequestBody List<String> fakeIps) {
        crawlerNetworkProfileService.overwriteFakeIps(fakeIps);
        return "OK - overwrote fake IPs, size=" + fakeIps.size();
    }
}
