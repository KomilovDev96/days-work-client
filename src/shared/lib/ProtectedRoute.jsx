import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../entities/user/model/authSlice';

const ProtectedRoute = ({ allowedRoles }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector((state) => state.auth.user);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
