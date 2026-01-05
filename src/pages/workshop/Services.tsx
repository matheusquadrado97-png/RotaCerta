import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
    workshop_id: string;
}

export default function WorkshopServices() {
    usePageTitle("Meus Serviços");
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        duration_minutes: ""
    });

    const fetchServices = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data: workshop, error: wsError } = await supabase
                .from('workshops')
                .select('id')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (wsError) throw wsError;

            if (!workshop) {
                // Trigger auto-initialization by creating a workshop
                const { data: newWs, error: createError } = await supabase
                    .from('workshops')
                    .insert({
                        owner_id: user.id,
                        name: "Minha Oficina",
                        address: "Endereço não informado"
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                // Since this is a check, we continue but with the new ID
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('workshop_id', workshop.id)
                .order('name');

            if (error) throw error;
            setServices(data || []);
        } catch (error: any) {
            console.error("Error fetching services:", error);
            // toast.error("Erro ao carregar serviços");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            let { data: workshop } = await supabase
                .from('workshops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!workshop) {
                const { data: newWorkshop, error: wsError } = await supabase
                    .from('workshops')
                    .insert({
                        owner_id: user.id,
                        name: "Minha Oficina",
                        address: "Endereço não informado"
                    })
                    .select()
                    .single();

                if (wsError) throw wsError;
                workshop = newWorkshop;
            }

            const payload = {
                workshop_id: workshop.id,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                duration_minutes: parseInt(formData.duration_minutes)
            };

            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update(payload)
                    .eq('id', editingService.id);
                if (error) throw error;
                toast.success("Serviço atualizado!");
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert(payload);
                if (error) throw error;
                toast.success("Serviço criado!");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchServices();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao salvar serviço");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            toast.success("Serviço removido");
            fetchServices();
        } catch (error: any) {
            toast.error("Erro ao remover serviço");
        }
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", price: "", duration_minutes: "" });
        setEditingService(null);
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || "",
            price: service.price.toString(),
            duration_minutes: service.duration_minutes.toString()
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Meus Serviços</h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Serviço</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Serviço</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Revisão Geral"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Preço (R$)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            className="pl-9"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duração (minutos)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="duration"
                                            type="number"
                                            className="pl-9"
                                            value={formData.duration_minutes}
                                            onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalhes do serviço..."
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit">{editingService ? "Salvar Alterações" : "Criar Serviço"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : services.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    Nenhum serviço cadastrado. Comece adicionando um!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Card key={service.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
                                <div className="text-sm font-medium text-green-600">
                                    R$ {service.price.toFixed(2)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4 h-10 overflow-hidden text-ellipsis">
                                    {service.description}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mb-4">
                                    <Clock className="mr-1 h-3 w-3" /> {service.duration_minutes} min
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
