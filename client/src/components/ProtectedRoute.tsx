import { useContext, type FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute: FC = () => {
    const { signed, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return signed ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
