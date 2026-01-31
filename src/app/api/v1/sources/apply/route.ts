import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ApplicationData {
  name: string;
  email: string;
  website?: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplicationData = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Try to insert into database
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('source_applications')
      .insert({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        website: body.website?.trim() || null,
        description: body.description.trim(),
        slug: slug,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);

      // Check for duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application with this email already exists' },
          { status: 409 }
        );
      }

      // If table doesn't exist yet, just log and return success for demo
      if (error.code === '42P01') {
        console.log('Table does not exist yet. Application would be:', {
          name: body.name,
          email: body.email,
          website: body.website,
          description: body.description,
          slug: slug,
        });

        return NextResponse.json({
          success: true,
          message: 'Application received (demo mode - database not configured)',
          application_id: `demo-${Date.now()}`,
        });
      }

      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email using Resend

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application_id: data.id,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
