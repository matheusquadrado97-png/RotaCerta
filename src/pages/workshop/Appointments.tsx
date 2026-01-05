import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar as CalendarIcon,
    Package,
    AlertCircle,
    PauseCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Plus,
    User,
    Bike,
    MoreHorizontal,
    Check,
    ShoppingCart,
    PlusCircle,
    MinusCircle,
    Trash,
    Mail,
    Phone,
    Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Input } from "@/components/ui/input";
import AddClientDialog from "@/components/workshop/AddClientDialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type AppointmentStatus =
    | "all"
    | "scheduled"
    | "received"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "paused"
    | "cancelled"
    | "pending"
    | "confirmed";

interface Appointment {
    id: string;
    status: AppointmentStatus;
    scheduled_at: string;
    cyclist: {
        full_name: string;
        email: string;
    };
    service: {
        name: string;
        price: number;
        duration_minutes: number;
    };
    bike: {
        id: string;
        name: string;
    } | null;
    notes: string | null;
    equipment_details: string | null;
    items?: {
        id: string;
        product_id: string;
        product: {
            name: string;
            price: number;
        };
        quantity: number;
        unit_price: number;
        total_price: number;
    }[];
}

export default function WorkshopAppointments() {
    usePageTitle("Agenda");
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"list" | "calendar">("list");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus>("all");

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setIsDialogOpen(true);
            // Clean up the URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('new');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams]);

    // Novo Agendamento State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchCyclist, setSearchCyclist] = useState("");
    const [cyclists, setCyclists] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [selectedCyclist, setSelectedCyclist] = useState<any>(null);
    const [selectedService, setSelectedService] = useState<string>("");
    const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [scheduledTime, setScheduledTime] = useState("14:00");
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);

    // Edit OS State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<Appointment | null>(null);
    const [editNotes, setEditNotes] = useState("");
    const [editEquipment, setEditEquipment] = useState("");
    const [editBikeId, setEditBikeId] = useState<string>("");

    // Shared State for bikes
    const [cyclistBikes, setCyclistBikes] = useState<any[]>([]);
    const [selectedBikeId, setSelectedBikeId] = useState<string>("");

    // Products and Items State
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [osItems, setOsItems] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    const fetchAppointments = async () => {
        if (!user) return;
        setLoading(true);

        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!workshop) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                status,
                scheduled_at,
                cyclist:profiles(full_name, email),
                service:services(name, price, duration_minutes),
                bike:bikes(id, name),
                notes,
                equipment_details,
                items:appointment_items(
                    id,
                    quantity,
                    unit_price,
                    total_price,
                    product_id,
                    product:products(name, price)
                )
            `)
            .eq('workshop_id', workshop.id)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error(error);
            toast.error("Erro ao carregar agendamentos");
        } else {
            // @ts-ignore
            setAppointments(data || []);
        }
        setLoading(false);
    };

    const fetchServices = async () => {
        if (!user) return;
        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (workshop) {
            const { data } = await supabase
                .from('services')
                .select('*')
                .eq('workshop_id', workshop.id);
            setServices(data || []);
        }
    };

    const fetchWorkshopProducts = async () => {
        if (!user) return;
        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (workshop) {
            const { data } = await supabase
                .from('products' as any)
                .select('*')
                .eq('workshop_id', workshop.id);
            setAllProducts(data || []);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchServices();
        fetchWorkshopProducts();
    }, [user]);

    // Cyclist Search Logic
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (searchCyclist.length < 2) {
                setCyclists([]);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, cpf, phone')
                .or(`full_name.ilike.%${searchCyclist}%,email.ilike.%${searchCyclist}%,cpf.ilike.%${searchCyclist}%,phone.ilike.%${searchCyclist}%`)
                .limit(5);

            setCyclists(data || []);
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchCyclist]);

    const fetchCyclistBikes = async (cyclistId: string) => {
        const { data } = await supabase
            .from('bikes')
            .select('id, name, brand, model')
            .eq('user_id', cyclistId);
        setCyclistBikes(data || []);
    };

    useEffect(() => {
        if (selectedCyclist) {
            fetchCyclistBikes(selectedCyclist.id);
        } else {
            setCyclistBikes([]);
            setSelectedBikeId("");
        }
    }, [selectedCyclist]);

    const handleCreateAppointment = async () => {
        if (!selectedCyclist || !selectedService || !scheduledDate || !scheduledTime) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsSaving(true);
        try {
            const { data: workshop } = await supabase
                .from('workshops')
                .select('id')
                .eq('owner_id', user?.id)
                .single();

            if (!workshop) throw new Error("Oficina não encontrada");

            const scheduled_at = `${scheduledDate}T${scheduledTime}:00-03:00`;
            const start_time = `${scheduledDate}T${scheduledTime}:00-03:00`;

            // Calculate end time (default 1 hour later)
            const hour = parseInt(scheduledTime.split(':')[0]);
            const nextHour = (hour + 1).toString().padStart(2, '0');
            const end_time = `${scheduledDate}T${nextHour}:${scheduledTime.split(':')[1]}:00-03:00`;

            const { error } = await supabase
                .from('appointments')
                .insert({
                    workshop_id: workshop.id,
                    cyclist_id: selectedCyclist.id,
                    service_id: selectedService,
                    bike_id: selectedBikeId || null,
                    scheduled_at,
                    start_time,
                    end_time,
                    status: 'scheduled'
                });

            if (error) throw error;

            toast.success("Agendamento criado com sucesso!");
            handleCloseDialog();
            fetchAppointments();
        } catch (err: any) {
            toast.error("Erro ao criar agendamento: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedCyclist(null);
        setSelectedService("");
        setSelectedBikeId("");
        setCyclistBikes([]);
        setSearchCyclist("");
        setScheduledDate(format(new Date(), "yyyy-MM-dd"));
        setScheduledTime("14:00");
    };

    const handleOpenEdit = async (apt: Appointment) => {
        setEditingApt(apt);
        setEditNotes(apt.notes || "");
        setEditEquipment(apt.equipment_details || "");

        // Fetch bikes for the cyclist of this appointment
        // We need the cyclist ID which is not directly in Appointment interface yet but we can get it from the appointment record
        const { data: aptData } = await supabase
            .from('appointments')
            .select('cyclist_id, bike_id')
            .eq('id', apt.id)
            .single();

        if (aptData) {
            await fetchCyclistBikes(aptData.cyclist_id);
            setEditBikeId(aptData.bike_id || "");
        }

        // Load current items
        setOsItems(apt.items?.map(i => ({
            id: i.id,
            product_id: i.product_id,
            name: i.product?.name || "Item não identificado",
            quantity: i.quantity,
            unit_price: i.unit_price || 0,
            total_price: i.total_price || 0
        })) || []);

        setIsEditOpen(true);
    };

    const handleAddItem = (productId: string) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const existing = osItems.find(item => item.product_id === productId);
        if (existing) {
            setOsItems(osItems.map(item =>
                item.product_id === productId
                    ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
                    : item
            ));
        } else {
            setOsItems([...osItems, {
                product_id: product.id,
                name: product.name,
                quantity: 1,
                unit_price: product.price,
                total_price: product.price
            }]);
        }
        setSelectedProductId("");
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setOsItems(osItems.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, total_price: newQty * item.unit_price };
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setOsItems(osItems.filter(item => item.product_id !== productId));
    };

    const handleSaveEdit = async () => {
        if (!editingApt) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({
                    notes: editNotes,
                    equipment_details: editEquipment,
                    bike_id: editBikeId === 'none' ? null : (editBikeId || null)
                })
                .eq('id', editingApt.id);

            if (error) throw error;

            // Save Items: Simple approach - delete existing and insert new
            await supabase
                .from('appointment_items' as any)
                .delete()
                .eq('appointment_id', editingApt.id);

            if (osItems.length > 0) {
                const { error: itemError } = await supabase
                    .from('appointment_items' as any)
                    .insert(osItems.map(item => ({
                        appointment_id: editingApt.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.total_price
                    })));
                if (itemError) throw itemError;
            }

            toast.success("OS atualizada com sucesso!");
            setIsEditOpen(false);
            fetchAppointments();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const updateStatus = async (id: string, newStatus: Exclude<AppointmentStatus, 'all'>) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus as any })
                .eq('id', id);

            if (error) throw error;
            toast.success("Status atualizado com sucesso!");
            fetchAppointments();
        } catch (error: any) {
            toast.error("Erro ao atualizar status");
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'scheduled':
            case 'pending':
                return { label: 'Agendada', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: CalendarIcon };
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
            case 'cancelled':
                return { label: 'Cancelada', color: 'text-red-600 bg-red-50 border-red-100', icon: XCircle };
            default:
                return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100', icon: Clock };
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        const formattedDate = format(aptDate, "dd/MM/yyyy");

        const matchesSearch =
            apt.cyclist?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.bike?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formattedDate.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda da Oficina</h1>
                    <p className="text-slate-500 mt-1">Gerencie os horários e o fluxo de trabalho.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${view === 'list' ? 'bg-slate-100 font-semibold' : 'text-slate-500'}`}
                            onClick={() => setView('list')}
                        >
                            Lista
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${view === 'calendar' ? 'bg-slate-100 font-semibold' : 'text-slate-500'}`}
                            onClick={() => setView('calendar')}
                        >
                            Calendário
                        </Button>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200">
                        <Plus className="h-4 w-4" /> Novo Agendamento
                    </Button>
                </div>
            </div>

            {/* List View Controls */}
            {view === 'list' && (
                <div className="grid gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Filtrar por nome, bike ou serviço..."
                                className="pl-10 h-10 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={`gap-2 ${statusFilter !== 'all' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-600'}`}>
                                        <Filter className="h-4 w-4" />
                                        {statusFilter === 'all' ? 'Filtros' : getStatusConfig(statusFilter).label}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('scheduled')}>Agendadas</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>Em andamento</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('awaiting_parts')}>Aguardando Peças</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Finalizadas</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter('paused')}>Pausadas</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 border-l pl-4 ml-2 border-slate-200">
                                <span>Mostrando: {filteredAppointments.length}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <Card className="border-dashed border-2 py-20 bg-slate-50/50">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <CalendarIcon className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 text-pretty">Nenhum agendamento encontrado</h3>
                                <p className="text-slate-500 max-w-[300px] mt-1">
                                    Ajuste os filtros ou o termo de busca para encontrar o que procura.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((apt) => {
                                const config = getStatusConfig(apt.status);
                                return (
                                    <Card key={apt.id} className="group hover:border-emerald-200 transition-all hover:shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: 'rgb(16, 185, 129)' }}>
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row md:items-center">
                                                {/* Date/Time Block */}
                                                <div className="p-4 md:w-48 bg-slate-50 group-hover:bg-emerald-50/30 transition-colors flex flex-row md:flex-col items-center justify-between md:justify-center text-center gap-1 border-b md:border-b-0 md:border-r border-slate-100">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        {format(new Date(apt.scheduled_at), "EEE", { locale: ptBR })}
                                                    </div>
                                                    <div className="text-2xl font-black text-slate-900">
                                                        {format(new Date(apt.scheduled_at), "dd/MM")}
                                                    </div>
                                                    <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        {format(new Date(apt.scheduled_at), "HH:mm")}
                                                    </div>
                                                </div>

                                                {/* Main Info */}
                                                <div className="p-6 flex-1 grid gap-4 md:grid-cols-3 md:items-center">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-slate-900 text-lg">{apt.service?.name || "Serviço"}</h3>
                                                            <Badge className={`font-semibold border ${config.color}`}>
                                                                <config.icon className="h-3 w-3 mr-1" />
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                <User className="h-3.5 w-3.5" /> {apt.cyclist?.full_name}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                <Bike className="h-3.5 w-3.5" /> {apt.bike?.name || "Não definida"}
                                                            </div>
                                                        </div>

                                                        {apt.items && apt.items.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {apt.items.map((item) => (
                                                                    <Badge key={item.id} variant="secondary" className="bg-slate-50 text-slate-500 border border-slate-100 font-normal text-[10px] px-1.5 py-0">
                                                                        <ShoppingCart className="h-2.5 w-2.5 mr-1" />
                                                                        {item.quantity}x {item.product?.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {(apt.equipment_details || apt.notes) && (
                                                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                                                {apt.equipment_details && (
                                                                    <div className="text-xs flex items-start gap-2">
                                                                        <span className="font-bold text-slate-500 uppercase shrink-0">Equip:</span>
                                                                        <span className="text-slate-700">{apt.equipment_details}</span>
                                                                    </div>
                                                                )}
                                                                {apt.notes && (
                                                                    <div className="text-xs flex items-start gap-2">
                                                                        <span className="font-bold text-slate-500 uppercase shrink-0">Obs:</span>
                                                                        <span className="text-slate-700 line-clamp-2">{apt.notes}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col md:items-center">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investimento Total</div>
                                                        <div className="text-lg font-bold text-slate-900">
                                                            R$ {(
                                                                (apt.service?.price || 0) +
                                                                (apt.items?.reduce((acc, i) => acc + (i.total_price || 0), 0) || 0)
                                                            ).toFixed(2)}
                                                        </div>
                                                        <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
                                                            <span>Mão de Obra: R$ {apt.service?.price?.toFixed(2) || "0,00"}</span>
                                                            {apt.items && apt.items.length > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Peças ({apt.items.length}): R$ {apt.items.reduce((acc, i) => acc + (i.total_price || 0), 0).toFixed(2)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center md:justify-end gap-2 pt-2 md:pt-0">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="gap-2 font-semibold">
                                                                    Atualizar Status <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleOpenEdit(apt)} className="gap-2 font-semibold text-emerald-600">
                                                                    <Plus className="h-4 w-4" /> Editar OS
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuLabel>Atualizar Status</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'received')} className="gap-2">
                                                                    <Package className="h-4 w-4 text-indigo-600" /> Marcar como Recebida
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'in_progress')} className="gap-2">
                                                                    <Clock className="h-4 w-4 text-amber-600" /> Iniciar Serviço
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'awaiting_parts')} className="gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-purple-600" /> Aguardando Peças
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'completed')} className="gap-2">
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Finalizar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'paused')} className="gap-2">
                                                                    <PauseCircle className="h-4 w-4 text-slate-600" /> Pausar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => updateStatus(apt.id, 'cancelled')} className="text-red-600 gap-2">
                                                                    <XCircle className="h-4 w-4" /> Cancelar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Calendar View (Static design for now) */}
            {view === 'calendar' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-slate-900 capitalize">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </h3>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
                    </div>

                    <div className="grid grid-cols-7 border-t border-l border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="p-3 text-center text-xs font-black text-slate-400 border-r border-b border-slate-200 uppercase tracking-widest bg-slate-50">
                                {day}
                            </div>
                        ))}

                        {(() => {
                            const monthStart = startOfMonth(currentDate);
                            const monthEnd = endOfMonth(monthStart);
                            const startDate = startOfWeek(monthStart);
                            const endDate = endOfWeek(monthEnd);
                            const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                            return calendarDays.map((day, idx) => {
                                const dayAppointments = appointments.filter(apt =>
                                    isSameDay(new Date(apt.scheduled_at), day)
                                );
                                const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={idx}
                                        className={`h-32 p-2 border-r border-b border-slate-100 relative group transition-colors cursor-pointer 
                                            ${!isCurrentMonth ? 'bg-slate-50/50' : 'hover:bg-slate-50'} 
                                            ${isToday ? 'bg-emerald-50/30' : ''}`}
                                        onClick={() => {
                                            setSearchTerm(format(day, "dd/MM/yyyy"));
                                            setView('list');
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-bold ${!isCurrentMonth ? 'text-slate-300' : isToday ? 'text-emerald-600' : 'text-slate-400'} group-hover:text-emerald-600 transition-colors`}>
                                                {format(day, "d")}
                                            </span>
                                            {dayAppointments.length > 0 && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                                                    {dayAppointments.length}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-1 overflow-hidden">
                                            {dayAppointments.slice(0, 3).map(apt => (
                                                <div
                                                    key={apt.id}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-100 shadow-sm truncate font-medium text-slate-600 flex items-center gap-1"
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${getStatusConfig(apt.status).color.split(' ')[0].replace('text-', 'bg-')}`} />
                                                    {format(new Date(apt.scheduled_at), "HH:mm")} - {apt.cyclist?.full_name?.split(' ')[0]}
                                                </div>
                                            ))}
                                            {dayAppointments.length > 3 && (
                                                <div className="text-[10px] text-slate-400 pl-1 font-medium italic">
                                                    + {dayAppointments.length - 3} mais...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Novo Agendamento Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Novo Agendamento Manual</DialogTitle>
                        <DialogDescription>
                            Cadastre um serviço realizado ou agendado diretamente na oficina.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Passo 1: Selecionar Cliente */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Cliente (Ciclista)</Label>
                            {selectedCyclist ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {selectedCyclist.full_name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">{selectedCyclist.full_name}</p>
                                            <p className="text-xs text-emerald-700/70">{selectedCyclist.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-emerald-700" onClick={() => setSelectedCyclist(null)}>Alterar</Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar por nome, e-mail, CPF ou celular..."
                                            value={searchCyclist}
                                            onChange={(e) => setSearchCyclist(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] text-slate-400">Dica: Busque pelo CPF ou Telefone para ser mais exato.</p>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-emerald-600 font-bold text-xs"
                                            onClick={() => setIsAddClientOpen(true)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Novo Cliente
                                        </Button>
                                    </div>
                                    {cyclists.length > 0 && (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white divide-y divide-slate-100">
                                            {cyclists.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setSelectedCyclist(c)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
                                                        {c.full_name[0]}
                                                    </div>
                                                    <div className="text-left w-full">
                                                        <p className="text-sm font-bold text-slate-900">{c.full_name}</p>
                                                        <div className="flex flex-col text-[10px] text-slate-500 gap-0.5">
                                                            <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {c.email}</span>
                                                            {(c as any).phone && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {(c as any).phone}</span>}
                                                            {(c as any).cpf && <span className="flex items-center gap-1"><Fingerprint className="h-2.5 w-2.5" /> {(c as any).cpf}</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Passo 1.5: Selecionar Bike */}
                        {selectedCyclist && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipamento (Bike)</Label>
                                <Select value={selectedBikeId} onValueChange={setSelectedBikeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a bike do cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cyclistBikes.length === 0 ? (
                                            <p className="p-4 text-center text-xs text-slate-500 italic">O ciclista não possui bikes cadastradas.</p>
                                        ) : cyclistBikes.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name} {b.brand && `- ${b.brand}`} {b.model && `(${b.model})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Passo 2: Selecionar Serviço */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviço</Label>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um serviço..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.length === 0 ? (
                                        <p className="p-4 text-center text-xs text-slate-500 italic">Nenhum serviço cadastrado.</p>
                                    ) : services.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            <div className="flex justify-between w-full gap-8">
                                                <span>{s.name}</span>
                                                <span className="text-emerald-600 font-bold">R$ {s.price.toFixed(2)}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Passo 3: Data e Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data</Label>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora</Label>
                                <Input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!selectedCyclist || !selectedService || isSaving}
                            onClick={handleCreateAppointment}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Agendar Agora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit OS Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Ordem de Serviço</DialogTitle>
                        <DialogDescription>
                            Atualize as observações técnicas e detalhes do equipamento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Equipamento (Vínculo com Minhas Bikes)</Label>
                            {cyclistBikes.length > 0 ? (
                                <Select value={editBikeId} onValueChange={setEditBikeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a bike..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma bike selecionada</SelectItem>
                                        {cyclistBikes.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name} {b.brand && `- ${b.brand}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-2">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Este cliente não possui bikes cadastradas.
                                </p>
                            )}
                            <div className="mt-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detalhes Adicionais do Equipamento (Manual)</Label>
                                <Input
                                    placeholder="Ex: Cor, S/N, observações rápidas..."
                                    value={editEquipment}
                                    onChange={(e) => setEditEquipment(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações / Laudo Técnico</Label>
                            <textarea
                                className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="Descreva o estado da bike ou observações do serviço..."
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Peças e Produtos</Label>
                                <ShoppingCart className="h-4 w-4 text-slate-400" />
                            </div>

                            <Select value={selectedProductId} onValueChange={handleAddItem}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Adicionar peça ao serviço..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allProducts.length === 0 ? (
                                        <p className="p-4 text-center text-xs text-slate-500 italic">Nenhum produto em estoque.</p>
                                    ) : allProducts.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex justify-between w-full gap-8">
                                                <div className="flex flex-col">
                                                    <span>{p.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{p.sku || "SEM SKU"}</span>
                                                </div>
                                                <span className="text-emerald-600 font-bold text-xs self-center">R$ {p.price.toFixed(2)}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {osItems.length > 0 && (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {osItems.map((item) => (
                                        <div key={item.product_id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500">R$ {item.unit_price.toFixed(2)} / un</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.product_id, -1)}>
                                                        <MinusCircle className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.product_id, 1)}>
                                                        <PlusCircle className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(item.product_id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-800 font-medium font-semibold underline underline-offset-4 decoration-emerald-200">Resumo da OS:</span>
                                </div>
                                <div className="flex justify-between text-xs text-emerald-700">
                                    <span>{editingApt?.service?.name || "Serviço"} (Mão de obra):</span>
                                    <span className="font-bold">R$ {(editingApt?.service?.price || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-emerald-700 pb-2 border-b border-emerald-200">
                                    <span>Peças e Produtos ({osItems.length}):</span>
                                    <span className="font-bold">R$ {osItems.reduce((acc, i) => acc + i.total_price, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base pt-1 font-black text-emerald-900">
                                    <span>VALOR TOTAL:</span>
                                    <span>R$ {((editingApt?.service.price || 0) + osItems.reduce((acc, i) => acc + i.total_price, 0)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isSaving}
                            onClick={handleSaveEdit}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddClientDialog
                isOpen={isAddClientOpen}
                onClose={() => setIsAddClientOpen(false)}
                onSuccess={(client) => {
                    setSelectedCyclist(client);
                    setCyclists([]);
                    setSearchCyclist("");
                }}
            />
        </div>
    );
}
