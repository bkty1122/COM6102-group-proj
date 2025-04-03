// /workspaces/COM6102-group-proj/frontend/src/api/index.js
import apiClient from './apiClient';
import formExportApi from './formExportApi';

// Export individual API modules
export {
  formExportApi
};

// Export other modules as they are created
// export { userApi } from './userApi';
// export { authApi } from './authApi';

// Export the base client for direct use when needed
export default apiClient;