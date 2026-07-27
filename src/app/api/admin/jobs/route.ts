import { NextResponse } from 'next/server';
import { getActiveJobs } from '@/lib/jobs';

export async function GET() {
  return NextResponse.json(getActiveJobs());
}
