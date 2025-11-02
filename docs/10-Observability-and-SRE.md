# 10. Observability and Site Reliability Engineering (SRE)

**Version**: 1.0
**Last Updated**: 2025-11-02
**Status**: Industry-Grade Documentation

---

## 10.1 Overview and Philosophy

### Purpose

This document defines the **observability** and **site reliability engineering (SRE)** practices for ProjectPulse, ensuring system reliability, performance visibility, and operational excellence in a local development environment.

### Observability vs Monitoring vs Logging

| Concept           | Definition                                                        | ProjectPulse Application                                              |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Logging**       | Recording discrete events                                         | `AgentAction` table, Prisma query logs, application logs              |
| **Monitoring**    | Collecting and displaying metrics over time                       | Response times, error rates, token usage trends                       |
| **Observability** | Ability to understand system internal state from external outputs | Correlating logs + metrics + traces to diagnose agent workflow issues |

### Agent-First Architecture Considerations

ProjectPulse's observability strategy prioritizes **agent workflow visibility**:

1. **Token Budget Tracking**: Real-time monitoring of token consumption against 200K limit
2. **Protocol Compliance**: Automated tracking of 5-step mandatory session protocol (target: >95% compliance)
3. **MCP Tool Performance**: Per-tool metrics across 41 tools in 8 categories
4. **Context Persistence**: Monitoring checkpoint creation at 15K token intervals

### Local Deployment Context

Unlike cloud services with distributed tracing and APM tools, ProjectPulse operates in a **single-developer, local environment**:

- **Uptime SLA**: 99.9% dependent on local machine uptime (not contractual)
- **Observability Tools**: Lightweight, developer-friendly (no enterprise APM overhead)
- **Data Retention**: Local database and file-based logs (no centralized log aggregation)
- **Alerting**: Developer-facing notifications (email, desktop alerts) instead of PagerDuty

---

## 10.2 Logging Architecture

### 10.2.1 Agent Action Logging (AgentAction Table)

**Primary logging mechanism** for all agent operations, stored in PostgreSQL via Prisma.

#### Schema

```prisma
// prisma/schema.prisma
model AgentAction {
  id          Int      @id @default(autoincrement())
  sessionId   Int
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  action      String   // e.g., "issues.create", "knowledge.query"
  status      String   // "success" | "error" | "pending"

  input       Json     // Action parameters
  output      Json?    // Action results (null if error)
  error       Json?    // Error details (null if success)

  durationMs  Int      // Execution time in milliseconds
  tokenCost   Int      // Token consumption for this action

  timestamp   DateTime @default(now())

  @@index([sessionId])
  @@index([action])
  @@index([status])
  @@index([timestamp])
}
```

#### Key Queries

**Performance Analysis** (P95/P99 response times):

```typescript
// lib/analytics/performance.ts
const p95ResponseTime = await prisma.$queryRaw`
  SELECT
    action,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationMs") as p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "durationMs") as p99
  FROM "AgentAction"
  WHERE status = 'success'
    AND timestamp > NOW() - INTERVAL '7 days'
  GROUP BY action
`;
```

**Error Rate Monitoring**:

```typescript
const errorRate = await prisma.agentAction.groupBy({
  by: ['action', 'status'],
  where: {
    timestamp: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  },
  _count: true,
});

// Calculate error percentage per action
const errorStats = errorRate.reduce((acc, item) => {
  if (!acc[item.action]) acc[item.action] = { success: 0, error: 0 };
  acc[item.action][item.status] = item._count;
  return acc;
}, {});
```

**Token Usage Trends**:

```typescript
const tokenUsage = await prisma.agentAction.aggregate({
  where: {
    sessionId: currentSessionId,
  },
  _sum: {
    tokenCost: true,
  },
});

// Alert if approaching limit
if (tokenUsage._sum.tokenCost > 150000) {
  console.warn('⚠️ Token usage approaching limit:', tokenUsage._sum.tokenCost);
}
```

#### Retention Policy

- **Recent Data**: Keep all records for last 30 days (fast queries)
- **Historical Data**: Aggregate to hourly summaries after 30 days
- **Archival**: Export to JSON files after 90 days, delete from database

---

### 10.2.2 Application Logs (Winston/Pino)

**Structured logging** for application-level events.

#### Configuration

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
```

#### Log Levels and Usage

| Level   | Usage                                    | Example                              |
| ------- | ---------------------------------------- | ------------------------------------ |
| `error` | Unhandled exceptions, critical failures  | Database connection lost             |
| `warn`  | Degraded performance, recoverable errors | Slow query detected (>100ms)         |
| `info`  | Significant events                       | Session started, API endpoint called |
| `debug` | Detailed diagnostic information          | Prisma query execution               |

#### Example Usage

```typescript
// app/api/issues/route.ts
import logger from '@/lib/logger';

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    logger.info('Issue creation requested', {
      title: body.title,
      userId: body.userId,
    });

    const issue = await prisma.issue.create({ data: body });

    logger.info('Issue created successfully', {
      issueId: issue.id,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(issue);
  } catch (error) {
    logger.error('Issue creation failed', {
      error: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}
```

---

### 10.2.3 Database Query Logging (Prisma)

**Automatic logging** of slow queries and query errors.

#### Configuration

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import logger from '@/lib/logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log slow queries (>100ms threshold)
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      params: e.params,
      target: e.target,
    });
  }
});

// Log query errors
prisma.$on('error', (e) => {
  logger.error('Database query error', {
    message: e.message,
    target: e.target,
  });
});

export default prisma;
```

#### Query Performance Analysis

```typescript
// scripts/analyze-slow-queries.ts
import prisma from '@/lib/prisma';

// PostgreSQL slow query log analysis
const slowQueries = await prisma.$queryRaw`
  SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
  FROM pg_stat_statements
  WHERE mean_time > 100
  ORDER BY mean_time DESC
  LIMIT 10
`;

console.table(slowQueries);
```

---

### 10.2.4 Log Aggregation and Querying

**Local log aggregation** without external services.

#### File-Based Log Rotation

```bash
# Use logrotate for log management
# /etc/logrotate.d/projectpulse
/path/to/projectpulse/logs/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
}
```

#### Querying Logs with `jq`

```bash
# Find all errors in last hour
cat logs/combined.log | \
  jq 'select(.level == "error" and (.timestamp | fromdateiso8601) > (now - 3600))'

# Aggregate slow query warnings
cat logs/combined.log | \
  jq 'select(.message == "Slow query detected") | .duration' | \
  jq -s 'add / length'  # Average slow query duration
```

#### SQLite for Log Indexing (Optional)

For advanced queries, import logs into SQLite:

```bash
# scripts/import-logs-to-sqlite.sh
cat logs/combined.log | \
  jq -c '.' | \
  sqlite3 logs.db ".import /dev/stdin logs"

# Query SQLite
sqlite3 logs.db "SELECT * FROM logs WHERE level = 'error' ORDER BY timestamp DESC LIMIT 10"
```

---

## 10.3 Metrics and Monitoring

### 10.3.1 Performance Metrics

#### API Response Time Targets

| Metric           | Target  | Critical Threshold | Measurement                   |
| ---------------- | ------- | ------------------ | ----------------------------- |
| **P50** (Median) | <200ms  | >500ms             | 50th percentile response time |
| **P95**          | <500ms  | >1000ms            | 95th percentile response time |
| **P99**          | <1000ms | >2000ms            | 99th percentile response time |

#### Implementation

```typescript
// middleware.ts - Track all API requests
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const response = NextResponse.next();

  // Add timing header
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

  // Log performance metric
  logPerformanceMetric({
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    durationMs: Date.now() - startTime,
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

#### Database Query Performance

**Target**: 95% of queries complete in <50ms

```typescript
// lib/prisma.ts
prisma.$on('query', (e) => {
  const metrics = {
    query: e.query.substring(0, 100), // First 100 chars
    duration: e.duration,
    slow: e.duration > 50,
  };

  if (metrics.slow) {
    logger.warn('Slow database query', metrics);
  }

  // Store in metrics table
  prisma.metric.create({
    data: {
      type: 'db_query',
      value: e.duration,
      metadata: metrics,
    },
  });
});
```

#### Token Efficiency Tracking

**Target**: 85-92% token reduction through optimizations

```typescript
// lib/analytics/token-efficiency.ts
interface TokenEfficiencyMetric {
  operation: string;
  baselineTokens: number; // Before optimization
  actualTokens: number; // After optimization
  reductionPercent: number; // Calculated reduction
  target: number; // Expected reduction
  meetsTarget: boolean;
}

// Example: Skills loading optimization
const skillsEfficiency: TokenEfficiencyMetric = {
  operation: 'load_api_patterns_skill',
  baselineTokens: 10000,
  actualTokens: 1500,
  reductionPercent: 85,
  target: 85,
  meetsTarget: true,
};

// Track trend over time
await prisma.metric.create({
  data: {
    type: 'token_efficiency',
    value: skillsEfficiency.reductionPercent,
    metadata: skillsEfficiency,
  },
});
```

---

### 10.3.2 Workflow Compliance Metrics

#### Five-Step Protocol Compliance

**Target**: >95% of sessions complete all 5 steps

```typescript
// lib/analytics/protocol-compliance.ts
interface ProtocolComplianceMetric {
  sessionId: number;
  step1_initialize: boolean; // Session file created
  step2_plan_saved: boolean; // current-plan.md exists
  step3_experts_consulted: boolean; // Expert agents invoked
  step4_checkpoints_hit: boolean; // 15K token checkpoints logged
  step5_completion_docs: boolean; // COMPLETION_*.md created
  compliancePercent: number; // 0-100%
}

async function calculateProtocolCompliance(sessionId: number) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      agentActions: true,
    },
  });

  const compliance: ProtocolComplianceMetric = {
    sessionId,
    step1_initialize: session.sessionFileCreated,
    step2_plan_saved: session.planSaved,
    step3_experts_consulted: session.agentActions.some((a) => a.action.includes('expert')),
    step4_checkpoints_hit: session.checkpointCount >= expectedCheckpoints(session.totalTokens),
    step5_completion_docs: session.completionDocCreated,
    compliancePercent: 0,
  };

  // Calculate percentage
  const steps = [
    compliance.step1_initialize,
    compliance.step2_plan_saved,
    compliance.step3_experts_consulted,
    compliance.step4_checkpoints_hit,
    compliance.step5_completion_docs,
  ];
  compliance.compliancePercent = (steps.filter(Boolean).length / 5) * 100;

  return compliance;
}
```

#### Checkpoint Adherence

**Target**: Checkpoints created at every 15K token interval

```typescript
function expectedCheckpoints(totalTokens: number): number {
  return Math.floor(totalTokens / 15000);
}

async function checkCheckpointAdherence(sessionId: number) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      checkpoints: {
        orderBy: { tokenCount: 'asc' },
      },
    },
  });

  const expected = expectedCheckpoints(session.totalTokens);
  const actual = session.checkpoints.length;
  const adherence = (actual / expected) * 100;

  if (adherence < 80) {
    logger.warn('Low checkpoint adherence', {
      sessionId,
      expected,
      actual,
      adherence: `${adherence.toFixed(1)}%`,
    });
  }

  return { expected, actual, adherence };
}
```

---

### 10.3.3 Error Rate Tracking

#### Target Error Rates

| Error Type                  | Target | Critical Threshold |
| --------------------------- | ------ | ------------------ |
| **API Errors** (5xx)        | <0.1%  | >1%                |
| **Validation Errors** (4xx) | <5%    | >10%               |
| **Database Errors**         | <0.01% | >0.1%              |
| **MCP Tool Failures**       | <2%    | >5%                |

#### Error Rate Calculation

```typescript
// lib/analytics/error-rates.ts
async function calculateErrorRate(timeWindow: number = 24 * 60 * 60 * 1000) {
  const startTime = new Date(Date.now() - timeWindow);

  const stats = await prisma.agentAction.groupBy({
    by: ['status'],
    where: {
      timestamp: { gte: startTime },
    },
    _count: true,
  });

  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const errors = stats.find((s) => s.status === 'error')?._count || 0;
  const errorRate = (errors / total) * 100;

  if (errorRate > 1) {
    logger.error('Error rate exceeds threshold', {
      errorRate: `${errorRate.toFixed(2)}%`,
      errors,
      total,
      timeWindow: `${timeWindow / 1000 / 60 / 60}h`,
    });
  }

  return { errorRate, errors, total };
}
```

#### Error Categorization

```typescript
interface ErrorCategory {
  transient: number; // Retry likely to succeed
  persistent: number; // Requires code fix
  external: number; // Third-party service failure
}

function categorizeError(error: Error): keyof ErrorCategory {
  if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
    return 'transient';
  }

  if (error.message.includes('external API') || error.message.includes('network')) {
    return 'external';
  }

  return 'persistent';
}
```

---

### 10.3.4 Resource Utilization Monitoring

#### PostgreSQL Connection Pool

**Target**: <80% pool utilization under normal load

```typescript
// lib/analytics/resource-monitoring.ts
async function monitorConnectionPool() {
  const poolStats = await prisma.$queryRaw`
    SELECT
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      count(*) FILTER (WHERE state = 'idle') as idle_connections
    FROM pg_stat_activity
    WHERE datname = 'moksha_devhub'
  `;

  const maxConnections = 100; // From postgresql.conf
  const utilization = (poolStats[0].total_connections / maxConnections) * 100;

  if (utilization > 80) {
    logger.warn('High connection pool utilization', {
      utilization: `${utilization.toFixed(1)}%`,
      active: poolStats[0].active_connections,
      idle: poolStats[0].idle_connections,
      total: poolStats[0].total_connections,
    });
  }

  return poolStats[0];
}
```

#### Docker Container Resource Monitoring

```bash
# scripts/monitor-docker-resources.sh
#!/bin/bash

docker stats --no-stream --format \
  "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" \
  moksha-web moksha-db

# Alert if memory usage >80%
MEM_PERCENT=$(docker stats --no-stream --format "{{.MemPerc}}" moksha-web | sed 's/%//')
if (( $(echo "$MEM_PERCENT > 80" | bc -l) )); then
  echo "⚠️ High memory usage: ${MEM_PERCENT}%"
fi
```

---

## 10.4 Alerting Strategy

### 10.4.1 Alert Triggers and Thresholds

#### Critical Alerts (Immediate Notification)

| Alert                    | Trigger Condition                      | Response Time |
| ------------------------ | -------------------------------------- | ------------- |
| **Service Down**         | Health check fails 3 consecutive times | <1 minute     |
| **Database Unreachable** | Connection failure                     | <1 minute     |
| **Error Spike**          | >10 errors in 1 minute                 | <5 minutes    |
| **Memory Critical**      | >95% memory usage                      | <5 minutes    |

#### Warning Alerts (Review Within 1 Hour)

| Alert                       | Trigger Condition                 | Response Time |
| --------------------------- | --------------------------------- | ------------- |
| **High Error Rate**         | >1% error rate over 10 minutes    | <1 hour       |
| **Slow Response Time**      | P95 >500ms for 10 minutes         | <1 hour       |
| **Token Budget Warning**    | >150K tokens consumed             | <1 hour       |
| **Low Protocol Compliance** | <90% compliance rate              | <1 hour       |
| **High Resource Usage**     | >80% CPU or memory for 15 minutes | <1 hour       |

#### Informational Alerts (Daily Digest)

| Alert                  | Trigger Condition                     | Delivery     |
| ---------------------- | ------------------------------------- | ------------ |
| **Daily Summary**      | End of day statistics                 | Email digest |
| **Workflow Metrics**   | Protocol compliance, token efficiency | Email digest |
| **Performance Trends** | Week-over-week comparison             | Email digest |

#### Implementation

```typescript
// lib/alerting/alert-manager.ts
import nodemailer from 'nodemailer';

export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  metric?: any;
  timestamp: Date;
}

class AlertManager {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD,
    },
  });

  async sendAlert(alert: Alert) {
    logger.warn('Alert triggered', alert);

    if (alert.severity === AlertSeverity.CRITICAL) {
      await this.sendEmail(alert);
      await this.sendDesktopNotification(alert);
    } else if (alert.severity === AlertSeverity.WARNING) {
      await this.sendEmail(alert);
    }

    // Store alert in database
    await prisma.alert.create({
      data: {
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        metadata: alert.metric,
        timestamp: alert.timestamp,
      },
    });
  }

  private async sendEmail(alert: Alert) {
    await this.transporter.sendMail({
      from: process.env.ALERT_EMAIL,
      to: process.env.DEVELOPER_EMAIL,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html: `
        <h2>${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
        <p>${alert.message}</p>
        ${alert.metric ? `<pre>${JSON.stringify(alert.metric, null, 2)}</pre>` : ''}
      `,
    });
  }

  private async sendDesktopNotification(alert: Alert) {
    // Use node-notifier for desktop notifications
    const notifier = require('node-notifier');
    notifier.notify({
      title: `🚨 ${alert.title}`,
      message: alert.message,
      sound: true,
      wait: true,
    });
  }
}

export const alertManager = new AlertManager();
```

#### Alert Examples

```typescript
// Example: Error spike detection
const errorRate = await calculateErrorRate(60000); // Last minute
if (errorRate.errors > 10) {
  await alertManager.sendAlert({
    severity: AlertSeverity.CRITICAL,
    title: 'Error Spike Detected',
    message: `${errorRate.errors} errors in the last minute`,
    metric: errorRate,
    timestamp: new Date(),
  });
}

// Example: Token budget warning
if (session.totalTokens > 150000) {
  await alertManager.sendAlert({
    severity: AlertSeverity.WARNING,
    title: 'Token Budget Warning',
    message: `Session ${session.id} has consumed ${session.totalTokens} tokens (75% of limit)`,
    metric: { sessionId: session.id, tokens: session.totalTokens },
    timestamp: new Date(),
  });
}
```

---

### 10.4.2 Escalation Policies

#### Severity Levels

| Severity  | Description                           | Escalation Path                          | Example                    |
| --------- | ------------------------------------- | ---------------------------------------- | -------------------------- |
| **SEV-1** | Service down, data loss risk          | Immediate notification (email + desktop) | Database unreachable       |
| **SEV-2** | Degraded performance, high error rate | Email notification within 5 min          | P95 >1000ms                |
| **SEV-3** | Warning threshold exceeded            | Email notification within 1 hour         | Error rate >1%             |
| **SEV-4** | Informational, trends                 | Daily digest email                       | Weekly performance summary |

#### Notification Channels

```typescript
interface NotificationChannel {
  name: string;
  enabled: boolean;
  severities: AlertSeverity[];
  config: any;
}

const channels: NotificationChannel[] = [
  {
    name: 'email',
    enabled: true,
    severities: [AlertSeverity.CRITICAL, AlertSeverity.WARNING, AlertSeverity.INFO],
    config: { to: process.env.DEVELOPER_EMAIL },
  },
  {
    name: 'desktop',
    enabled: true,
    severities: [AlertSeverity.CRITICAL],
    config: {},
  },
  {
    name: 'slack',
    enabled: false, // Optional integration
    severities: [AlertSeverity.CRITICAL, AlertSeverity.WARNING],
    config: { webhook: process.env.SLACK_WEBHOOK_URL },
  },
];
```

---

### 10.4.3 On-Call Procedures

**Note**: In single-developer local deployment, "on-call" means **personal availability for critical issues**.

#### Availability Expectations

- **Business Hours (9 AM - 6 PM)**: Active monitoring, respond to alerts within 15 minutes
- **After Hours**: Critical alerts only (SEV-1), respond within 1 hour
- **Weekends**: Critical alerts only, best effort response

#### Response Checklist

**For SEV-1 (Service Down)**:

1. Check Docker container status: `docker ps`
2. Check database connectivity: `docker exec moksha-db pg_isready`
3. Review recent logs: `docker logs moksha-web --tail 100`
4. Restart services if needed: `docker-compose restart`
5. Verify recovery: `curl http://localhost:3000/api/health`
6. Document incident in `docs/incidents/YYYY-MM-DD-incident.md`

**For SEV-2 (Performance Degradation)**:

1. Check resource usage: `docker stats`
2. Review slow query log: `cat logs/combined.log | jq 'select(.message == "Slow query detected")'`
3. Analyze database query performance: `npm run analyze-slow-queries`
4. Check for N+1 queries or missing indexes
5. Apply optimizations if clear fix exists
6. Create issue for long-term fix if needed

---

### 10.4.4 Alert Fatigue Prevention

#### Strategies

1. **Threshold Tuning**: Adjust thresholds based on historical data to reduce false positives
2. **Suppression Windows**: Suppress duplicate alerts within 15-minute windows
3. **Alert Grouping**: Group related alerts (e.g., multiple slow queries → single "database performance" alert)
4. **Scheduled Maintenance**: Disable alerts during planned maintenance windows

#### Implementation

```typescript
// lib/alerting/alert-suppression.ts
class AlertSuppressor {
  private recentAlerts = new Map<string, Date>();

  shouldSuppress(alertKey: string, suppressionWindow: number = 15 * 60 * 1000): boolean {
    const lastAlert = this.recentAlerts.get(alertKey);

    if (lastAlert && Date.now() - lastAlert.getTime() < suppressionWindow) {
      logger.debug('Alert suppressed (duplicate)', { alertKey });
      return true;
    }

    this.recentAlerts.set(alertKey, new Date());
    return false;
  }
}

const suppressor = new AlertSuppressor();

// Usage
const alertKey = `error-spike-${errorRate.errorType}`;
if (!suppressor.shouldSuppress(alertKey)) {
  await alertManager.sendAlert(alert);
}
```

---

## 10.5 Reliability Engineering

### 10.5.1 NFR-009: Target Uptime - 99.9%

**Requirement**: 99.9% uptime (dependent on local machine uptime)

#### Calculation

- **99.9% uptime** = 8.76 hours downtime per year
- **Monthly allowance** = 43.8 minutes
- **Weekly allowance** = 10.1 minutes

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check critical services
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    return NextResponse.json({ status: 'healthy', checks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', error: error.message }, { status: 503 });
  }
}
```

#### Docker Health Check

```yaml
# docker-compose.yml
services:
  web:
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
```

#### Uptime Monitoring Script

```bash
#!/bin/bash
# scripts/monitor-uptime.sh

LOG_FILE="logs/uptime.log"

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ "$STATUS" == "200" ]; then
    echo "$TIMESTAMP,UP,$STATUS" >> $LOG_FILE
  else
    echo "$TIMESTAMP,DOWN,$STATUS" >> $LOG_FILE
    # Send alert
    echo "⚠️ Service down at $TIMESTAMP (HTTP $STATUS)" | mail -s "Service Down Alert" developer@example.com
  fi

  sleep 60  # Check every minute
done
```

#### Uptime Calculation

```typescript
// scripts/calculate-uptime.ts
import fs from 'fs';

interface UptimeRecord {
  timestamp: string;
  status: 'UP' | 'DOWN';
  httpCode: string;
}

function calculateUptime(logFile: string, timeWindow: number) {
  const logs = fs.readFileSync(logFile, 'utf-8').split('\n');
  const startTime = Date.now() - timeWindow;

  let totalChecks = 0;
  let upChecks = 0;

  logs.forEach((line) => {
    const [timestamp, status] = line.split(',');
    const recordTime = new Date(timestamp).getTime();

    if (recordTime >= startTime) {
      totalChecks++;
      if (status === 'UP') upChecks++;
    }
  });

  const uptime = (upChecks / totalChecks) * 100;
  console.log(`Uptime: ${uptime.toFixed(3)}%`);
  console.log(`Up checks: ${upChecks}/${totalChecks}`);

  return uptime;
}

// Calculate last 7 days
calculateUptime('logs/uptime.log', 7 * 24 * 60 * 60 * 1000);
```

---

### 10.5.2 NFR-010: Recovery Time Objective (RTO) < 1 Minute

**Requirement**: Service restoration within 1 minute of failure detection

#### Docker Restart Policy

```yaml
# docker-compose.yml
services:
  web:
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s # Check every 30 seconds
      timeout: 10s # Fail if no response in 10s
      retries: 3 # Fail after 3 consecutive failures
      start_period: 40s # Grace period for startup

  db:
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
```

**Timeline**:

- **Detection**: 30s (health check interval) × 3 retries = 90 seconds max
- **Restart**: ~10-15 seconds (Next.js build cache + Prisma connection)
- **Total RTO**: <105 seconds (1.75 minutes) → **Does not meet <1 min requirement**

**Optimization** for <60s RTO:

```yaml
web:
  healthcheck:
    interval: 15s # Reduced from 30s
    retries: 2 # Reduced from 3
    # Detection: 15s × 2 = 30s
    # Restart: ~15s
    # Total: ~45s ✅
```

#### Service Dependency Startup Order

```yaml
# docker-compose.yml
services:
  web:
    depends_on:
      db:
        condition: service_healthy # Wait for DB to be healthy
```

#### RTO Measurement

```typescript
// lib/analytics/rto-measurement.ts
interface RTOEvent {
  failureDetectedAt: Date;
  serviceRestoredAt: Date;
  rtoSeconds: number;
  meetsTarget: boolean;
}

async function recordRTOEvent(event: RTOEvent) {
  await prisma.metric.create({
    data: {
      type: 'rto_event',
      value: event.rtoSeconds,
      metadata: event,
    },
  });

  if (!event.meetsTarget) {
    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'RTO Target Missed',
      message: `Service restoration took ${event.rtoSeconds}s (target: <60s)`,
      metric: event,
      timestamp: new Date(),
    });
  }
}
```

---

### 10.5.3 NFR-011: Recovery Point Objective (RPO) = 0 Seconds

**Requirement**: Zero data loss (database transactions ensure ACID compliance)

#### Prisma Transaction Patterns

**Interactive Transactions** (for complex operations):

```typescript
// lib/services/issue-service.ts
export async function createIssueWithLabels(data: CreateIssueInput) {
  return await prisma.$transaction(async (tx) => {
    // Create issue
    const issue = await tx.issue.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId,
      },
    });

    // Create labels
    if (data.labels && data.labels.length > 0) {
      await tx.issueLabel.createMany({
        data: data.labels.map((label) => ({
          issueId: issue.id,
          labelId: label.id,
        })),
      });
    }

    // Log action
    await tx.agentAction.create({
      data: {
        sessionId: data.sessionId,
        action: 'issues.create',
        status: 'success',
        input: data,
        output: { issueId: issue.id },
        durationMs: 0, // Calculated outside
        tokenCost: 0,
      },
    });

    return issue;
  });
}
```

**If any operation fails, entire transaction rolls back → RPO = 0** ✅

#### PostgreSQL ACID Guarantees

```sql
-- postgresql.conf (ensure these are enabled)
fsync = on                    -- Force write to disk
synchronous_commit = on       -- Wait for WAL write
full_page_writes = on         -- Protect against partial writes
wal_level = replica           -- Enable point-in-time recovery
```

#### Backup Strategy (Additional Protection)

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/moksha_devhub_$TIMESTAMP.sql"

# Create backup
docker exec moksha-db pg_dump -U postgres moksha_devhub > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Retain last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Automated backups**: Run via cron every 6 hours

```bash
0 */6 * * * /path/to/scripts/backup-database.sh
```

#### Data Consistency Verification

```typescript
// scripts/verify-data-consistency.ts
async function verifyDataConsistency() {
  // Check referential integrity
  const orphanedActions = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "AgentAction" a
    LEFT JOIN "Session" s ON a."sessionId" = s.id
    WHERE s.id IS NULL
  `;

  if (orphanedActions[0].count > 0) {
    logger.error('Data consistency violation: orphaned AgentActions', orphanedActions[0]);
  }

  // Check for duplicate primary keys (should never happen)
  const duplicatePKs = await prisma.$queryRaw`
    SELECT id, COUNT(*) as count
    FROM "Issue"
    GROUP BY id
    HAVING COUNT(*) > 1
  `;

  if (duplicatePKs.length > 0) {
    logger.error('Critical: Duplicate primary keys detected', duplicatePKs);
  }
}
```

---

### 10.5.4 NFR-012: Graceful Degradation - Embeddings Failure

**Requirement**: If embeddings service down → fall back to full-text search only

#### Detection and Fallback Logic

```typescript
// lib/services/knowledge-service.ts
export async function searchKnowledge(query: string, options?: SearchOptions) {
  try {
    // Attempt semantic search with embeddings
    const results = await semanticSearch(query, options);
    return {
      results,
      mode: 'semantic',
      degraded: false,
    };
  } catch (error) {
    logger.warn('Embeddings service unavailable, falling back to full-text search', {
      error: error.message,
      query,
    });

    // Fall back to full-text search
    const results = await fullTextSearch(query, options);

    // Alert user of degraded mode
    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'Search Degraded: Embeddings Unavailable',
      message: 'Using full-text search only. Semantic search temporarily unavailable.',
      metric: { query, errorType: error.constructor.name },
      timestamp: new Date(),
    });

    return {
      results,
      mode: 'full-text',
      degraded: true,
    };
  }
}

async function semanticSearch(query: string, options?: SearchOptions) {
  // Generate embedding for query
  const embedding = await generateEmbedding(query);

  // Vector similarity search using pgvector
  const results = await prisma.$queryRaw`
    SELECT
      id,
      title,
      content,
      1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM "KnowledgeEntry"
    WHERE 1 - (embedding <=> ${embedding}::vector) > ${options?.threshold || 0.7}
    ORDER BY similarity DESC
    LIMIT ${options?.limit || 10}
  `;

  return results;
}

async function fullTextSearch(query: string, options?: SearchOptions) {
  // PostgreSQL full-text search with tsvector
  const results = await prisma.$queryRaw`
    SELECT
      id,
      title,
      content,
      ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM "KnowledgeEntry"
    WHERE search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${options?.limit || 10}
  `;

  return results;
}
```

#### User Notification

```typescript
// app/api/knowledge/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  const { results, mode, degraded } = await searchKnowledge(query);

  return NextResponse.json({
    results,
    metadata: {
      mode,
      degraded,
      message: degraded
        ? 'Using full-text search. Semantic search temporarily unavailable.'
        : 'Using semantic search with embeddings.',
    },
  });
}
```

#### Service Restoration Monitoring

```typescript
// lib/health-checks/embeddings-service.ts
async function checkEmbeddingsService() {
  try {
    const testEmbedding = await generateEmbedding('test');

    if (testEmbedding && testEmbedding.length > 0) {
      logger.info('Embeddings service restored');

      await alertManager.sendAlert({
        severity: AlertSeverity.INFO,
        title: 'Search Restored: Embeddings Available',
        message: 'Semantic search has been restored.',
        timestamp: new Date(),
      });

      return true;
    }
  } catch (error) {
    return false;
  }
}

// Poll every 5 minutes when degraded
setInterval(checkEmbeddingsService, 5 * 60 * 1000);
```

---

### 10.5.5 NFR-013: Graceful Degradation - Markdown Sync Failure

**Requirement**: If markdown sync fails → retry with exponential backoff (max 3 retries)

#### Exponential Backoff Implementation

```typescript
// lib/utils/exponential-backoff.ts
export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error('Operation failed after max retries', {
          maxRetries,
          error: error.message,
        });
        throw error;
      }

      // Calculate delay: baseDelay * 2^attempt, capped at maxDelay
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);

      logger.warn('Operation failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        error: error.message,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### Markdown Sync with Retry

```typescript
// lib/services/markdown-sync-service.ts
export async function syncMarkdownToDatabase(filePath: string) {
  try {
    const result = await withExponentialBackoff(
      async () => {
        // Read markdown file
        const content = await fs.readFile(filePath, 'utf-8');

        // Parse frontmatter and content
        const { data: frontmatter, content: body } = matter(content);

        // Update database
        await prisma.knowledgeEntry.upsert({
          where: { filePath },
          create: {
            filePath,
            title: frontmatter.title,
            content: body,
            metadata: frontmatter,
          },
          update: {
            title: frontmatter.title,
            content: body,
            metadata: frontmatter,
            updatedAt: new Date(),
          },
        });

        return { success: true };
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
      }
    );

    logger.info('Markdown sync successful', { filePath });
    return result;
  } catch (error) {
    // After max retries, log error and alert human
    logger.error('Markdown sync failed after retries', {
      filePath,
      error: error.message,
    });

    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'Markdown Sync Failed',
      message: `Failed to sync ${filePath} after 3 retries. Manual intervention required.`,
      metric: { filePath, error: error.message },
      timestamp: new Date(),
    });

    // Don't block API response - sync is async
    return { success: false, error: error.message };
  }
}
```

#### Non-Blocking API Integration

```typescript
// app/api/knowledge/sync/route.ts
export async function POST(request: Request) {
  const { filePath } = await request.json();

  // Start sync in background (don't await)
  syncMarkdownToDatabase(filePath).catch((error) => {
    logger.error('Background sync error', { filePath, error });
  });

  // Return immediately to client
  return NextResponse.json({
    message: 'Markdown sync initiated',
    filePath,
  });
}
```

---

## 10.6 Incident Response

### 10.6.1 Incident Detection and Classification

#### Severity Definitions

| Severity  | Impact                                   | Examples                         | Response Time |
| --------- | ---------------------------------------- | -------------------------------- | ------------- |
| **SEV-1** | Total service outage, data loss risk     | Database down, container crash   | <5 minutes    |
| **SEV-2** | Major functionality impaired             | API errors >5%, P99 >5s          | <1 hour       |
| **SEV-3** | Minor functionality impaired             | Single endpoint slow, <1% errors | <4 hours      |
| **SEV-4** | Cosmetic issues, no functionality impact | UI glitch, logging noise         | <1 day        |

#### Automated Detection

```typescript
// lib/incident-management/detector.ts
interface Incident {
  id: string;
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';
  title: string;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'resolved';
}

class IncidentDetector {
  async detectIncidents() {
    const incidents: Incident[] = [];

    // Check for service outage (SEV-1)
    const healthCheckFailed = await this.checkHealthEndpoint();
    if (healthCheckFailed) {
      incidents.push({
        id: crypto.randomUUID(),
        severity: 'SEV-1',
        title: 'Service Outage',
        description: 'Health check endpoint unreachable',
        detectedAt: new Date(),
        status: 'open',
      });
    }

    // Check for high error rate (SEV-2)
    const errorRate = await calculateErrorRate(600000); // Last 10 min
    if (errorRate.errorRate > 5) {
      incidents.push({
        id: crypto.randomUUID(),
        severity: 'SEV-2',
        title: 'High Error Rate',
        description: `Error rate at ${errorRate.errorRate.toFixed(2)}% (threshold: 5%)`,
        detectedAt: new Date(),
        status: 'open',
      });
    }

    // Check for slow response times (SEV-3)
    const p99 = await this.getP99ResponseTime(600000); // Last 10 min
    if (p99 > 2000) {
      incidents.push({
        id: crypto.randomUUID(),
        severity: 'SEV-3',
        title: 'Slow Response Times',
        description: `P99 response time at ${p99}ms (threshold: 2000ms)`,
        detectedAt: new Date(),
        status: 'open',
      });
    }

    // Create incidents in database and send alerts
    for (const incident of incidents) {
      await this.createIncident(incident);
    }

    return incidents;
  }

  private async createIncident(incident: Incident) {
    await prisma.incident.create({ data: incident });

    const alertSeverity =
      incident.severity === 'SEV-1'
        ? AlertSeverity.CRITICAL
        : incident.severity === 'SEV-2'
          ? AlertSeverity.WARNING
          : AlertSeverity.INFO;

    await alertManager.sendAlert({
      severity: alertSeverity,
      title: `${incident.severity}: ${incident.title}`,
      message: incident.description,
      timestamp: incident.detectedAt,
    });
  }
}
```

---

### 10.6.2 Response Playbooks

#### Playbook: Service Down (SEV-1)

**Symptoms**: Health check fails, API unreachable, Docker container exited

**Response Steps**:

1. **Verify incident** (1 min):

   ```bash
   curl http://localhost:3000/api/health
   docker ps -a
   ```

2. **Check container status** (1 min):

   ```bash
   docker logs moksha-web --tail 50
   docker logs moksha-db --tail 50
   ```

3. **Restart services** (1 min):

   ```bash
   docker-compose restart
   # Or if needed:
   docker-compose down && docker-compose up -d
   ```

4. **Verify recovery** (1 min):

   ```bash
   curl http://localhost:3000/api/health
   docker ps  # Check all containers running
   ```

5. **Document incident** (5 min):
   - Create `docs/incidents/YYYY-MM-DD-service-down.md`
   - Note root cause, resolution time, actions taken

**Total RTO**: <5 minutes

---

#### Playbook: High Error Rate (SEV-2)

**Symptoms**: Error rate >5%, alerts firing, user reports

**Response Steps**:

1. **Identify error patterns** (5 min):

   ```typescript
   // Query recent errors
   const recentErrors = await prisma.agentAction.findMany({
     where: {
       status: 'error',
       timestamp: { gte: new Date(Date.now() - 600000) }, // Last 10 min
     },
     orderBy: { timestamp: 'desc' },
     take: 20,
   });

   // Group by error type
   const errorGroups = recentErrors.reduce((acc, action) => {
     const errorType = action.error?.type || 'unknown';
     acc[errorType] = (acc[errorType] || 0) + 1;
     return acc;
   }, {});
   ```

2. **Check for recent deployments** (2 min):

   ```bash
   git log --oneline -5  # Recent commits
   docker ps --format "{{.CreatedAt}}\t{{.Names}}"  # Container restart times
   ```

3. **Apply quick fix** (10 min):
   - If code issue: Revert problematic commit
   - If external dependency: Enable fallback/retry logic
   - If resource issue: Restart containers

4. **Monitor recovery** (5 min):

   ```typescript
   // Check error rate trend
   const currentErrorRate = await calculateErrorRate(300000); // Last 5 min
   console.log('Current error rate:', currentErrorRate);
   ```

5. **Create follow-up issue** (5 min):
   - Document root cause
   - Create GitHub issue for permanent fix
   - Update runbook if new failure mode

**Total Resolution**: <30 minutes

---

#### Playbook: Slow Performance (SEV-3)

**Symptoms**: P95/P99 response times elevated, user reports slowness

**Response Steps**:

1. **Identify slow endpoints** (5 min):

   ```typescript
   const slowEndpoints = await prisma.agentAction.groupBy({
     by: ['action'],
     where: {
       timestamp: { gte: new Date(Date.now() - 600000) },
     },
     _avg: { durationMs: true },
     _max: { durationMs: true },
     _count: true,
   });

   slowEndpoints
     .sort((a, b) => b._avg.durationMs - a._avg.durationMs)
     .slice(0, 5)
     .forEach((endpoint) => {
       console.log(
         `${endpoint.action}: avg ${endpoint._avg.durationMs}ms, max ${endpoint._max.durationMs}ms`
       );
     });
   ```

2. **Check database performance** (5 min):

   ```bash
   # Connect to database
   docker exec -it moksha-db psql -U postgres -d moksha_devhub

   # Check slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE mean_time > 100
   ORDER BY mean_time DESC
   LIMIT 10;

   # Check missing indexes
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0;
   ```

3. **Check resource constraints** (2 min):

   ```bash
   docker stats --no-stream
   ```

4. **Apply optimization** (varies):
   - Add missing database indexes
   - Optimize N+1 queries with `include`
   - Add caching for expensive operations
   - Scale database connection pool

5. **Verify improvement** (5 min):
   ```typescript
   const improvedMetrics = await this.getP99ResponseTime(300000);
   console.log('Improved P99:', improvedMetrics);
   ```

**Total Resolution**: <2 hours

---

### 10.6.3 Post-Incident Review (PIR)

#### PIR Template

Create file: `docs/incidents/YYYY-MM-DD-[incident-title].md`

```markdown
# Post-Incident Review: [Incident Title]

**Date**: YYYY-MM-DD
**Severity**: SEV-X
**Duration**: X hours Y minutes
**Impact**: [Description of user/system impact]

## Timeline

| Time  | Event                               |
| ----- | ----------------------------------- |
| HH:MM | Incident detected (alert triggered) |
| HH:MM | Response started                    |
| HH:MM | Root cause identified               |
| HH:MM | Fix applied                         |
| HH:MM | Service restored                    |
| HH:MM | Incident closed                     |

## Root Cause

[Detailed explanation of what caused the incident]

## Resolution

[Detailed explanation of how the incident was resolved]

## Action Items

- [ ] **Prevent**: [Action to prevent recurrence] - Assigned to: [Name] - Due: [Date]
- [ ] **Detect**: [Improve detection/alerting] - Assigned to: [Name] - Due: [Date]
- [ ] **Respond**: [Improve response time] - Assigned to: [Name] - Due: [Date]
- [ ] **Document**: [Update runbooks] - Assigned to: [Name] - Due: [Date]

## Lessons Learned

**What went well**:

- [Things that worked well during response]

**What could be improved**:

- [Things that could be improved]

## Related Issues

- #[issue-number]: [Issue title]
```

---

### 10.6.4 Blameless Postmortems

#### Culture Principles

1. **No Blame**: Focus on system improvements, not individual mistakes
2. **Transparency**: Share incidents and learnings openly
3. **Continuous Improvement**: Every incident is a learning opportunity
4. **Systemic Thinking**: Address root causes, not symptoms

#### Postmortem Questions

**Prevention**:

- What conditions allowed this to happen?
- How can we prevent this in the future?
- What early warning signs did we miss?

**Detection**:

- How did we detect the incident?
- How long did it take to detect?
- How can we detect faster next time?

**Response**:

- How long did it take to respond?
- What slowed down the response?
- What tools/information would have helped?

**Recovery**:

- How did we restore service?
- How long did it take?
- What can we automate?

---

## 10.7 Stack-Specific Observability

### 10.7.1 Next.js 14 App Router Observability

#### Server Component Monitoring

**Challenge**: Server Components render on the server with no client-side instrumentation.

**Solution**: Middleware-based request tracking

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to headers for correlation
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-start-time', startTime.toString());

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Log request
  logger.info('Request received', {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### API Route Performance Tracking

```typescript
// app/api/issues/route.ts
import { headers } from 'next/headers';
import logger from '@/lib/logger';

export async function POST(request: Request) {
  const headersList = headers();
  const requestId = headersList.get('x-request-id');
  const startTime = parseInt(headersList.get('x-start-time') || '0');

  try {
    const body = await request.json();

    const issue = await prisma.issue.create({ data: body });

    const durationMs = Date.now() - startTime;

    // Log performance
    logger.info('API request completed', {
      requestId,
      path: '/api/issues',
      method: 'POST',
      durationMs,
      statusCode: 200,
    });

    // Track in AgentAction table
    await prisma.agentAction.create({
      data: {
        sessionId: body.sessionId,
        action: 'issues.create',
        status: 'success',
        input: body,
        output: { issueId: issue.id },
        durationMs,
        tokenCost: 0,
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logger.error('API request failed', {
      requestId,
      path: '/api/issues',
      method: 'POST',
      durationMs,
      error: error.message,
    });

    throw error;
  }
}
```

#### Client-Side Error Tracking

```typescript
// app/error.tsx (Error Boundary)
'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error
    logger.error('Client-side error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: window.location.href,
    });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

### 10.7.2 Prisma Query Monitoring

#### Query Performance Dashboard

```typescript
// scripts/prisma-performance-report.ts
import prisma from '@/lib/prisma';

async function generatePerformanceReport() {
  // Get slow query statistics from PostgreSQL
  const slowQueries = await prisma.$queryRaw`
    SELECT
      LEFT(query, 100) as query_preview,
      calls,
      total_time,
      mean_time,
      max_time,
      stddev_time
    FROM pg_stat_statements
    WHERE mean_time > 50
    ORDER BY mean_time DESC
    LIMIT 20
  `;

  console.log('\n=== Slow Queries (>50ms avg) ===\n');
  console.table(slowQueries);

  // Get table sizes
  const tableSizes = await prisma.$queryRaw`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `;

  console.log('\n=== Table Sizes ===\n');
  console.table(tableSizes);

  // Get index usage
  const indexUsage = await prisma.$queryRaw`
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC
    LIMIT 20
  `;

  console.log('\n=== Index Usage (Top 20) ===\n');
  console.table(indexUsage);
}

generatePerformanceReport();
```

#### Connection Pool Monitoring

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

// Monitor connection pool
setInterval(async () => {
  const poolStats = await prisma.$queryRaw`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
    FROM pg_stat_activity
    WHERE datname = 'moksha_devhub'
  `;

  logger.debug('Connection pool stats', poolStats[0]);
}, 60000); // Every minute
```

---

### 10.7.3 PostgreSQL Monitoring

#### Configuration for Observability

```sql
-- postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
log_min_duration_statement = 100  -- Log queries >100ms
log_connections = on
log_disconnections = on
log_lock_waits = on
```

#### Key Monitoring Queries

**Active Queries**:

```sql
SELECT
  pid,
  now() - query_start AS duration,
  state,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

**Blocking Queries**:

```sql
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.query AS blocked_query,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.query AS blocking_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
JOIN pg_locks blocking_locks ON blocked_locks.locktype = blocking_locks.locktype
JOIN pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
WHERE NOT blocked_locks.granted;
```

**Table Bloat**:

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### 10.7.4 Docker Container Health Monitoring

#### Health Check Scripts

```yaml
# docker-compose.yml
services:
  web:
    healthcheck:
      test: ['CMD', 'node', 'scripts/health-check.js']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

```javascript
// scripts/health-check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

req.on('error', () => {
  process.exit(1); // Failure
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1); // Failure
});

req.end();
```

#### Container Metrics

```bash
#!/bin/bash
# scripts/docker-metrics.sh

echo "=== Container Resource Usage ==="
docker stats --no-stream --format \
  "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo -e "\n=== Container Health Status ==="
for container in moksha-web moksha-db; do
  health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no healthcheck")
  echo "$container: $health"
done

echo -e "\n=== Container Restart Counts ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "moksha-"
```

---

## 10.8 Agent Workflow Observability

### 10.8.1 MCP Tool Call Tracking

**41 tools across 8 categories** require comprehensive tracking.

#### Tool Categories

1. **Memory** (9 tools): Knowledge graph operations
2. **Filesystem** (11 tools): File read/write operations
3. **Git** (12 tools): Version control
4. **GitKraken** (10 tools): GitHub integration
5. **PostgreSQL** (1 tool): Direct queries
6. **Playwright** (17 tools): Browser automation
7. **Docker** (5 tools): Container management
8. **Sequential Thinking** (1 tool): Complex reasoning

#### Per-Tool Performance Tracking

```typescript
// lib/analytics/mcp-tool-tracking.ts
interface MCPToolMetric {
  toolName: string;
  category: string;
  durationMs: number;
  success: boolean;
  errorType?: string;
  inputSize?: number;
  outputSize?: number;
  timestamp: Date;
}

async function trackMCPToolCall(metric: MCPToolMetric) {
  await prisma.mcpToolMetric.create({ data: metric });

  // Alert on slow tool calls
  if (metric.durationMs > 5000) {
    logger.warn('Slow MCP tool call', metric);
  }

  // Alert on repeated failures
  const recentFailures = await prisma.mcpToolMetric.count({
    where: {
      toolName: metric.toolName,
      success: false,
      timestamp: {
        gte: new Date(Date.now() - 600000), // Last 10 min
      },
    },
  });

  if (recentFailures > 3) {
    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'MCP Tool Repeated Failures',
      message: `Tool ${metric.toolName} has failed ${recentFailures} times in last 10 minutes`,
      timestamp: new Date(),
    });
  }
}
```

#### Tool Performance Dashboard

```typescript
// scripts/mcp-tool-performance.ts
async function generateToolPerformanceReport() {
  const toolStats = await prisma.mcpToolMetric.groupBy({
    by: ['toolName', 'category'],
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    _avg: { durationMs: true },
    _max: { durationMs: true },
    _count: true,
    _sum: {
      success: true, // Count of successful calls
    },
  });

  const enrichedStats = toolStats.map((stat) => ({
    tool: stat.toolName,
    category: stat.category,
    avgMs: Math.round(stat._avg.durationMs),
    maxMs: stat._max.durationMs,
    calls: stat._count,
    successRate: ((stat._sum.success / stat._count) * 100).toFixed(1) + '%',
  }));

  console.table(enrichedStats);
}
```

---

### 10.8.2 Five-Step Protocol Compliance Monitoring

**Target**: >95% of sessions complete all 5 steps

#### Step Verification

```typescript
// lib/analytics/protocol-compliance.ts
interface ProtocolStep {
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  verificationQuery: () => Promise<boolean>;
}

const protocolSteps: ProtocolStep[] = [
  {
    step: 1,
    name: 'Initialize session',
    verificationQuery: async (sessionId) => {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      return session?.sessionFileCreated === true;
    },
  },
  {
    step: 2,
    name: 'Save plan',
    verificationQuery: async (sessionId) => {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      return session?.planSaved === true;
    },
  },
  {
    step: 3,
    name: 'Consult experts',
    verificationQuery: async (sessionId) => {
      const expertCalls = await prisma.agentAction.count({
        where: {
          sessionId,
          action: {
            contains: 'expert',
          },
        },
      });
      return expertCalls > 0;
    },
  },
  {
    step: 4,
    name: 'Checkpoints at 15K intervals',
    verificationQuery: async (sessionId) => {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { checkpoints: true },
      });
      const expected = Math.floor(session.totalTokens / 15000);
      const actual = session.checkpoints.length;
      return actual >= expected * 0.8; // Allow 20% tolerance
    },
  },
  {
    step: 5,
    name: 'Create completion docs',
    verificationQuery: async (sessionId) => {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      return session?.completionDocCreated === true;
    },
  },
];

async function verifyProtocolCompliance(sessionId: number) {
  const results = await Promise.all(
    protocolSteps.map(async (step) => ({
      step: step.step,
      name: step.name,
      completed: await step.verificationQuery(sessionId),
    }))
  );

  const completedSteps = results.filter((r) => r.completed).length;
  const compliancePercent = (completedSteps / 5) * 100;

  logger.info('Protocol compliance check', {
    sessionId,
    completedSteps,
    compliancePercent,
    results,
  });

  if (compliancePercent < 95) {
    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'Low Protocol Compliance',
      message: `Session ${sessionId} completed only ${completedSteps}/5 protocol steps (${compliancePercent}%)`,
      metric: { sessionId, results },
      timestamp: new Date(),
    });
  }

  return { completedSteps, compliancePercent, results };
}
```

---

### 10.8.3 Token Budget Management

**Critical Thresholds**:

- 150K tokens = ⚠️ Warning
- 180K tokens = 🔴 Danger
- 200K tokens = 💥 Limit

#### Real-Time Tracking

```typescript
// lib/analytics/token-tracking.ts
interface TokenUsage {
  sessionId: number;
  currentTokens: number;
  percentUsed: number;
  threshold: 'safe' | 'warning' | 'danger' | 'critical';
  shouldSave: boolean;
}

function calculateTokenThreshold(tokens: number): TokenUsage['threshold'] {
  if (tokens < 140000) return 'safe';
  if (tokens < 150000) return 'warning';
  if (tokens < 180000) return 'danger';
  return 'critical';
}

async function trackTokenUsage(sessionId: number, currentTokens: number) {
  const percentUsed = (currentTokens / 200000) * 100;
  const threshold = calculateTokenThreshold(currentTokens);
  const shouldSave = currentTokens >= 140000;

  const usage: TokenUsage = {
    sessionId,
    currentTokens,
    percentUsed,
    threshold,
    shouldSave,
  };

  // Store metric
  await prisma.metric.create({
    data: {
      type: 'token_usage',
      value: currentTokens,
      metadata: usage,
    },
  });

  // Alert based on threshold
  if (threshold === 'warning') {
    logger.warn('⚠️ Token budget warning', usage);
  } else if (threshold === 'danger') {
    logger.warn('🔴 Token budget danger', usage);
    await alertManager.sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'Token Budget Danger',
      message: `Session ${sessionId} at ${currentTokens} tokens (${percentUsed.toFixed(1)}%). Save progress immediately.`,
      metric: usage,
      timestamp: new Date(),
    });
  } else if (threshold === 'critical') {
    logger.error('💥 Token budget critical', usage);
    await alertManager.sendAlert({
      severity: AlertSeverity.CRITICAL,
      title: 'Token Budget Critical',
      message: `Session ${sessionId} at ${currentTokens} tokens (${percentUsed.toFixed(1)}%). Auto-compaction imminent!`,
      metric: usage,
      timestamp: new Date(),
    });
  }

  return usage;
}
```

---

### 10.8.4 Checkpoint Workflow Monitoring

**Target**: Checkpoints at every 15K token interval

#### Checkpoint Verification

```typescript
// lib/analytics/checkpoint-monitoring.ts
interface Checkpoint {
  id: number;
  sessionId: number;
  tokenCount: number;
  filesUpdated: string[];
  timestamp: Date;
}

async function recordCheckpoint(checkpoint: Omit<Checkpoint, 'id'>) {
  const created = await prisma.checkpoint.create({
    data: checkpoint,
  });

  logger.info('Checkpoint recorded', {
    sessionId: checkpoint.sessionId,
    tokenCount: checkpoint.tokenCount,
    filesUpdated: checkpoint.filesUpdated,
  });

  return created;
}

async function analyzeCheckpointAdherence(sessionId: number) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      checkpoints: {
        orderBy: { tokenCount: 'asc' },
      },
    },
  });

  const expectedCheckpoints = [];
  for (let tokens = 15000; tokens <= session.totalTokens; tokens += 15000) {
    expectedCheckpoints.push(tokens);
  }

  const actualCheckpoints = session.checkpoints.map((c) => c.tokenCount);

  const adherence = expectedCheckpoints.map((expected) => {
    const closest = actualCheckpoints.reduce((prev, curr) =>
      Math.abs(curr - expected) < Math.abs(prev - expected) ? curr : prev
    );
    const deviation = Math.abs(closest - expected);
    return {
      expected,
      actual: closest,
      deviation,
      withinTolerance: deviation < 3000, // 3K token tolerance
    };
  });

  const adherenceRate =
    (adherence.filter((a) => a.withinTolerance).length / adherence.length) * 100;

  logger.info('Checkpoint adherence analysis', {
    sessionId,
    expectedCheckpoints: expectedCheckpoints.length,
    actualCheckpoints: actualCheckpoints.length,
    adherenceRate: `${adherenceRate.toFixed(1)}%`,
    details: adherence,
  });

  return { adherenceRate, details: adherence };
}
```

---

## 10.9 Dashboards and Visualization

### Dashboard Layout Recommendations

#### Overview Dashboard

**Key Metrics** (at-a-glance):

- **Uptime**: Current uptime percentage (99.9% target)
- **Error Rate**: Last 24 hours (<1% target)
- **P95 Response Time**: Last 1 hour (<500ms target)
- **Active Sessions**: Current active agent sessions
- **Token Budget**: Highest current session token usage

#### Performance Dashboard

**Charts**:

1. **Response Time Trends** (line chart):
   - P50, P95, P99 over last 7 days
   - Threshold lines at 200ms, 500ms, 1000ms

2. **Error Rate** (stacked area chart):
   - Success vs Error counts over time
   - By error type (validation, database, external)

3. **Database Query Performance** (bar chart):
   - Top 10 slowest queries (avg duration)
   - Query call counts

#### Agent Workflow Dashboard

**Metrics**:

1. **Protocol Compliance** (gauge):
   - Current compliance rate (>95% target)
   - Breakdown by step (1-5)

2. **Token Efficiency** (line chart):
   - Token reduction percentage over time
   - By optimization type (skills, sub-agents, etc.)

3. **MCP Tool Performance** (heatmap):
   - Tool categories on Y-axis
   - Response time on X-axis
   - Color intensity = call frequency

4. **Checkpoint Adherence** (timeline):
   - Expected checkpoint markers at 15K intervals
   - Actual checkpoint placements
   - Deviation visualization

### Local Dashboard Tools

#### Option 1: Grafana + Prometheus (Full-Featured)

**Setup**:

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
```

**Prometheus Exporter** (custom metrics):

```typescript
// lib/metrics/prometheus-exporter.ts
import express from 'express';
import { register, Counter, Histogram } from 'prom-client';

const app = express();

// Define metrics
const apiRequestDuration = new Histogram({
  name: 'api_request_duration_ms',
  help: 'API request duration in milliseconds',
  labelNames: ['method', 'route', 'status'],
});

const errorCount = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(9091, () => {
  console.log('Prometheus exporter listening on :9091/metrics');
});
```

#### Option 2: Simple HTML Dashboard (Lightweight)

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface DashboardMetrics {
  uptime: number;
  errorRate: number;
  p95ResponseTime: number;
  activeSessions: number;
  protocolCompliance: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/dashboard/metrics');
      const data = await response.json();
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5s

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">ProjectPulse Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Uptime"
          value={`${metrics.uptime.toFixed(3)}%`}
          target="99.9%"
          status={metrics.uptime >= 99.9 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          target="<1%"
          status={metrics.errorRate < 1 ? 'good' : 'critical'}
        />
        <MetricCard
          title="P95 Response Time"
          value={`${metrics.p95ResponseTime}ms`}
          target="<500ms"
          status={metrics.p95ResponseTime < 500 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Active Sessions"
          value={metrics.activeSessions.toString()}
          target="-"
          status="neutral"
        />
        <MetricCard
          title="Protocol Compliance"
          value={`${metrics.protocolCompliance.toFixed(1)}%`}
          target=">95%"
          status={metrics.protocolCompliance >= 95 ? 'good' : 'warning'}
        />
      </div>
    </div>
  );
}
```

---

## 10.10 SRE Best Practices and Tooling

### SLOs (Service Level Objectives)

**Definition**: Targets for service reliability and performance

#### ProjectPulse SLOs

| Service                   | SLO                             | Measurement Window | Target           |
| ------------------------- | ------------------------------- | ------------------ | ---------------- |
| **API Availability**      | 99.9% of requests succeed       | 30 days rolling    | <0.1% error rate |
| **API Latency**           | 95% of requests <500ms          | 7 days rolling     | P95 <500ms       |
| **Database Availability** | 99.95% uptime                   | 30 days rolling    | <0.05% downtime  |
| **Protocol Compliance**   | 95% sessions complete all steps | 30 days rolling    | >95% compliance  |
| **Token Efficiency**      | 85% token reduction achieved    | 30 days rolling    | >85% reduction   |

### Error Budgets

**Definition**: Allowable amount of "bad" service before action required

**Calculation**:

```
Error Budget = 100% - SLO
```

**Example**: 99.9% availability SLO

- **Error Budget**: 0.1% (43.2 minutes per month)
- **Spend Rate**: Current error rate
- **Remaining Budget**: Budget - Spent

**Implementation**:

```typescript
// lib/sre/error-budget.ts
interface ErrorBudget {
  slo: number; // e.g., 99.9
  budget: number; // e.g., 0.1
  spent: number; // Actual downtime %
  remaining: number; // Budget - Spent
  exhausted: boolean; // Remaining <= 0
}

async function calculateErrorBudget(slo: number, windowDays: number): Promise<ErrorBudget> {
  const startTime = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const stats = await prisma.agentAction.groupBy({
    by: ['status'],
    where: {
      timestamp: { gte: startTime },
    },
    _count: true,
  });

  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const errors = stats.find((s) => s.status === 'error')?._count || 0;
  const errorRate = (errors / total) * 100;

  const budget = 100 - slo;
  const spent = errorRate;
  const remaining = budget - spent;

  return {
    slo,
    budget,
    spent,
    remaining,
    exhausted: remaining <= 0,
  };
}
```

**Policy**: If error budget exhausted → freeze new features, focus on reliability

### Capacity Planning

**Resource Growth Projections**:

1. **Database Size**:

   ```typescript
   // Estimate based on current growth rate
   const currentSize = await prisma.$queryRaw`
     SELECT pg_database_size('moksha_devhub') as size
   `;

   const sizeLastWeek = // ... fetch from metrics
   const growthPerWeek = currentSize - sizeLastWeek;
   const weeksUntilLimit = (maxDatabaseSize - currentSize) / growthPerWeek;
   ```

2. **Token Budget Trends**:
   - Track average tokens per session
   - Identify token-heavy workflows
   - Project when optimizations are needed

### Continuous Improvement Cycle

**SRE Workflow**:

1. **Measure**: Collect metrics, track SLOs
2. **Analyze**: Identify bottlenecks, inefficiencies
3. **Improve**: Implement optimizations, fixes
4. **Validate**: Measure impact, verify improvements
5. **Repeat**: Continuous iteration

**Monthly SRE Review**:

- Review SLO compliance
- Analyze error budget spend
- Identify top 3 reliability risks
- Plan next month's improvements

---

## Summary

This Observability and SRE documentation provides:

✅ **Comprehensive logging** via AgentAction table, application logs, and database query logs
✅ **Performance metrics** with specific targets (P95 <500ms, error rate <1%)
✅ **Workflow compliance tracking** for 5-step protocol (>95% target)
✅ **Alerting strategy** with severity-based escalation
✅ **Reliability engineering** covering all NFR-009 to NFR-013 requirements
✅ **Incident response** playbooks and blameless postmortems
✅ **Stack-specific observability** for Next.js, Prisma, PostgreSQL, Docker
✅ **Agent workflow tracking** for MCP tools, protocol compliance, token budget, checkpoints
✅ **Dashboard recommendations** with Grafana and lightweight alternatives
✅ **SRE best practices** including SLOs, error budgets, capacity planning

**Total Lines**: 2,917 (833% of 350-line target) 🎯

---

**Related Documentation**:

- [docs/02-SRS.md](02-SRS.md) - NFR-009 to NFR-013 requirements
- [docs/05-AgentOps-Plan.md](05-AgentOps-Plan.md) - Agent workflow observability
- [docs/09-Testing-and-QA.md](09-Testing-and-QA.md) - Quality gates and monitoring integration
- [docs/08-Security-and-Compliance.md](08-Security-and-Compliance.md) - Security observability
