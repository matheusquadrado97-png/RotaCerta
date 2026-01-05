import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Calendar as CalendarIcon,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    PauseCircle,
    Wrench,
    Bike as BikeIcon,
    Navigation,
    History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

type AppointmentStatus =
    | "pending"
    | "scheduled"
    | "confirmed"
    | "received"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "paused"
    | "cancelled";

interface Appointment {
    id: string;
    scheduled_at: string;
    start_time: string;
    status: AppointmentStatus;
    workshop: {
        name: string;
        city: string;
        neighborhood: string;
    };
    service: {
        name: string;
        price: number;
    };
    bike: {
        name: string;
        brand: string | null;
        model: string | null;
    };
}

export default function Maintenance() {
    usePageTitle("Minhas Manutenções");
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    scheduled_at,
                    start_time,
                    status,
                    workshop:workshops(name, city, neighborhood),
                    service:services(name, price),
                    bike:bikes(name, brand, model)
                `)
                .eq('cyclist_id', user.id)
                .order('scheduled_at', { ascending: false });

            if (error) {
                console.error("Error fetching appointments:", error);
                toast.error("Erro ao carregar seu histórico de manutenções.");
            } else {
                // @ts-ignore - Supabase join typing can be tricky
                setAppointments(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const getStatusConfig = (status: AppointmentStatus) => {
        switch (status) {
            case 'pending':
            case 'scheduled':
                return { label: 'Agendada', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: CalendarIcon };
            case 'confirmed':
            case 'received':
                return { label: 'Confirmada', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Package };
            case 'in_progress':
                return { label: 'Em andamento', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock };
            case 'awaiting_parts':
                return { label: 'Aguardando peças', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: AlertCircle };
            case 'completed':
                return { label: 'Finalizada', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 };
            case 'paused':
                return { label: 'Pausada', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: PauseCircle };
            case 'cancelled':
                return { label: 'Cancelada', color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle };
            default:
                return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Clock };
        }
    };

    const nextMaintenance = appointments.find(a => ['pending', 'scheduled', 'confirmed', 'received', 'in_progress', 'awaiting_parts'].includes(a.status));
    const pastMaintenances = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header>
                <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-6 w-6 text-emerald-500" />
                    <h1 className="text-3xl font-bold tracking-tight">Manutenções</h1>
                </div>
                <p className="text-muted-foreground">Acompanhe seus agendamentos e o histórico da sua bike.</p>
            </header>

            {loading ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
            ) : appointments.length === 0 ? (
                <Card className="border-dashed border-2 py-20 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <CalendarIcon className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Nenhuma manutenção encontrada</h3>
                        <p className="text-slate-500 max-w-[300px] mt-1 mb-6">
                            Você ainda não realizou agendamentos pelo Rota Certa.
                        </p>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">Explorar Oficinas</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8">
                    {/* Active Appointments */}
                    {nextMaintenance && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-emerald-500" /> Próxima Manutenção
                            </h2>
                            <Card className="border-l-4 border-l-emerald-500 shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="p-6 md:w-48 bg-emerald-50/30 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100">
                                            <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                                                {format(new Date(nextMaintenance.scheduled_at), "EEE", { locale: ptBR })}
                                            </div>
                                            <div className="text-3xl font-black text-slate-900">
                                                {format(new Date(nextMaintenance.scheduled_at), "dd/MM")}
                                            </div>
                                            <div className="text-sm font-semibold text-slate-500 mt-1">
                                                às {format(new Date(nextMaintenance.scheduled_at), "HH:mm")}
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-slate-900">{nextMaintenance.service.name}</h3>
                                                        <Badge className={getStatusConfig(nextMaintenance.status).color}>
                                                            {getStatusConfig(nextMaintenance.status).label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Navigation className="h-4 w-4" />
                                                        <span className="font-semibold">{nextMaintenance.workshop.name}</span>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="text-sm">{nextMaintenance.workshop.neighborhood}, {nextMaintenance.workshop.city}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                        <BikeIcon className="h-4 w-4 text-emerald-500" />
                                                        <span className="font-bold text-slate-700">{nextMaintenance.bike.name}</span>
                                                        <span className="text-slate-500 font-medium">{nextMaintenance.bike.brand} {nextMaintenance.bike.model}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Valor Estimado</div>
                                                <div className="text-2xl font-black text-emerald-600">
                                                    R$ {nextMaintenance.service.price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    {/* History */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <History className="h-5 w-5 text-slate-400" /> Histórico de Serviços
                        </h2>
                        <div className="grid gap-4">
                            {appointments.filter(a => a.id !== nextMaintenance?.id).map((apt) => {
                                const config = getStatusConfig(apt.status);
                                return (
                                    <Card key={apt.id} className="group hover:border-slate-300 transition-all">
                                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                                                    <span className="text-[10px] font-bold uppercase">{format(new Date(apt.scheduled_at), "MMM", { locale: ptBR })}</span>
                                                    <span className="text-lg font-black leading-none">{format(new Date(apt.scheduled_at), "dd")}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900">{apt.service.name}</h4>
                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-slate-200 bg-slate-50 ${config.color}`}>
                                                            {config.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        Na <span className="font-bold text-slate-700">{apt.workshop.name}</span> • {apt.bike.name} • {format(new Date(apt.scheduled_at), "HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                                                    <div className="font-bold text-slate-900">R$ {apt.service.price.toFixed(2)}</div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
