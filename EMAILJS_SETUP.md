# EmailJS Setup Guide for DIMS

## Overview
EmailJS is a free service that allows you to send emails directly from your frontend JavaScript code without a backend server. It's perfect for the DIMS system to send user credentials and password reset emails.

## Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Add Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps
5. Note down your **Service ID**

## Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this HTML structure:

```html
<!DOCTYPE html>
<html>
<head>
    <title>DIMS User Credentials</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0;">DIMS - Inventory Management System</h1>
            <p style="margin: 5px 0; color: #7f8c8d;">Republic of Uganda</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <h2 style="color: #2c3e50;">Welcome to DIMS, {{to_name}}!</h2>
            
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">LOGIN CREDENTIALS:</h3>
                <p><strong>Email:</strong> {{to_email}}</p>
                <p><strong>Temporary Password:</strong> {{temp_password}}</p>
                <p><strong>Role:</strong> {{user_role}}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">IMPORTANT SECURITY NOTICE:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>This is a temporary password</li>
                    <li>You must change your password on first login</li>
                    <li>Keep your credentials secure and confidential</li>
                    <li>Do not share your password with anyone</li>
                </ul>
            </div>
            
            <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0c5460;">HOW TO LOGIN:</h4>
                <ol style="margin: 0; padding-left: 20px;">
                    <li>Go to the DIMS login page</li>
                    <li>Enter your email address</li>
                    <li>Enter the temporary password above</li>
                    <li>You will be prompted to change your password</li>
                    <li>Set a strong, secure password</li>
                </ol>
            </div>
            
            <p>If you have any questions or need assistance, please contact your system administrator.</p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d; text-align: center;">
                This is an automated message from the DIMS system.<br>
                Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
```

4. Note down your **Template ID**

## Step 4: Get Your Public Key
1. Go to "Account" → "API Keys"
2. Copy your **Public Key**

## Step 5: Environment Variables
Create a `.env` file in your project root with these variables:

```bash
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Important:** 
- Use `VITE_` prefix (not `REACT_APP_`) for Vite projects
- Replace the placeholder values with your actual EmailJS credentials
- Never commit your `.env` file to version control

## Step 6: Test Email Sending
1. Start your development server: `npm run dev`
2. Go to User Management page
3. Add a new user with an email address
4. Check the browser console for email details (development mode)
5. In production, emails will be sent via EmailJS

## Free Tier Limits
- **200 emails per month** (free)
- **2 email templates** (free)
- **1 email service** (free)
- Perfect for small to medium organizations

## Troubleshooting
- **"process is not defined"**: Make sure you're using `VITE_` prefix in environment variables
- **Email not sending**: Check your EmailJS service configuration and template variables
- **Template errors**: Verify all template variables match the ones used in your code

## Security Notes
- EmailJS public key is safe to expose in frontend code
- Service ID and Template ID are also safe to expose
- Never expose your EmailJS private keys or service passwords 