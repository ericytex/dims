// Production API endpoints - using new backend deployment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://ims-server-one.vercel.app' 
  : 'http://localhost:3001'; 