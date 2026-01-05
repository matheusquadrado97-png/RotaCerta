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
                return { label: 'Agendada', color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar };
            case 'received':
            case 'confirmed':
                return { label: 'Recebida', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Package };
            case 'in_progress':
                return { label: 'Em andamento', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
            case 'awaiting_parts':
                return { label: 'Aguardando peças', color: 'text-purple-600', bg: 'bg-purple-50', icon: AlertCircle };
            case 'completed':
                return { label: 'Finalizada', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
            case 'paused':
                return { label: 'Pausada', color: 'text-slate-600', bg: 'bg-slate-50', icon: PauseCircle };
            default:
                return { label: status, color: 'text-slate-600', bg: 'bg-slate-50', icon: Clock };
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
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Olâ, <span className="text-gradient">{workshop?.name || "Oficina"}</span>!</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Aqui està o que està acontecendo na sua oficina hoje.</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-xl px-5 h-9 font-bold transition-all ${timeFilter === 'today' ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                        onClick={() => setTimeFilter('today')}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-xl px-5 h-9 font-bold transition-all ${timeFilter === 'late' ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                        onClick={() => setTimeFilter('late')}
                    >
                        Atrasadas
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-xl px-5 h-9 font-bold transition-all ${timeFilter === 'all' ? 'bg-primary text-white shadow-glow' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
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
                            Para ativar a visibilidade e começar a receber agendamentos via Pelotão.io, complete os itens abaixo:
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="group hover:border-primary/30 transition-all cursor-pointer hover:shadow-2xl active:scale-95 duration-300 rounded-3xl bg-card/40 backdrop-blur-xl border-white/10 overflow-hidden relative" onClick={() => navigate('/workshop/appointments')}>
                        <div className="absolute top-0 right-0 w-20 h-20 gradient-primary opacity-0 group-hover:opacity-10 blur-2xl transition-opacity pointer-events-none" />
                        <CardHeader className="p-5 pb-2 space-y-0 flex flex-row items-center justify-between">
                            <div className={`p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-glow-sm ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-white/5 group-hover:bg-primary/20 group-hover:text-primary font-bold px-3 py-1 rounded-full transition-colors">
                                Ver
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="text-3xl font-black text-foreground mt-2">{stat.value}</div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2 rounded-3xl bg-card border-white/10 shadow-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 px-8 py-6">
                        <div>
                            <CardTitle className="text-xl font-black">Atividade Recente</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground">Ultimas atualizações de ordens de serviço.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-xl px-4" onClick={() => navigate('/workshop/appointments')}>Ver tudo</Button>
                    </CardHeader>
                    <CardContent className={recentActivity.length === 0 ? "h-[350px] flex flex-col items-center justify-center text-center p-8" : "p-0"}>
                        {recentActivity.length === 0 ? (
                            <>
                                <div className="gradient-primary p-6 rounded-3xl mb-6 shadow-glow rotate-6 animate-float">
                                    <Package className="h-10 w-10 text-white" />
                                </div>
                                <p className="text-foreground font-black text-lg">Nenhuma atividade hoje</p>
                                <p className="text-sm text-muted-foreground mt-2 font-medium max-w-[250px]">As OS aparecerão aqui conforme forem atualizadas.</p>
                            </>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {recentActivity.map((act) => {
                                    const config = getStatusConfig(act.status);
                                    return (
                                        <div key={act.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate('/workshop/appointments')}>
                                            <div className="flex items-center gap-5">
                                                <div className={`${config.bg} ${config.color} p-3 rounded-2xl shadow-glow-sm group-hover:scale-110 transition-transform duration-300`}>
                                                    <config.icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground text-base group-hover:text-primary transition-colors">{act.service?.name || "Serviço"}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 font-medium">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5" /> {act.cyclist?.full_name}
                                                        </span>
                                                        <span className="text-xs text-white/10">•</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${config.color} border-white/5 shadow-glow-sm bg-background/50 backdrop-blur-sm font-black px-4 py-1.5 rounded-full`}>
                                                    {config.label}
                                                </Badge>
                                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/20 transition-all">
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="rounded-3xl bg-card border-white/10 shadow-xl overflow-hidden relative group">
                        <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
                        <CardHeader className="px-8 py-6 border-b border-white/5">
                            <CardTitle className="text-xl font-black">Capacidade Diária</CardTitle>
                            <CardDescription className="font-medium">Ocupação atual da oficina.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 py-8 space-y-8">
                            <div className="text-center relative py-4">
                                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 pointer-events-none" />
                                <div className="text-5xl font-black text-foreground relative tracking-tighter">
                                    {todayCount} <span className="text-muted-foreground/30 font-light">/</span> {maxDaily}
                                </div>
                                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-2">Slots ocupados hoje</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Utilização</span>
                                    <span className={capacityPercentage > 90 ? 'text-destructive' : 'text-primary'}>{capacityPercentage}%</span>
                                </div>
                                <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 shadow-glow-sm ${capacityPercentage > 90 ? 'bg-destructive' : 'gradient-primary'}`}
                                        style={{ width: `${capacityPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex gap-4 backdrop-blur-sm group-hover:bg-primary/10 transition-colors">
                                <AlertCircle className="h-6 w-6 text-primary shrink-0" />
                                <p className="text-xs text-foreground/80 leading-relaxed font-bold italic">
                                    Você pode alterar sua capacidade máxima nas configurações da empresa.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
