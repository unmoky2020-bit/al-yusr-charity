import { Navigate } from "react-router-dom";

/** Permissions UI is now merged into /admin/users (Granular permissions tab). */
const AdminPermissions = () => <Navigate to="/admin/users?tab=permissions" replace />;
export default AdminPermissions;
