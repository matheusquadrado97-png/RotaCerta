import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Loader2,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    PauseCircle,
    Package,
    ArrowUpRight,
    User,
    ChevronRight,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppointmentStatus =
    | "scheduled"
    | "received"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "paused"
    | "cancelled"
    | "pending"
    | "confirmed";

export default function WorkshopDashboard() {
    usePageTitle("Painel da Oficina");
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [workshop, setWorkshop] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [todayCount, setTodayCount] = useState(0);
    const [timeFilter, setTimeFilter] = useState<"today" | "late" | "all">("today");
    const [statusCounts, setStatusCounts] = useState<Record<AppointmentStatus, number>>({
        scheduled: 0,
        received: 0,
        in_progress: 0,
        awaiting_parts: 0,
        completed: 0,
        paused: 0,
        cancelled: 0,
        pending: 0,
        confirmed: 0
    });

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch workshop
            const { data: ws, error: wsError } = await supabase
                .from('workshops')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (wsError) throw wsError;

            let currentWorkshop = ws;

            // Auto-init workshop if missing
            if (!ws) {
                const { data: newWs, error: createWsError } = await supabase
                    .from('workshops')
                    .insert({
                        owner_id: user.id,
                        name: "Minha Oficina",
                        address: "Endereço não informado"
                    })
                    .select()
                    .single();

                if (createWsError) throw createWsError;
                currentWorkshop = newWs;
                setWorkshop(newWs);
            } else {
                setWorkshop(ws);
            }

            // Fetch settings
            const { data: st, error: stError } = await supabase
                .from('workshop_settings')
                .select('*')
                .eq('workshop_id', currentWorkshop.id)
                .maybeSingle();

            if (stError) throw stError;

            if (!st) {
                const { data: newSt, error: createStError } = await supabase
                    .from('workshop_settings')
                    .insert({ workshop_id: currentWorkshop.id, is_visible: false })
                    .select()
                    .single();
                if (createStError) throw createStError;
                setSettings(newSt);
            } else {
                setSettings(st);
            }

            // Fetch services
            const { data: svs } = await supabase
                .from('services')
                .select('*')
                .eq('workshop_id', currentWorkshop.id);
            setServices(svs || []);

            // Fetch staff
            const { data: stf } = await supabase
                .from('workshop_staff')
                .select('*')
                .eq('workshop_id', currentWorkshop.id);
            setStaff(stf || []);

            // Fetch appointments for counts
            const { data: apts } = await supabase
                .from('appointments')
                .select('status, scheduled_at')
                .eq('workshop_id', currentWorkshop.id);

            if (apts) {
                const counts: Record<AppointmentStatus, number> = {
                    scheduled: 0, received: 0, in_progress: 0, awaiting_parts: 0,
                    completed: 0, paused: 0, cancelled: 0, pending: 0, confirmed: 0
                };
                let tCount = 0;
                const today = new Date().toISOString().split('T')[0];

                apts.forEach(a => {
                    if (a.status) counts[a.status as AppointmentStatus]++;
                    if (a.scheduled_at && a.scheduled_at.startsWith(today)) {
                        tCount++;
                    }
                });
                setStatusCounts(counts);
                setTodayCount(tCount);
            }

            // Fetch recent activity (latest 5 appointments)
            const { data: recent } = await supabase
                .from('appointments')
                .select(`
                    id,
                    status,
                    created_at,
                    scheduled_at,
                    cyclist:profiles(full_name),
                    service:services(name)
                `)
                .eq('workshop_id', currentWorkshop.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentActivity(recent || []);

        } catch (err: any) {
            console.error("Dashboard data load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleToggleVisibility = async () => {
        if (!workshop) return;

        const newVisibility = !settings?.is_visible;
        try {
            const { error } = await supabase
                .from('workshop_settings')
                .upsert({
                    workshop_id: workshop.id,
                    is_visible: newVisibility
                });

            if (error) throw error;

            setSettings({ ...settings, is_visible: newVisibility });
            toast.success(newVisibility ? "Oficina agora está visível!" : "Oficina ocultada com sucesso.");
        } catch (err: any) {
            toast.error("Erro ao alterar visibilidade: " + err.message);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'scheduled':
            case 'pending':
                return { label: 'Agendada', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Calendar };
            case 'received':
            case 'confirmed':
                return { label: 'Recebida', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Package };
            case 'in_progress':
                return { label: 'Em andamento', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock };
            case 'awaiting_parts':
                return { label: 'Aguardando peças', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: AlertCircle };
            case 'completed':
                return { label: 'Finalizada', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 };
            case 'paused':
                return { label: 'Pausada', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: PauseCircle };
            default:
                return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Clock };
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const isOffboarded = !settings?.is_visible;
    const missingItems = [
        { label: "Cadastrar ao menos um serviço", done: services.length > 0 },
        { label: "Configurar endereço", done: !!workshop?.address },
        { label: "Adicionar usuários com permissão", done: staff.length > 0 },
    ];

    const stats = [
        { label: "Agendadas", value: statusCounts.scheduled + statusCounts.pending, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Recebidas", value: statusCounts.received + statusCounts.confirmed, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Em andamento", value: statusCounts.in_progress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Aguardando peças", value: statusCounts.awaiting_parts, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Finalizadas", value: statusCounts.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Pausadas", value: statusCounts.paused, icon: PauseCircle, color: "text-slate-600", bg: "bg-slate-50" },
    ];

    const maxDaily = settings?.max_daily_os || 10;
    const capacityPercentage = Math.min(Math.round((todayCount / maxDaily) * 100), 100);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Olá, {workshop?.name || "Oficina"}!</h1>
                    <p className="text-slate-500 mt-1">Aqui está o que está acontecendo na sua oficina hoje.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${timeFilter === 'today' ? 'bg-slate-100 font-semibold' : 'text-slate-500'}`}
                        onClick={() => setTimeFilter('today')}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${timeFilter === 'late' ? 'bg-slate-100 font-semibold' : 'text-slate-500'}`}
                        onClick={() => setTimeFilter('late')}
                    >
                        Atrasadas
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${timeFilter === 'all' ? 'bg-slate-100 font-semibold' : 'text-slate-500'}`}
                        onClick={() => setTimeFilter('all')}
                    >
                        Todas
                    </Button>
                </div>
            </div>

            {/* Onboarding Alert */}
            {isOffboarded && (missingItems.some(i => !i.done)) && (
                <Card className="border-emerald-100 bg-emerald-50/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ArrowUpRight className="h-24 w-24 text-emerald-600" />
                    </div>
                    <CardHeader>
                        <div className="flex items-center gap-2 text-emerald-800 mb-1">
                            <AlertCircle className="h-5 w-5 fill-emerald-100" />
                            <CardTitle className="text-lg">Sua oficina ainda não está visível para os ciclistas</CardTitle>
                        </div>
                        <CardDescription className="text-emerald-700/80">
                            Para ativar a visibilidade e começar a receber agendamentos via Rota Certa, complete os itens abaixo:
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {missingItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-emerald-100/50 shadow-sm">
                                    {item.done ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    ) : (
                                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
                                    )}
                                    <span className={`text-sm font-medium ${item.done ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex-1">
                                <div className="flex justify-between text-xs font-semibold text-emerald-800 mb-1.5 uppercase tracking-wider">
                                    <span>Progresso do Perfil</span>
                                    <span>{Math.round((missingItems.filter(i => i.done).length / missingItems.length) * 100)}%</span>
                                </div>
                                <Progress value={(missingItems.filter(i => i.done).length / missingItems.length) * 100} className="h-2 bg-emerald-100" />
                            </div>
                            <Button
                                onClick={handleToggleVisibility}
                                disabled={missingItems.some(i => !i.done)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                            >
                                Ativar Visibilidade
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* OS Counters Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="group hover:border-emerald-200 transition-all cursor-pointer hover:shadow-md active:scale-95 duration-200" onClick={() => navigate('/workshop/appointments')}>
                        <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-center justify-between">
                            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none group-hover:bg-emerald-50 group-hover:text-emerald-600">
                                Ver
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Atividade Recente</CardTitle>
                            <CardDescription>Ultimas atualizações de ordens de serviço.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => navigate('/workshop/appointments')}>Ver tudo</Button>
                    </CardHeader>
                    <CardContent className={recentActivity.length === 0 ? "h-[300px] flex flex-col items-center justify-center text-center" : "p-0"}>
                        {recentActivity.length === 0 ? (
                            <>
                                <div className="bg-slate-50 p-4 rounded-full mb-4">
                                    <Package className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Nenhuma atividade registrada hoje.</p>
                                <p className="text-xs text-slate-400 mt-1">As OS aparecerão aqui conforme forem atualizadas.</p>
                            </>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentActivity.map((act) => {
                                    const config = getStatusConfig(act.status);
                                    return (
                                        <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate('/workshop/appointments')}>
                                            <div className="flex items-center gap-4">
                                                <div className={`${config.bg} ${config.color} p-2.5 rounded-full`}>
                                                    <config.icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{act.service?.name || "Serviço"}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <User className="h-3 w-3" /> {act.cyclist?.full_name}
                                                        </span>
                                                        <span className="text-xs text-slate-300">•</span>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={`${config.color} border shadow-none bg-transparent font-semibold`}>
                                                    {config.label}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Capacidade Diária</CardTitle>
                        <CardDescription>Ocupação atual da oficina.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center py-4">
                            <div className="text-3xl font-bold text-slate-900">{todayCount} / {maxDaily}</div>
                            <p className="text-sm text-slate-500 font-medium">Slots ocupados hoje</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Utilização</span>
                                <span>{capacityPercentage}%</span>
                            </div>
                            <Progress value={capacityPercentage} className={`h-2 ${capacityPercentage > 90 ? 'bg-red-100' : 'bg-emerald-100'}`} />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                Você pode alterar sua capacidade máxima nas configurações da empresa.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
