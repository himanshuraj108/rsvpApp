import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `RSVP App <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your RSVP App account.</p>
      <p>Please click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request this, please ignore this email. The link will expire in 10 minutes.</p>
      <p>Thanks,<br>The RSVP App Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your RSVP App Password',
    html,
  });
};

export const sendEventInvitationEmail = async (email, userName, eventDetails, inviteUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You're Invited!</h2>
      <p>Hello ${userName},</p>
      <p>You've been invited to the following event:</p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${eventDetails.title}</h3>
        <p><strong>Date:</strong> ${eventDetails.formattedDate}</p>
        <p><strong>Time:</strong> ${eventDetails.time}</p>
        <p><strong>Location:</strong> ${eventDetails.location}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Respond to Invitation</a>
      </div>
      <p>We hope to see you there!</p>
      <p>Best regards,<br>The RSVP App Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Invitation: ${eventDetails.title}`,
    html,
  });
};

export default sendEmail; 