import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Status from '@/models/Status';
import User from '@/models/User';
import { auth } from '@/auth';

// Get the current system status
export async function GET() {
  try {
    await connectDB();
    const status = await Status.findOne().sort({ createdAt: -1 }).populate('user', 'name email role');
    
    if (!status) {
      return NextResponse.json({ isOnline: false, isChatbotActive: false }, { status: 200 });
    }
    
    return NextResponse.json({ 
      isOnline: status.isOnline, 
      isChatbotActive: status.isChatbotActive,
      lastSeen: status.lastSeen,
      admin: status.user ? {
        id: status.user._id,
        name: status.user.name,
        email: status.user.email
      } : null
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update system status (admin only)
export async function PUT(req) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { isOnline, isChatbotActive } = await req.json();
    
    await connectDB();
    
    let status = await Status.findOne({ user: user._id });
    
    if (!status) {
      status = new Status({ 
        user: user._id,
        isOnline: typeof isOnline === 'boolean' ? isOnline : false,
        isChatbotActive: typeof isChatbotActive === 'boolean' ? isChatbotActive : false,
        lastSeen: new Date()
      });
    } else {
      if (typeof isOnline === 'boolean') status.isOnline = isOnline;
      if (typeof isChatbotActive === 'boolean') status.isChatbotActive = isChatbotActive;
      status.lastSeen = new Date();
    }
    
    await status.save();
    
    return NextResponse.json({ 
      isOnline: status.isOnline, 
      isChatbotActive: status.isChatbotActive,
      lastSeen: status.lastSeen
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating system status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 