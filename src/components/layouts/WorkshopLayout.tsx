import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Wrench,
    Calendar,
    LogOut,
    Users,
    Settings,
    Search,
    Bell,
    Plus,
    Building2,
    CheckCircle2,
    UserCircle,
    Boxes
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function WorkshopLayout() {
    const { signOut, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { label: "Dashboard", icon: LayoutDashboard, path: "/workshop" },
        { label: "Agenda", icon: Calendar, path: "/workshop/appointments" },
        { label: "Serviços", icon: Wrench, path: "/workshop/services" },
        { label: "Estoque", icon: Boxes, path: "/workshop/products" },
        { label: "Empresa", icon: Building2, path: "/workshop/company" },
    ];

    const handleNovaOS = () => {
        navigate("/workshop/appointments?new=true");
    };

    const handleNotifications = () => {
        toast.info("Você não tem novas notificações no momento.");
    };

    const handleProfileClick = () => {
        toast.info("Configurações de perfil em desenvolvimento.");
    };

    const handleSettingsClick = () => {
        navigate("/workshop/company");
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen flex bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
                <div className="p-6">
                    <div className="flex items-center gap-2 px-2">
                        <div className="bg-emerald-600 p-1.5 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Rota Certa</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path}>
                            <Button
                                variant="ghost"
                                className={`w-full justify-start transition-all duration-200 ${isActive(item.path)
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive(item.path) ? "text-emerald-600" : ""}`} />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-4">
                    <div className="bg-emerald-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Status Global</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-medium text-emerald-900">Oficina Online</span>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair do Painel
                    </Button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center flex-1 max-w-xl">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar clientes, bikes, OS..."
                                className="pl-10 h-10 bg-slate-50 border-transparent focus:bg-white transition-all w-full max-w-md"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 mr-4">
                            <Button variant="ghost" size="icon" className="text-slate-500 relative" onClick={handleNotifications}>
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                            </Button>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                        <div className="flex items-center gap-3">
                            <Button onClick={handleNovaOS} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Nova OS</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Avatar className="h-8 w-8 border border-slate-200">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold uppercase">
                                                {user?.email?.[0] || 'O'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                    <div className="px-2 pb-2 text-xs text-slate-500 truncate">{user?.email}</div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2" onClick={handleProfileClick}>
                                        <UserCircle className="h-4 w-4" /> Perfil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2" onClick={handleSettingsClick}>
                                        <Settings className="h-4 w-4" /> Configurações
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 gap-2" onClick={handleLogout}>
                                        <LogOut className="h-4 w-4" /> Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
