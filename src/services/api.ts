// Production API endpoints - using new backend deployment
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://ims-server-jo143dwke-ericytexs-projects.vercel.app' 
  : 'http://localhost:3001'; 