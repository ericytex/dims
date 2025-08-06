# 📧 EmailJS Setup Guide (FREE Email Service)

## 🎉 **EmailJS is COMPLETELY FREE!**
- ✅ **200 emails per month** - FREE
- ✅ **No credit card required**
- ✅ **Easy setup** - 5 minutes
- ✅ **Professional templates**
- ✅ **Reliable delivery**

## 🚀 **Quick Setup (5 minutes):**

### **Step 1: Create EmailJS Account**
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" (FREE)
3. Create account with your email

### **Step 2: Add Email Service**
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose "Gmail" (recommended) or "Outlook"
4. Connect your email account
5. Copy the **Service ID** (e.g., `service_abc123`)

### **Step 3: Create Email Template**
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:

```html
<!DOCTYPE html>
<html>
<head>
    <title>DIMS Login Credentials</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px;">
            <h2>🇺🇬 DIMS - Inventory Management System</h2>
            <p>Republic of Uganda</p>
        </div>
        
        <div style="padding: 20px;">
            <h3>Welcome to DIMS, {{to_name}}!</h3>
            
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Login Credentials:</h4>
                <p><strong>Email:</strong> {{to_email}}</p>
                <p><strong>Temporary Password:</strong> {{temp_password}}</p>
                <p><strong>Role:</strong> {{user_role}}</p>
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
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
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from the DIMS system.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
```

4. Copy the **Template ID** (e.g., `template_xyz789`)

### **Step 4: Get Public Key**
1. Go to "Account" → "API Keys"
2. Copy your **Public Key** (e.g., `user_abc123def456`)

### **Step 5: Add to Environment Variables**
Add these to your `.env` file:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## 🎯 **That's It!**

Your email system is now ready to send **real emails** for free!

## 📊 **EmailJS Pricing (FREE):**

| Plan | Price | Emails/Month | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 200 | ✅ All features |
| Starter | $15 | 1,000 | More emails |
| Professional | $35 | 5,000 | Advanced features |

## 🔧 **Testing:**

1. **Development Mode:** Emails are logged to console
2. **Production Mode:** Real emails are sent via EmailJS
3. **No setup required** for development testing

## 🚨 **Important Notes:**

- ✅ **200 emails/month** is plenty for most organizations
- ✅ **No credit card** required for free plan
- ✅ **Professional delivery** with high success rate
- ✅ **Easy to upgrade** if you need more emails

## 🆘 **Need Help?**

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Support: Available in EmailJS dashboard
- Community: Active forums and tutorials

---

**🎉 Your DIMS system now has FREE, professional email functionality!** 