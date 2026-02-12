import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions, getUserGuilds } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const guilds = await getUserGuilds(session.accessToken);
    return NextResponse.json({ guilds });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: 500 });
  }
}
