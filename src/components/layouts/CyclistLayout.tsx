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
    Search,
    Moon,
    Sun
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";

export default function CyclistLayout() {
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
        <div className="min-h-screen flex bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-white/10 flex flex-col hidden md:flex relative overflow-hidden group">
                {/* Decorative background gradient */}
                <div className="absolute top-0 right-0 w-32 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />

                <div className="p-8">
                    <h1 className="text-3xl font-extrabold tracking-tighter italic text-gradient">Pelotão.io</h1>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2 relative z-10">
                    {menuItems.map((item) => (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start h-12 gap-3 font-bold transition-all duration-300 rounded-xl group/btn ${isActive(item.path)
                                    ? "bg-primary/10 text-primary shadow-glow border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    }`}
                            >
                                <div className={`p-2 rounded-lg transition-all duration-300 ${isActive(item.path) ? "bg-primary text-white" : "bg-muted group-hover/btn:bg-white/10"
                                    }`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                {item.label}
                                {isActive(item.path) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-6 mt-auto border-t border-white/10 bg-muted/30 backdrop-blur-sm relative z-10">
                    <div className="flex items-center gap-4 mb-6 px-1">
                        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-glow shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <UserCircle className="h-7 w-7" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-base font-bold truncate group-hover:text-primary transition-colors">{user?.user_metadata?.full_name || "Atleta"}</p>
                            <p className="text-xs text-muted-foreground font-medium truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-xl font-bold gap-3"
                        onClick={handleLogout}
                    >
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground transition-all duration-300 group-hover:bg-destructive/10">
                            <LogOut className="h-5 w-5" />
                        </div>
                        Sair do App
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-full h-11 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl"
                        onClick={toggleTheme}
                        title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
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
