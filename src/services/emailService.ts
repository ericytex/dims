// Email Service for DIMS using EmailJS (FREE)
// This service handles sending emails for user credentials and notifications
// EmailJS is completely free for up to 200 emails per month

import emailjs from '@emailjs/browser';

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
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor() {
    // EmailJS configuration - FREE service
    // You'll need to set up EmailJS account and get these values
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';
  }

  // Send user credentials email
  async sendUserCredentials(userData: UserCredentials): Promise<boolean> {
    try {
      const templateParams = {
        to_email: userData.email,
        to_name: userData.name,
        temp_password: userData.tempPassword,
        user_role: userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        message: this.generateCredentialsEmailText(userData),
        subject: 'Your DIMS Login Credentials'
      };

      return await this.sendEmailJS(templateParams);
    } catch (error) {
      console.error('Failed to send credentials email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordReset(userData: UserCredentials): Promise<boolean> {
    try {
      const templateParams = {
        to_email: userData.email,
        to_name: userData.name,
        temp_password: userData.tempPassword,
        user_role: userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        message: this.generatePasswordResetEmailText(userData),
        subject: 'DIMS Password Reset'
      };

      return await this.sendEmailJS(templateParams);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Main email sending function using EmailJS
  private async sendEmailJS(templateParams: any): Promise<boolean> {
    try {
      // For development/testing, we'll use a simple approach
      // In production, replace this with your EmailJS configuration
      
      if (import.meta.env.MODE === 'development') {
        // Development mode - log email details
        console.log('📧 EMAIL SENT (Development Mode - EmailJS):');
        console.log('To:', templateParams.to_email);
        console.log('Subject:', templateParams.subject);
        console.log('Content:', templateParams.message);
        console.log('Template Params:', templateParams);
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
      } else {
        // Production mode - use EmailJS
        return await this.sendEmailJSProduction(templateParams);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Production EmailJS sending
  private async sendEmailJSProduction(templateParams: any): Promise<boolean> {
    try {
      // Initialize EmailJS with your public key
      emailjs.init(this.publicKey);
      
      // Send email using EmailJS
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );
      
      console.log('📧 PRODUCTION EMAIL SENT via EmailJS:');
      console.log('To:', templateParams.to_email);
      console.log('Subject:', templateParams.subject);
      console.log('Response:', response);
      
      return response.status === 200;
    } catch (error) {
      console.error('EmailJS sending failed:', error);
      return false;
    }
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

// Export singleton instance - lazy loaded to prevent instantiation errors
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

// For backward compatibility, export the service directly
export const emailService = getEmailService(); 