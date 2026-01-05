import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, Bike as BikeIcon, Package, Loader2, History, CheckCircle2 } from "lucide-react";

import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingDialogProps {
    workshopId: string;
    workshopName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingDialog({ workshopId, workshopName, isOpen, onClose }: BookingDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [bikes, setBikes] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);


    // Form state
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [selectedBikeId, setSelectedBikeId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("09:00");

    const fetchBikeHistory = async (bikeId: string) => {
        if (!bikeId) return;
        setLoadingHistory(true);
        try {
            const { data } = await supabase
                .from('appointments')
                .select('id, scheduled_at, status, service:services(name)')
                .eq('bike_id', bikeId)
                .order('scheduled_at', { ascending: false })
                .limit(3);
            setHistory(data || []);
        } catch (error) {
            console.error("Error fetching bike history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (selectedBikeId) {
            fetchBikeHistory(selectedBikeId);
        } else {
            setHistory([]);
        }
    }, [selectedBikeId]);

    const fetchData = async () => {

        if (!workshopId || !user) return;
        setLoading(true);
        try {
            // Fetch Services
            const { data: svs } = await supabase
                .from('services')
                .select('*')
                .eq('workshop_id', workshopId);
            setServices(svs || []);

            // Fetch Bikes
            const { data: bks } = await supabase
                .from('bikes')
                .select('*')
                .eq('user_id', user.id);
            setBikes(bks || []);
        } catch (error) {
            console.error("Error fetching booking data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleBooking = async () => {
        if (!selectedServiceId || !selectedBikeId || !date || !time) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setLoading(true);
        try {
            const scheduledAt = `${date}T${time}:00-03:00`;
            const startTime = `${date}T${time}:00-03:00`;

            // Calculate end time (default 1 hour later)
            const hour = parseInt(time.split(':')[0]);
            const nextHour = (hour + 1).toString().padStart(2, '0');
            const endTime = `${date}T${nextHour}:${time.split(':')[1]}:00-03:00`;

            const { error } = await supabase.from('appointments').insert({
                cyclist_id: user?.id,
                workshop_id: workshopId,
                service_id: selectedServiceId,
                bike_id: selectedBikeId,
                scheduled_at: scheduledAt,
                status: 'pending',
                start_time: startTime,
                end_time: endTime
            });

            if (error) throw error;

            toast.success("Agendamento solicitado com sucesso! Aguarde a confirmação da oficina.");
            onClose();
        } catch (error: any) {
            toast.error("Erro ao solicitar agendamento: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Agendar em <span className="text-emerald-600">{workshopName}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Escolha sua Bike</Label>
                        <Select onValueChange={setSelectedBikeId} value={selectedBikeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma bicicleta" />
                            </SelectTrigger>
                            <SelectContent>
                                {bikes.map(bike => (
                                    <SelectItem key={bike.id} value={bike.id}>
                                        <div className="flex items-center gap-2">
                                            <BikeIcon className="h-4 w-4 text-slate-400" />
                                            {bike.name}
                                        </div>
                                    </SelectItem>
                                ))}
                                {bikes.length === 0 && (
                                    <p className="p-2 text-xs text-slate-500">Nenhuma bike cadastrada.</p>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Serviço Desejado</Label>
                        <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(service => (
                                    <SelectItem key={service.id} value={service.id}>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-slate-400" />
                                            {service.name} - R$ {service.price}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedBikeId && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <History className="h-4 w-4 text-emerald-500" />
                                Últimas Manutenções
                            </div>

                            {loadingHistory ? (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-2">
                                    {history.map(item => (
                                        <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.service?.name}</span>
                                                <span className="text-slate-500">{format(new Date(item.scheduled_at), "dd/MM/yyyy")}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] scale-90 px-1 py-0">
                                                {item.status === 'completed' ? 'Finalizada' : item.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 text-center py-2">Sem histórico disponível.</p>
                            )}
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Input
                                    type="date"
                                    className="pl-9"
                                    value={date}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Horário</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Input
                                    type="time"
                                    className="pl-9"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        onClick={handleBooking}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar Agendamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
