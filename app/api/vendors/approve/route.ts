import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Cliente admin do Supabase (usa a service role key, só roda no servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId é obrigatório' }, { status: 400 });
    }

    // 1. Busca a requisição pendente
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('vendor_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Requisição não encontrada' }, { status: 404 });
    }

    if (application.status === 'approved') {
      return NextResponse.json({ error: 'Requisição já aprovada' }, { status: 400 });
    }

    // 2. Gera senha temporária
    const tempPassword = generateTempPassword();

    // 3. Cria o usuário no Supabase Auth (já confirmado, sem precisar de email de confirmação)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: application.user_email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError?.message}` },
        { status: 500 }
      );
    }

    // 4. Cria o registro em vendors
    const { error: vendorError } = await supabaseAdmin.from('vendors').insert({
      user_id: authData.user.id,
      name: application.full_name,
      email: application.user_email,
      phone: application.phone,
      description: application.bio,
      category: application.category,
      status: 'approved',
      approved_at: new Date().toISOString(),
    });

    if (vendorError) {
      return NextResponse.json(
        { error: `Erro ao criar vendor: ${vendorError.message}` },
        { status: 500 }
      );
    }

    // 5. Envia o email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Mob Experience <onboarding@resend.dev>',
      to: application.user_email,
      subject: 'Sua solicitação foi aprovada! 🎉',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Bem-vindo(a) ao Mob Experience!</h2>
          <p>Sua solicitação foi aprovada! Use as credenciais abaixo para fazer login:</p>
          <p><strong>Email:</strong> ${application.user_email}</p>
          <p><strong>Senha temporária:</strong> ${tempPassword}</p>
          <p>
            <a href="https://mob-experience.vercel.app/auth/login"
               style="display:inline-block; padding:10px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:8px;">
              Fazer login
            </a>
          </p>
          <p style="color:#666; font-size:14px;">Recomendamos trocar sua senha assim que fizer login.</p>
        </div>
      `,
    });

    // 6. Atualiza a requisição (status + rastreamento de email)
    await supabaseAdmin
      .from('vendor_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        email_sent: !emailError,
        email_sent_at: !emailError ? new Date().toISOString() : null,
      })
      .eq('id', applicationId);

   if (emailError) {
      // Vendor foi criado, mas o email falhou -- avisa o admin
      return NextResponse.json(
        { warning: 'Vendor criado, mas o email falhou ao enviar.', emailError },
        { status: 207 }
      );
    }

    return NextResponse.json({ success: true, message: 'Vendor aprovado e email enviado!' });
  } catch (err) {
    console.error('Erro no approve:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}