import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Bike,
    Activity,
    Wrench,
    MapPin,
    Search,
    ChevronRight,
    Trophy,
    Calendar,
    AlertCircle
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { type BikeType, type ComponentMaintenance, MAINTENANCE_INTERVALS, getComponentHealth, getHealthColor, getHealthLabel, getSuspensionStatus } from "@/utils/maintenance";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BikeData {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    total_mileage: number | null;
    bike_type: BikeType;
    component_maintenance: any;
}

export default function CyclistDashboard() {
    usePageTitle("Dashboard");
    const { user } = useAuth();
    const [bikes, setBikes] = useState<BikeData[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const checkConnection = async () => {
            if (!user) return;
            const { data } = await supabase.from('profiles').select('strava_access_token').eq('id', user.id).single();
            if (data?.strava_access_token) {
                setIsConnected(true);
            }
        };

        const fetchBikes = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('bikes')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error(error);
            } else {
                setBikes((data as any) || []);
            }
            setLoading(false);
        };

        checkConnection();
        fetchBikes();
    }, [user]);

    const stats = [
        { label: "Minhas Bikes", value: bikes.length, icon: Bike, color: "text-blue-500" },
        { label: "Distância Total", value: "0 km", sub: "este mês", icon: Trophy, color: "text-emerald-500" },
        { label: "Atividades", value: "0", sub: "últimos 30 dias", icon: Activity, color: "text-orange-500" },
        { label: "Manutenções", value: "0", sub: "pendentes", icon: Wrench, color: "text-red-500" },
    ];

    const handleConnectStrava = () => {
        const CLIENT_ID = "191168";
        const REDIRECT_URI = `${window.location.origin}/strava-callback`;
        const SCOPE = "read,profile:read_all,activity:read_all";
        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${SCOPE}`;
    };

    const scrollToMap = () => {
        const element = document.getElementById("oficinas-map");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Matheus'}! 🚴
                </h1>
                <p className="text-muted-foreground">Pronto para a sua próxima pedalada?</p>
            </header>

            {/* Integration Banner */}
            {!isConnected && (
                <Card className="gradient-hero border-white/20 overflow-hidden relative shadow-lg border animate-float">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-white shrink-0 shadow-glow">
                                <Activity className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-gradient">Conecte seu Strava</h3>
                                <p className="text-muted-foreground font-medium max-w-md">Sincronize suas atividades e acompanhe o desgaste dos seus componentes automaticamente.</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleConnectStrava}
                            className="bg-primary hover:bg-primary/90 text-white gap-2 shrink-0 h-12 px-8 font-bold shadow-glow hover:scale-105 transition-all duration-300"
                        >
                            Conectar Agora <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                    {/* Decorative gradients */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-secondary/5 rounded-full translate-y-16 pointer-events-none blur-2xl" />
                </Card>
            )}

            {/* Maintenance Alerts */}
            {bikes.some(bike => {
                const comps = ['corrente', 'pastilhas', 'rolamentos', 'rodas'] as const;
                const standardAlert = comps.some(comp => {
                    const health = getComponentHealth(
                        bike.total_mileage || 0,
                        bike.component_maintenance?.[comp] || 0,
                        (MAINTENANCE_INTERVALS[bike.bike_type as BikeType || 'MTB'] as any)[comp]
                    );
                    return health < 20;
                });

                if (standardAlert) return true;

                if (bike.bike_type === 'MTB' || bike.bike_type === 'E-bike') {
                    const susp = getSuspensionStatus(
                        bike.total_mileage || 0,
                        bike.component_maintenance?.suspensao || 0,
                        bike.component_maintenance?.suspensao_count || 0
                    );
                    return susp.health < 20;
                }

                return false;
            }) && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-destructive animate-pulse-slow">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-tight">Alertas de Manutenção</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {bikes.map(bike => {
                                // ... (rest of the logic remains same, just styling)
                                // Fixing standardAlerts variable usage within the map
                                const standardAlerts = (['corrente', 'pastilhas', 'rolamentos', 'rodas'] as const).filter(comp => {
                                    const health = getComponentHealth(
                                        bike.total_mileage || 0,
                                        bike.component_maintenance?.[comp] || 0,
                                        (MAINTENANCE_INTERVALS[bike.bike_type as BikeType || 'MTB'] as any)[comp]
                                    );
                                    return health < 20;
                                }).map(comp => ({
                                    comp,
                                    health: getComponentHealth(
                                        bike.total_mileage || 0,
                                        bike.component_maintenance?.[comp] || 0,
                                        (MAINTENANCE_INTERVALS[bike.bike_type as BikeType || 'MTB'] as any)[comp]
                                    ),
                                    label: comp
                                }));

                                const suspAlert = (bike.bike_type === 'MTB' || bike.bike_type === 'E-bike') ? (() => {
                                    const susp = getSuspensionStatus(
                                        bike.total_mileage || 0,
                                        bike.component_maintenance?.suspensao || 0,
                                        bike.component_maintenance?.suspensao_count || 0
                                    );
                                    return susp.health < 20 ? { comp: 'suspensao', health: susp.health, label: susp.label } : null;
                                })() : null;

                                const allAlerts = [...standardAlerts, ...(suspAlert ? [suspAlert] : [])];
                                if (allAlerts.length === 0) return null;

                                return (
                                    <Alert key={bike.id} variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive-foreground shadow-lg backdrop-blur-sm p-6">
                                        <Wrench className="h-5 w-5" />
                                        <AlertTitle className="font-bold text-lg mb-4">{bike.name} precisa de atenção!</AlertTitle>
                                        <AlertDescription className="space-y-4">
                                            {allAlerts.map(alert => (
                                                <div key={alert.comp} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                                        <span>{alert.label}</span>
                                                        <span>{alert.health.toFixed(0)}% restante</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-destructive/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-destructive transition-all duration-1000" style={{ width: `${alert.health}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 w-full border-destructive/20 text-destructive hover:bg-destructive/10 font-bold"
                                                onClick={() => navigate('/dashboard/bikes')}
                                            >
                                                Agendar Manutenção Agora
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 gradient-card group">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                                <div className={`p-2 rounded-lg bg-background/50 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold tracking-tight">{stat.value}</div>
                            {stat.sub && (
                                <p className="text-xs font-semibold text-muted-foreground mt-2 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-primary/40 block" />
                                    {stat.sub}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* My Bikes Section */}
                <Card className="lg:col-span-2 border-white/10 shadow-lg overflow-hidden">
                    <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/10">
                        <CardTitle className="text-2xl font-extra-bold tracking-tight">Minhas Bikes</CardTitle>
                        <Button variant="outline" size="sm" className="gap-2 font-bold backdrop-blur-sm border-white/20 hover:bg-white/10" onClick={() => navigate("/dashboard/bikes")}>
                            <Bike className="h-4 w-4" /> Adicionar bike
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-8">
                        {bikes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                                <div className="h-24 w-24 rounded-3xl gradient-hero flex items-center justify-center shadow-inner animate-float">
                                    <Bike className="h-12 w-12 text-primary/40" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold">Nenhuma bike cadastrada</p>
                                    <p className="text-muted-foreground max-w-xs mx-auto">Cadastre suas bicicletas agora para um controle preciso de manutenção.</p>
                                </div>
                                <Button className="shadow-glow h-11 px-8 font-bold" onClick={() => navigate("/dashboard/bikes")}>Adicionar bike agora</Button>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2">
                                {bikes.map((bike) => (
                                    <Card key={bike.id} className="bg-muted/20 border-white/10 shadow-sm hover:shadow-md hover:bg-muted/30 transition-all duration-300 cursor-pointer group">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{bike.name}</h3>
                                                    <p className="text-sm font-medium text-muted-foreground">{bike.brand} {bike.model}</p>
                                                </div>
                                                <div className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center">
                                                    <Bike className="h-6 w-6 text-primary/70" />
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center gap-3 text-sm font-bold bg-background/30 p-2 rounded-lg w-fit">
                                                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                                <span>{((bike.total_mileage || 0) / 1000).toFixed(0)} km rodados</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-white/10 shadow-lg h-full overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4 border-b border-white/10">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-primary" /> Alertas Rápidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="p-5 rounded-2xl gradient-hero text-foreground space-y-3 border border-white/20 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                    <Trophy className="h-12 w-12" />
                                </div>
                                <div className="flex items-center gap-2 font-bold text-primary">
                                    <Trophy className="h-5 w-5" />
                                    Tudo em dia!
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    Suas bikes estão com a manutenção em dia. Conecte com o Strava para monitorar o desgaste em tempo real.
                                </p>
                            </div>

                            <Card className="border-dashed border-2 border-white/20 bg-muted/10 shadow-none rounded-2xl hover:bg-muted/20 transition-all duration-300">
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className="h-14 w-14 bg-background rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                        <Calendar className="h-8 w-8 text-primary/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold">Agendar Revisão</p>
                                        <p className="text-xs text-muted-foreground">Encontre oficinas certificadas</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2 font-bold backdrop-blur-sm border-white/10" onClick={scrollToMap}>
                                        <Search className="h-4 w-4" /> Buscar Oficinas
                                    </Button>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
