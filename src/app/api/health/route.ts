/**
 * Health Check API Route
 * Demonstrates database connectivity and Prisma client usage
 */

import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Returns server health status and database connectivity
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        message: 'Server and database are operational',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/health
 * Quick health check (no response body)
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response(null, { status: 200 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
