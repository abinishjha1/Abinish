import { NextRequest, NextResponse } from 'next/server';

// In-memory store for visitor IPs (resets on server restart)
// For production, consider using a database or Redis
const visitedIPs = new Set<string>();

function getClientIP(request: NextRequest): string {
  // Try various headers that proxies/load balancers set
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback
  return 'unknown';
}

// GET — Check if this visitor's IP has been seen before
export async function GET(request: NextRequest) {
  const ip = getClientIP(request);

  return NextResponse.json({
    isReturning: visitedIPs.has(ip),
    ip: ip === 'unknown' ? null : ip,
  });
}

// POST — Register this visitor's IP as "seen"
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  if (ip !== 'unknown') {
    visitedIPs.add(ip);
  }

  return NextResponse.json({
    success: true,
    registered: ip !== 'unknown',
  });
}
