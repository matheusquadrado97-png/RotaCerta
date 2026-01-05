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

    useEffect(() => {
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
            <Card className="bg-emerald-50 border-emerald-100 overflow-hidden relative border-none shadow-sm">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-emerald-900">Conecte seu Strava</h3>
                            <p className="text-emerald-700">Sincronize suas atividades e acompanhe o desgaste dos seus componentes automaticamente.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleConnectStrava}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
                    >
                        Conectar Agora <ChevronRight className="h-4 w-4" />
                    </Button>
                </CardContent>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
            </Card>

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
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <h2 className="text-xl font-bold">Alertas de Manutenção</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {bikes.map(bike => {
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
                                    <Alert key={bike.id} variant="destructive" className="bg-red-50 border-red-100 text-red-900">
                                        <Wrench className="h-4 w-4" />
                                        <AlertTitle className="font-bold">{bike.name} precisa de atenção!</AlertTitle>
                                        <AlertDescription className="mt-2 space-y-2">
                                            {allAlerts.map(alert => {
                                                return (
                                                    <div key={alert.comp} className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs font-semibold">
                                                            <span className="capitalize">{alert.label}</span>
                                                            <span>{alert.health.toFixed(0)}% de vida útil</span>
                                                        </div>
                                                        <Progress value={alert.health} className="h-1 bg-red-200" />
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 w-full border-red-200 text-red-700 hover:bg-red-100"
                                                onClick={() => navigate('/dashboard/bikes')}
                                            >
                                                Ver Detalhes na Oficina
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            {stat.sub && (
                                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* My Bikes Section */}
                <Card className="lg:col-span-2 border-none shadow-sm">
                    <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-xl font-bold">Minhas Bikes</CardTitle>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/bikes")}>
                            <Bike className="h-4 w-4" /> Adicionar bike
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {bikes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                                    <Bike className="h-10 w-10 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">Nenhuma bike cadastrada ainda</p>
                                    <p className="text-sm text-gray-500">Cadastre suas bicicletas para controlar as manutenções.</p>
                                </div>
                                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/dashboard/bikes")}>Adicionar bike</Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {bikes.map((bike) => (
                                    <Card key={bike.id} className="bg-gray-50/50 border-none shadow-none hover:bg-gray-50 transition-colors">
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-lg">{bike.name}</h3>
                                            <p className="text-sm text-muted-foreground">{bike.brand} {bike.model}</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-emerald-500" />
                                                <span>{((bike.total_mileage || 0) / 1000).toFixed(0)} km rodados</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Maintenance Alerts Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-emerald-500" /> Alertas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 space-y-2 border border-emerald-100">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Trophy className="h-4 w-4 text-emerald-500" />
                                    Tudo em dia!
                                </div>
                                <p className="text-sm">
                                    Suas bikes estão com a manutenção em dia. Conecte com o Strava para monitorar o desgaste em tempo real.
                                </p>
                            </div>

                            <Card className="border-dashed border-2 bg-transparent shadow-none">
                                <CardContent className="p-4 text-center space-y-3">
                                    <Calendar className="h-8 w-8 text-gray-300 mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Agendar Revisão</p>
                                        <p className="text-xs text-muted-foreground">Encontre uma oficina próxima</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={scrollToMap}>
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
