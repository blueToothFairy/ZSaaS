import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 1. Lấy secret từ biến môi trường
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // 2. Lấy Headers từ request gửi đến
  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  // Kiểm tra nếu thiếu headers cần thiết
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // 3. Lấy nội dung body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // 4. Khởi tạo Svix để xác thực
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify payload
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // 5. Xử lý logic nghiệp vụ (Lưu vào Supabase)
  const eventType = evt.type;
  
  // Khởi tạo Supabase Client với quyền Admin (Service Role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Xử lý khi user được tạo mới hoặc cập nhật
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    // Sử dụng Upsert: Nếu ID đã có -> Update, chưa có -> Insert
    const { error } = await supabase
        .from('user_profiles')
        .upsert({
            id: id,
            email: email,
            first_name: first_name,
            last_name: last_name,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Supabase error:', error);
        return new Response('Error inserting to DB', { status: 500 });
    }
  }

  // Xử lý khi user bị xóa
  if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', id!);

      if (error) {
          console.error('Supabase error:', error);
          return new Response('Error deleting user', { status: 500 });
      }
  }

  return new Response('Webhook received', { status: 200 })
}