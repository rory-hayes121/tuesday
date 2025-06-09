import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendInvitationRequest {
  email: string;
  role: 'admin' | 'employee';
  workspaceId: string;
  invitedBy: string;
  workspaceName: string;
  inviterName: string;
  resend?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { 
      email, 
      role, 
      workspaceId, 
      invitedBy, 
      workspaceName, 
      inviterName,
      resend = false 
    }: SendInvitationRequest = await req.json();

    // Validate required fields
    if (!email || !role || !workspaceId || !invitedBy || !workspaceName || !inviterName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Sending invitation to:', email, 'for workspace:', workspaceName);

    // Generate a unique invitation token
    const invitationToken = crypto.randomUUID();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email: email.toLowerCase(),
        role,
        workspace_id: workspaceId,
        invited_by: invitedBy,
        token: invitationToken,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Failed to create invitation:', invitationError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation: ' + invitationError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Invitation record created:', invitation.id);

    // Create invitation URL
    const baseUrl = req.headers.get('origin') || 'http://localhost:5173';
    const invitationUrl = `${baseUrl}/invite/${invitationToken}`;

    // Send email invitation
    try {
      // For now, we'll log the invitation details
      // In production, you would integrate with an email service like SendGrid, Resend, etc.
      console.log('=== EMAIL INVITATION ===');
      console.log('To:', email);
      console.log('Subject: Invitation to join', workspaceName);
      console.log('Invitation URL:', invitationUrl);
      console.log('Invited by:', inviterName);
      console.log('Role:', role);
      console.log('Expires:', expiresAt.toLocaleDateString());
      console.log('========================');

      // TODO: Replace this with actual email sending
      // Example with a hypothetical email service:
      /*
      await sendEmail({
        to: email,
        subject: `Invitation to join ${workspaceName}`,
        html: `
          <h2>You've been invited to join ${workspaceName}</h2>
          <p>Hi there!</p>
          <p>${inviterName} has invited you to join their workspace "${workspaceName}" as ${role}.</p>
          <p><a href="${invitationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
          <p>This invitation will expire on ${expiresAt.toLocaleDateString()}.</p>
          <p>If you have any questions, please contact ${inviterName} directly.</p>
        `
      });
      */

    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the entire process if email fails
      // The invitation is still created in the database
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          expires_at: invitation.expires_at
        },
        message: resend ? 'Invitation resent successfully' : 'Invitation sent successfully',
        // For development, include the invitation URL in the response
        invitationUrl: invitationUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});