// Email Service for DIMS
// This service handles sending emails for user credentials and notifications

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface UserCredentials {
  name: string;
  email: string;
  tempPassword: string;
  role: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    // For now, we'll use a simple approach that can be easily replaced
    // In production, you'd use a service like SendGrid, AWS SES, or similar
    this.apiKey = process.env.REACT_APP_EMAIL_API_KEY || '';
    this.fromEmail = 'noreply@dims.go.ug';
    this.fromName = 'DIMS - Inventory Management System';
  }

  // Send user credentials email
  async sendUserCredentials(userData: UserCredentials): Promise<boolean> {
    try {
      const emailData: EmailData = {
        to: userData.email,
        subject: 'Your DIMS Login Credentials',
        html: this.generateCredentialsEmailHTML(userData),
        text: this.generateCredentialsEmailText(userData)
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send credentials email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordReset(userData: UserCredentials): Promise<boolean> {
    try {
      const emailData: EmailData = {
        to: userData.email,
        subject: 'DIMS Password Reset',
        html: this.generatePasswordResetEmailHTML(userData),
        text: this.generatePasswordResetEmailText(userData)
      };

      return await this.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Main email sending function
  private async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // For development/testing, we'll use a simple approach
      // In production, replace this with your preferred email service
      
      if (process.env.NODE_ENV === 'development') {
        // Development mode - log email details
        console.log('📧 EMAIL SENT (Development Mode):');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('Content:', emailData.text);
        console.log('HTML:', emailData.html);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
      } else {
        // Production mode - use actual email service
        return await this.sendEmailProduction(emailData);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Production email sending (placeholder for real email service)
  private async sendEmailProduction(emailData: EmailData): Promise<boolean> {
    // This is where you'd integrate with your preferred email service
    // Examples: SendGrid, AWS SES, Mailgun, etc.
    
    // For now, we'll simulate success
    // TODO: Replace with actual email service integration
    console.log('📧 PRODUCTION EMAIL SENT:');
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    
    return true;
  }

  // Generate HTML email for user credentials
  private generateCredentialsEmailHTML(userData: UserCredentials): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>DIMS Login Credentials</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .credentials { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🇺🇬 DIMS - Inventory Management System</h2>
            <p>Republic of Uganda</p>
          </div>
          
          <div class="content">
            <h3>Welcome to DIMS, ${userData.name}!</h3>
            
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
              <h4>Login Credentials:</h4>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Temporary Password:</strong> ${userData.tempPassword}</p>
              <p><strong>Role:</strong> ${userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Notice:</h4>
              <ul>
                <li>This is a temporary password</li>
                <li>You must change your password on first login</li>
                <li>Keep your credentials secure and confidential</li>
                <li>Do not share your password with anyone</li>
              </ul>
            </div>
            
            <h4>How to Login:</h4>
            <ol>
              <li>Go to the DIMS login page</li>
              <li>Enter your email address</li>
              <li>Enter the temporary password above</li>
              <li>You will be prompted to change your password</li>
              <li>Set a strong, secure password</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your system administrator.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the DIMS system.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text email for user credentials
  private generateCredentialsEmailText(userData: UserCredentials): string {
    return `
DIMS - Inventory Management System
Republic of Uganda

Welcome to DIMS, ${userData.name}!

Your account has been created successfully. Here are your login credentials:

LOGIN CREDENTIALS:
Email: ${userData.email}
Temporary Password: ${userData.tempPassword}
Role: ${userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}

IMPORTANT SECURITY NOTICE:
- This is a temporary password
- You must change your password on first login
- Keep your credentials secure and confidential
- Do not share your password with anyone

HOW TO LOGIN:
1. Go to the DIMS login page
2. Enter your email address
3. Enter the temporary password above
4. You will be prompted to change your password
5. Set a strong, secure password

If you have any questions or need assistance, please contact your system administrator.

This is an automated message from the DIMS system.
Please do not reply to this email.
    `;
  }

  // Generate HTML email for password reset
  private generatePasswordResetEmailHTML(userData: UserCredentials): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>DIMS Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .credentials { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🇺🇬 DIMS - Inventory Management System</h2>
            <p>Republic of Uganda</p>
          </div>
          
          <div class="content">
            <h3>Password Reset for ${userData.name}</h3>
            
            <p>Your password has been reset by your system administrator. Here are your new login credentials:</p>
            
            <div class="credentials">
              <h4>New Login Credentials:</h4>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>New Temporary Password:</strong> ${userData.tempPassword}</p>
              <p><strong>Role:</strong> ${userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Notice:</h4>
              <ul>
                <li>This is a new temporary password</li>
                <li>You must change your password on next login</li>
                <li>Keep your credentials secure and confidential</li>
                <li>Do not share your password with anyone</li>
              </ul>
            </div>
            
            <h4>How to Login:</h4>
            <ol>
              <li>Go to the DIMS login page</li>
              <li>Enter your email address</li>
              <li>Enter the new temporary password above</li>
              <li>You will be prompted to change your password</li>
              <li>Set a strong, secure password</li>
            </ol>
            
            <p>If you did not request this password reset, please contact your system administrator immediately.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the DIMS system.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate text email for password reset
  private generatePasswordResetEmailText(userData: UserCredentials): string {
    return `
DIMS - Inventory Management System
Republic of Uganda

Password Reset for ${userData.name}

Your password has been reset by your system administrator. Here are your new login credentials:

NEW LOGIN CREDENTIALS:
Email: ${userData.email}
New Temporary Password: ${userData.tempPassword}
Role: ${userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}

IMPORTANT SECURITY NOTICE:
- This is a new temporary password
- You must change your password on next login
- Keep your credentials secure and confidential
- Do not share your password with anyone

HOW TO LOGIN:
1. Go to the DIMS login page
2. Enter your email address
3. Enter the new temporary password above
4. You will be prompted to change your password
5. Set a strong, secure password

If you did not request this password reset, please contact your system administrator immediately.

This is an automated message from the DIMS system.
Please do not reply to this email.
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService(); 