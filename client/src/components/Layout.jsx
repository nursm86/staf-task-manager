import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`;

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Brand */}
                <div className="flex items-center justify-between px-6 h-16 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-lg text-foreground">STAF</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden p-1 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <NavLink
                        to="/dashboard"
                        className={navLinkClasses}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </NavLink>

                    <div className="pt-4 pb-2 px-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Team
                        </p>
                    </div>

                    {allUsers.map((u) => (
                        <NavLink
                            key={u._id}
                            to={`/profile/${u._id}`}
                            className={navLinkClasses}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {u.name.charAt(0)}
                            </div>
                            {u.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="px-3 py-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-card border-b border-border">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground cursor-pointer"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-foreground">STAF</span>
                    <div className="w-9" />
                </header>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
