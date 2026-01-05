import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Bike, Plus, MapPin, Loader2, Activity, Trash2, ChevronRight, Wrench } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

import { Progress } from "@/components/ui/progress";
import { type BikeType, type ComponentMaintenance, MAINTENANCE_INTERVALS, getComponentHealth, getHealthColor, getHealthLabel, getSuspensionStatus } from "@/utils/maintenance";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BikeData {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    total_mileage: number | null;
    bike_type: BikeType;
    component_maintenance: any;
}

import { usePageTitle } from "@/hooks/usePageTitle";

export default function Bikes() {
    usePageTitle("Minhas Bikes");
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bikes, setBikes] = useState<BikeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        model: "",
        bike_type: "MTB" as BikeType
    });
    const [editingBike, setEditingBike] = useState<BikeData | null>(null);
    const [bikeToDelete, setBikeToDelete] = useState<BikeData | null>(null);

    const fetchBikes = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bikes')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setBikes((data as any) || []);
        } catch (error: any) {
            console.error("Error fetching bikes:", error);
            toast.error("Erro ao carregar suas bicicletas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBikes();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            if (editingBike) {
                const { error } = await supabase
                    .from('bikes')
                    .update({
                        name: formData.name,
                        brand: formData.brand,
                        model: formData.model,
                        bike_type: formData.bike_type
                    })
                    .eq('id', editingBike.id);
                if (error) throw error;
                toast.success("Bike atualizada com sucesso!");
            } else {
                const { error } = await supabase
                    .from('bikes')
                    .insert({
                        user_id: user.id,
                        name: formData.name,
                        brand: formData.brand,
                        model: formData.model,
                        total_mileage: 0,
                        bike_type: formData.bike_type,
                        component_maintenance: {
                            corrente: 0,
                            pastilhas: 0,
                            rolamentos: 0,
                            rodas: 0,
                            suspensao: 0,
                            suspensao_count: 0
                        }
                    } as any);
                if (error) throw error;
                toast.success("Bike adicionada com sucesso!");
            }
            setIsDialogOpen(false);
            setFormData({ name: "", brand: "", model: "", bike_type: "MTB" });
            setEditingBike(null);
            fetchBikes();
        } catch (error: any) {
            console.error("Error saving bike:", error);
            toast.error("Erro ao salvar bike: " + error.message);
        }
    };

    const handleDeleteBike = async (id: string) => {
        try {
            const { error } = await supabase
                .from('bikes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Bike removida com sucesso!");
            fetchBikes();
        } catch (error: any) {
            console.error("Error deleting bike:", error);
            toast.error("Erro ao remover bike: " + error.message);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Minhas <span className="text-gradient">Bikes</span></h1>
                    <p className="text-muted-foreground mt-2 font-medium">Gerencie suas máquinas e acompanhe o uso de cada componente.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingBike(null);
                        setFormData({ name: "", brand: "", model: "", bike_type: "MTB" });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary hover:opacity-90 text-white gap-2 shadow-glow font-bold rounded-xl px-6 h-11 transition-all active:scale-95">
                            <Plus className="h-5 w-5" /> Adicionar Bike
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBike ? "Editar Bicicleta" : "Nova Bicicleta"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome (Apelido)</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Minha Caloi"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Marca</Label>
                                    <Input
                                        id="brand"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Modelo</Label>
                                    <Input
                                        id="model"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bike_type">Tipo de Bicicleta</Label>
                                <select
                                    id="bike_type"
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formData.bike_type}
                                    onChange={e => setFormData({ ...formData, bike_type: e.target.value as BikeType })}
                                >
                                    <option value="MTB">MTB</option>
                                    <option value="Speed">Speed</option>
                                    <option value="Gravel">Gravel</option>
                                    <option value="E-bike">E-bike</option>
                                </select>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-lg">{formData.name || "Nova Bike"}</h3>
                                <p className="text-sm text-muted-foreground">{formData.brand} {formData.model}</p>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="gradient-primary hover:opacity-90 text-white shadow-glow font-bold rounded-xl w-full h-11">
                                    {editingBike ? "Salvar Alterações" : "Cadastrar Bicicleta"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bikes.length === 0 ? (
                    <Card className="col-span-full border-white/10 bg-card/40 backdrop-blur-xl rounded-3xl py-16 shadow-xl">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                            <div className="h-24 w-24 rounded-3xl bg-muted p-6 shadow-inner rotate-3 animate-float">
                                <Bike className="h-full w-full text-muted-foreground/40" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-2xl text-foreground">Nenhuma bike por aqui</p>
                                <p className="text-muted-foreground font-medium max-w-[300px]">Adicione suas bicicletas manualmente ou sincronize com o Strava para começar.</p>
                            </div>
                            <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary hover:opacity-90 text-white shadow-glow font-bold rounded-xl px-8 h-12 transition-all active:scale-95">
                                Adicionar primeira bike
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    bikes.map((bike) => (
                        <Card key={bike.id} className="group overflow-hidden rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-300 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-0 group-hover:opacity-10 blur-3xl transition-opacity pointer-events-none" />
                            <CardContent className="p-8">
                                <div className="flex items-start justify-between">
                                    <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-glow rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <Bike className="h-8 w-8" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => {
                                                setEditingBike(bike);
                                                setFormData({
                                                    name: bike.name,
                                                    brand: bike.brand || "",
                                                    model: bike.model || "",
                                                    bike_type: bike.bike_type || "MTB"
                                                });
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Wrench className="h-5 w-5" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            onClick={() => setBikeToDelete(bike)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <h3 className="font-black text-2xl text-foreground group-hover:text-primary transition-colors">{bike.name}</h3>
                                    <p className="text-muted-foreground font-bold mt-1 uppercase tracking-widest text-[10px] opacity-70">
                                        {bike.brand} • {bike.model}
                                    </p>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-black text-foreground">{((bike.total_mileage || 0) / 1000).toFixed(0)} km <span className="text-muted-foreground font-medium uppercase text-[10px] ml-1">Rodados</span></span>
                                    </div>
                                    <Badge className="bg-muted text-muted-foreground border-white/5 font-black uppercase text-[10px] px-3 py-1 rounded-lg">
                                        {bike.bike_type || 'MTB'}
                                    </Badge>
                                </div>

                                <div className="mt-10 space-y-6">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Activity className="h-3.5 w-3.5 text-primary" /> Saúde dos Componentes
                                        </h4>
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    </div>

                                    {(['corrente', 'pastilhas', 'rolamentos', 'rodas'] as const).map((comp) => {
                                        const health = getComponentHealth(
                                            bike.total_mileage || 0,
                                            bike.component_maintenance?.[comp] || 0,
                                            (MAINTENANCE_INTERVALS[bike.bike_type as BikeType || 'MTB'] as any)[comp]
                                        );
                                        const colorClass = getHealthColor(health);
                                        return (
                                            <div key={comp} className="group/comp">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="font-bold text-muted-foreground group-hover/comp:text-foreground transition-colors capitalize">{comp}</span>
                                                    <span className={`font-black ${colorClass}`}>
                                                        {getHealthLabel(health)} ({health.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-white/5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 shadow-glow-sm ${health > 80 ? 'bg-primary' : health > 40 ? 'bg-amber-500' : 'bg-destructive'}`}
                                                            style={{ width: `${health}%` }}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-40 group-hover/comp:opacity-100"
                                                        title="Reiniciar manutenção"
                                                        onClick={async () => {
                                                            const newMaint = { ...bike.component_maintenance, [comp]: bike.total_mileage || 0 };
                                                            const { error } = await supabase
                                                                .from('bikes')
                                                                .update({ component_maintenance: newMaint } as any)
                                                                .eq('id', bike.id);
                                                            if (!error) {
                                                                toast.success(`Manutenção de ${comp} reiniciada!`);
                                                                fetchBikes();
                                                            }
                                                        }}
                                                    >
                                                        <Activity className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(bike.bike_type === 'MTB' || bike.bike_type === 'E-bike') && (() => {
                                        const status = getSuspensionStatus(
                                            bike.total_mileage || 0,
                                            bike.component_maintenance?.suspensao || 0,
                                            bike.component_maintenance?.suspensao_count || 0
                                        );
                                        const colorClass = getHealthColor(status.health);
                                        return (
                                            <div className="group/comp">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="font-bold text-muted-foreground group-hover/comp:text-foreground transition-colors capitalize">{status.label}</span>
                                                    <span className={`font-black ${colorClass}`}>
                                                        {getHealthLabel(status.health)} ({status.health.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-white/5">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 shadow-glow-sm ${status.health > 80 ? 'bg-primary' : status.health > 40 ? 'bg-amber-500' : 'bg-destructive'}`}
                                                            style={{ width: `${status.health}%` }}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-40 group-hover/comp:opacity-100"
                                                        title="Reiniciar manutenção"
                                                        onClick={async () => {
                                                            const currentCount = bike.component_maintenance?.suspensao_count || 0;
                                                            const newMaint = {
                                                                ...bike.component_maintenance,
                                                                suspensao: bike.total_mileage || 0,
                                                                suspensao_count: (currentCount + 1) % 4
                                                            };
                                                            const { error } = await supabase
                                                                .from('bikes')
                                                                .update({ component_maintenance: newMaint } as any)
                                                                .eq('id', bike.id);
                                                            if (!error) {
                                                                toast.success(`Manutenção de suspensão (${status.is200h ? '200h' : '50h'}) reiniciada!`);
                                                                fetchBikes();
                                                            }
                                                        }}
                                                    >
                                                        <Activity className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                            <div className="px-8 py-4 bg-muted/30 backdrop-blur-sm border-t border-white/5 flex items-center justify-between group-hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => navigate('/dashboard/maintenance')}>
                                <span className="text-xs font-black text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">Ver plano de manutenção</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!bikeToDelete} onOpenChange={(open) => !open && setBikeToDelete(null)}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Remover Bicicleta?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium text-base">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a sua <span className="text-foreground font-bold">{bikeToDelete?.name}</span> e todo o histórico de manutenção associado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-6">
                        <AlertDialogCancel className="rounded-xl border-white/10 hover:bg-white/5 font-bold h-11">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold h-11 shadow-glow-sm"
                            onClick={() => {
                                if (bikeToDelete) {
                                    handleDeleteBike(bikeToDelete.id);
                                    setBikeToDelete(null);
                                }
                            }}
                        >
                            Sim, Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
