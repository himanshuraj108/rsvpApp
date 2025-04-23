import nodemailer from 'nodemailer';

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Increase timeouts to prevent connection issues
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 30000, // 30 seconds
});

// Verify transporter configuration - only do this on startup, not on every request
let transporterVerified = false;

/**
 * Send an email notification about an event
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject (optional)
 * @param {string} options.eventTitle - Title of the event
 * @param {string} options.eventDate - Date of the event
 * @param {string} options.eventTime - Time of the event
 * @param {string} options.eventLocation - Location of the event
 * @param {string} options.eventDescription - Description of the event
 * @param {string} options.eventLink - Link to the event
 */
export async function sendEventInvitation(options) {
  const { 
    to, 
    eventTitle, 
    eventDate, 
    eventTime, 
    eventLocation, 
    eventDescription, 
    eventLink, 
    subject 
  } = options;

  // Allow sending to multiple recipients by joining the array with commas
  const recipients = Array.isArray(to) ? to.join(', ') : to;

  // Verify transporter on first use
  if (!transporterVerified) {
    try {
      await transporter.verify();
      transporterVerified = true;
      console.log('SMTP server connection established');
    } catch (error) {
      console.error('SMTP server connection error:', error);
      return { 
        success: false, 
        error: 'Email service configuration error. Please contact support.' 
      };
    }
  }

  const mailOptions = {
    from: `"RSVP App" <${process.env.EMAIL_USER}>`,
    to: recipients,
    subject: subject || `Invitation: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">You're invited to: ${eventTitle}</h2>
        
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;">
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
          
          <div style="margin: 20px 0;">
            <h3>About the event:</h3>
            <p>${eventDescription}</p>
          </div>
          
          <div style="margin-top: 30px;">
            <a href="${eventLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Event Details
            </a>
          </div>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          This invitation was sent from RSVP App. If you don't want to receive these emails in the future, please contact the event organizer.
        </p>
      </div>
    `,
  };

  try {
    console.log('Attempting to send invitation email to:', recipients);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP verification code via email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.otp - OTP code
 */
export async function sendOtpEmail(options) {
  const { to, otp } = options;

  const mailOptions = {
    from: `"RSVP App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Verification Code for RSVP App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 style="color: #4f46e5;">Your Verification Code</h2>
        
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px;">
          <p>Use the following code to verify your action:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px; margin: 30px 0;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
    text: `Your verification code is: ${otp}. This code will expire in 10 minutes.` // Plain text version
  };

  try {
    console.log('Attempting to send OTP email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
} 