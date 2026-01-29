import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('Force logout requested for user:', userId);

    // Create response and clear user cookie
    const response = NextResponse.json({
      success: true,
      message: 'User logged out successfully',
    });

    // Clear user cookie
    response.cookies.delete('user');

    return response;
  } catch (error) {
    console.error('Error in force-logout:', error);
    return NextResponse.json(
      { error: 'Failed to force logout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Force logout GET request');

    // Create response and clear user cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout endpoint ready',
    });

    // Clear user cookie
    response.cookies.delete('user');

    return response;
  } catch (error) {
    console.error('Error in force-logout GET:', error);
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
