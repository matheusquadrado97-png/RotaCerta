import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Bike,
    Activity,
    Wrench,
    Settings,
    LogOut,
    UserCircle,
    Search
} from "lucide-react";

export default function CyclistLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Painel", path: "/dashboard" },
        { icon: Bike, label: "Minhas Bikes", path: "/dashboard/bikes" },
        { icon: Activity, label: "Atividades", path: "/dashboard/activities" },
        { icon: Wrench, label: "Manutenções", path: "/dashboard/maintenance" },
        { icon: Search, label: "Procurar Oficinas", path: "/dashboard/search" },
        { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1a1c1e] text-white flex flex-col hidden md:flex">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-emerald-500 tracking-tight italic">Rota Certa</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start text-gray-400 hover:text-white hover:bg-white/10 ${isActive(item.path) ? "bg-white/10 text-emerald-500 hover:text-emerald-500" : ""
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive(item.path) ? "text-emerald-500" : ""}`} />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 mt-auto border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <UserCircle className="h-6 w-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "Usuário"}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
