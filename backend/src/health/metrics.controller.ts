import { Controller, Get, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() res: Response) {
    const startTime = Date.now();
    
    try {
      // Get system metrics
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const responseTime = Date.now() - startTime;
      
      // Check database health
      let dbStatus = 0;
      try {
        const dbHealthy = await this.databaseService.healthCheck();
        dbStatus = dbHealthy ? 1 : 0;
      } catch (error) {
        dbStatus = 0;
      }

      // Build Prometheus metrics
      const metrics = [
        '# HELP nodejs_heap_size_used_bytes Process heap space used by Node.js in bytes',
        '# TYPE nodejs_heap_size_used_bytes gauge',
        `nodejs_heap_size_used_bytes ${memoryUsage.heapUsed}`,
        '',
        '# HELP nodejs_heap_size_total_bytes Process heap space total by Node.js in bytes',
        '# TYPE nodejs_heap_size_total_bytes gauge',
        `nodejs_heap_size_total_bytes ${memoryUsage.heapTotal}`,
        '',
        '# HELP nodejs_external_memory_bytes Node.js external memory size in bytes',
        '# TYPE nodejs_external_memory_bytes gauge',
        `nodejs_external_memory_bytes ${memoryUsage.external}`,
        '',
        '# HELP process_uptime_seconds Number of seconds this process has been running',
        '# TYPE process_uptime_seconds gauge',
        `process_uptime_seconds ${uptime}`,
        '',
        '# HELP database_connection_status Database connection status (1 = connected, 0 = disconnected)',
        '# TYPE database_connection_status gauge',
        `database_connection_status ${dbStatus}`,
        '',
        '# HELP http_request_duration_seconds HTTP request duration in seconds',
        '# TYPE http_request_duration_seconds gauge',
        `http_request_duration_seconds ${responseTime / 1000}`,
        '',
        '# HELP app_info Application information',
        '# TYPE app_info gauge',
        `app_info{version="${process.env.npm_package_version || '1.0.0'}",node_version="${process.version}"} 1`,
        '',
        '# HELP app_health_status Application health status (1 = healthy, 0 = unhealthy)',
        '# TYPE app_health_status gauge',
        `app_health_status ${dbStatus}`,
        ''
      ].join('\n');

      res.send(metrics);
    } catch (error) {
      const errorMetrics = [
        '# HELP app_health_status Application health status (1 = healthy, 0 = unhealthy)',
        '# TYPE app_health_status gauge',
        'app_health_status 0',
        '',
        '# HELP app_error_total Total number of application errors',
        '# TYPE app_error_total counter',
        'app_error_total 1',
        ''
      ].join('\n');

      res.send(errorMetrics);
    }
  }
}
