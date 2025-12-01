
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

// GET: 飲酒記録の一覧を取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date'); // 'today' など

    // ユーザーのプロフィールを取得
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const where: any = {
      profile_id: profile.id,
    };
    
    if (type) {
      where.type = type;
    }
    
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      where.created_at = {
        gte: today,
        lt: tomorrow,
      };
    } else if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    const records = await prisma.drink.findMany({
      where,
      include: {
        profile: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

// POST: 新しい飲酒記録を作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // ユーザーのプロフィールを取得
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 最小限のバリデーション - amount_mlはオプションに
    const record = await prisma.drink.create({
      data: {
        profile_id: profile.id,
        amount_ml: body.amount_ml ? parseFloat(body.amount_ml) : null,
        type: body.type || null,
        created_at: body.created_at ? new Date(body.created_at) : undefined,
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}

// PUT: 既存の記録を更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // ユーザーのプロフィールを取得
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 記録がユーザーのものか確認
    const existingRecord = await prisma.drink.findFirst({
      where: {
        id: String(id),
        profile_id: profile.id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    const record = await prisma.drink.update({
      where: {
        id: String(id),
      },
      data: {
        amount_ml: body.amount_ml !== undefined ? parseFloat(body.amount_ml) : undefined,
        type: body.type !== undefined ? body.type : undefined,
        created_at: body.created_at ? new Date(body.created_at) : undefined,
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// DELETE: 記録を削除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // ユーザーのプロフィールを取得
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // 記録がユーザーのものか確認
    const existingRecord = await prisma.drink.findFirst({
      where: {
        id: String(id),
        profile_id: profile.id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.drink.delete({
      where: {
        id: String(id),
      },
    });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
