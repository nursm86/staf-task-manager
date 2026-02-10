import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (!token || !storedUser) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/auth/me');
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            } catch {
                // If /me fails but we have stored credentials, trust them
                // This handles Apache proxy stripping auth headers
                const parsed = JSON.parse(storedUser);
                if (parsed && parsed._id) {
                    setUser(parsed);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const login = async (password) => {
        const { data } = await api.post('/auth/login', { password });
        localStorage.setItem('token', data.token);
        const userData = { _id: data._id, name: data.name, role: data.role };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
