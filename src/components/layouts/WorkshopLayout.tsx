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
        { label: "ServiÃ§os", icon: Wrench, path: "/workshop/services" },
        { label: "Estoque", icon: Boxes, path: "/workshop/products" },
        { label: "Empresa", icon: Building2, path: "/workshop/company" },
    ];

    const handleNovaOS = () => {
        navigate("/workshop/appointments?new=true");
    };

    const handleNotifications = () => {
        toast.info("VocÃª nÃ£o tem novas notificaÃ§Ãµes no momento.");
    };

    const handleProfileClick = () => {
        toast.info("ConfiguraÃ§Ãµes de perfil em desenvolvimento.");
    };

    const handleSettingsClick = () => {
        navigate("/workshop/company");
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-white/10 flex flex-col fixed h-full z-50 overflow-hidden group">
                {/* Decorative background gradient */}
                <div className="absolute top-0 left-0 w-32 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-16 -translate-x-16 pointer-events-none" />

                <div className="p-8">
                    <div className="flex items-center gap-3 px-1">
                        <div className="gradient-primary p-2 rounded-xl shadow-glow rotate-3 group-hover:rotate-0 transition-transform">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-extrabold tracking-tighter italic text-gradient">Pelotão.io</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 relative z-10">
                    {navItems.map((item) => (
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

                <div className="p-6 border-t border-white/10 bg-muted/30 backdrop-blur-sm relative z-10 space-y-6">
                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                        <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2">Status da Operação</p>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-2.5 w-2.5 rounded-full bg-success shadow-glow-sm animate-pulse" />
                                <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-success animate-ping opacity-40" />
                            </div>
                            <span className="text-sm font-bold text-foreground">Oficina Online</span>
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
                        Sair do Painel
                    </Button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-20 bg-background/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 relative">
                    {/* Subtle glow effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />

                    <div className="flex items-center flex-1 max-w-xl">
                        <div className="relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar clientes, bikes, OS..."
                                className="pl-10 h-11 bg-muted/50 border-white/10 focus:bg-background focus:border-primary/50 focus:ring-primary/20 transition-all w-full max-w-md rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground relative hover:bg-white/5 rounded-xl transition-all" onClick={handleNotifications}>
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background shadow-glow-sm" />
                            </Button>
                        </div>

                        <div className="h-8 w-[1px] bg-white/10 mx-1" />

                        <div className="flex items-center gap-4">
                            <Button onClick={handleNovaOS} className="h-11 gradient-primary hover:opacity-90 text-white gap-2 shadow-glow font-bold rounded-xl px-6 transition-all active:scale-95">
                                <Plus className="h-5 w-5" />
                                <span className="hidden sm:inline">Nova OS</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-2xl h-11 w-11 hover:bg-white/5 p-0.5 border border-white/5 shadow-lg">
                                        <Avatar className="h-full w-full rounded-xl">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="gradient-primary text-white font-black uppercase text-xs">
                                                {user?.email?.[0] || 'O'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2 bg-card/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <DropdownMenuLabel className="px-3 pt-3 pb-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black text-foreground">Minha Loja</span>
                                            <span className="text-[10px] text-muted-foreground font-bold truncate uppercase tracking-widest leading-none">{user?.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10 my-2" />
                                    <DropdownMenuItem className="gap-3 h-11 px-3 rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary" onClick={handleProfileClick}>
                                        <div className="p-1.5 rounded-lg bg-muted"><UserCircle className="h-4 w-4" /></div>
                                        <span className="font-bold text-sm">Perfil da Oficina</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-3 h-11 px-3 rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary" onClick={handleSettingsClick}>
                                        <div className="p-1.5 rounded-lg bg-muted"><Settings className="h-4 w-4" /></div>
                                        <span className="font-bold text-sm">Configurações</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 my-2" />
                                    <DropdownMenuItem className="text-destructive gap-3 h-11 px-3 rounded-xl cursor-pointer hover:bg-destructive/10 transition-colors focus:bg-destructive/10" onClick={handleLogout}>
                                        <div className="p-1.5 rounded-lg bg-destructive/10"><LogOut className="h-4 w-4" /></div>
                                        <span className="font-bold text-sm">Encerrar Sessão</span>
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
