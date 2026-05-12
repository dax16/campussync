import nodemailer from 'nodemailer';

const transport = (process.env['NODE_ENV'] !== 'test' && process.env['EMAIL_USER'] && process.env['EMAIL_PASS'])
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env['EMAIL_USER'], pass: process.env['EMAIL_PASS'] },
    })
  : nodemailer.createTransport({ jsonTransport: true }); // dev/test: logs email as JSON instead of sending

export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
): Promise<void> => {
  const info = await transport.sendMail({
    from: `"CampusSync" <${process.env['EMAIL_USER'] ?? 'noreply@campussync.local'}>`,
    to,
    subject: 'Reset your CampusSync password',
    text: `Click the link below to reset your password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>Click the link below to reset your password (expires in 1 hour):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request this, ignore this email.</p>`,
  });

  if (!process.env['EMAIL_USER']) {
    console.log('📧 [DEV] Password reset email (not sent):', resetUrl);
    console.log('Full message JSON:', JSON.stringify(info));
  }
};
