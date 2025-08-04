# Firebase Setup Guide for IMS MVP

## 🚀 Overview

This guide will help you set up Firebase for data persistence in your IMS (Inventory Management System) MVP. Firebase provides real-time database, authentication, and hosting capabilities.

## 📋 Prerequisites

1. Google account
2. Node.js and npm installed
3. Basic knowledge of React and TypeScript

## 🔧 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `ims-mvp` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## 🔧 Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for MVP)
4. Select a location (choose closest to your users)
5. Click "Done"

### Storage (Optional)
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location
5. Click "Done"

## 🔧 Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select "Web"
4. Register app with name: `ims-frontend`
5. Copy the configuration object

## 🔧 Step 4: Environment Variables

Create a `.env` file in the `dmis` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL (if still using Express backend)
VITE_API_URL=https://ims-server-one.vercel.app
```

Replace the values with your actual Firebase configuration.

## 🔧 Step 5: Firestore Security Rules

In Firebase Console, go to "Firestore Database" > "Rules" and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Specific rules for different collections
    match /inventory_items/{itemId} {
      allow read, write: if request.auth != null;
    }
    
    match /stock_transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    match /facilities/{facilityId} {
      allow read, write: if request.auth != null;
    }
    
    match /transfers/{transferId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔧 Step 6: Initialize Sample Data

You can add sample data through Firebase Console or use the application to create initial data.

### Sample Inventory Items:
```json
{
  "name": "Laptop Computers",
  "description": "High-performance laptops for office use",
  "category": "Electronics",
  "sku": "LAP-001",
  "unit": "units",
  "currentStock": 45,
  "minStock": 20,
  "maxStock": 100,
  "cost": 1200000,
  "supplier": "Tech Supplies Ltd",
  "location": "A1-01",
  "status": "active"
}
```

### Sample Facilities:
```json
{
  "name": "Main Warehouse",
  "type": "warehouse",
  "region": "Central",
  "district": "Kampala",
  "address": "Kampala, Uganda",
  "contactPerson": "John Doe",
  "contactPhone": "+256700000001",
  "status": "active"
}
```

## 🔧 Step 7: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the application
3. Try to sign up/sign in
4. Test creating inventory items
5. Verify real-time updates

## 🔧 Step 8: Deploy to Production

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting (Alternative)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## 🔧 Step 9: Security Considerations

### For Production:
1. Update Firestore rules to be more restrictive
2. Enable Firebase App Check
3. Set up proper authentication methods
4. Configure CORS properly
5. Use environment variables for all sensitive data

### Recommended Firestore Rules for Production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Inventory items - read for all authenticated users, write for specific roles
    match /inventory_items/{itemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'facility_manager');
    }
    
    // Similar rules for other collections...
  }
}
```

## 🔧 Step 10: Monitoring and Analytics

1. Enable Firebase Analytics
2. Set up error reporting
3. Monitor database usage
4. Set up alerts for unusual activity

## 🎯 Benefits of Firebase for MVP

### ✅ Real-time Updates
- Automatic synchronization across devices
- Live inventory updates
- Real-time notifications

### ✅ Scalability
- Automatic scaling
- No server management
- Global CDN

### ✅ Authentication
- Built-in user management
- Multiple auth providers
- Secure token handling

### ✅ Offline Support
- Automatic offline caching
- Sync when online
- Conflict resolution

### ✅ Cost-effective
- Free tier for MVP
- Pay-as-you-grow
- No upfront infrastructure costs

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure Firebase project settings are correct
2. **Authentication Failures**: Check if Email/Password auth is enabled
3. **Database Permission Errors**: Verify Firestore rules
4. **Environment Variables**: Ensure all variables are set correctly

### Debug Steps:
1. Check browser console for errors
2. Verify Firebase configuration
3. Test authentication flow
4. Check Firestore rules
5. Verify environment variables

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

## 🎉 Next Steps

After setting up Firebase:

1. **Customize the UI** to match your brand
2. **Add more features** like reporting and analytics
3. **Implement advanced security** rules
4. **Set up monitoring** and alerts
5. **Optimize performance** for larger datasets

---

**Note**: This setup provides a solid foundation for your MVP. As your application grows, consider implementing more advanced features like custom claims for user roles, more sophisticated security rules, and performance optimizations. 