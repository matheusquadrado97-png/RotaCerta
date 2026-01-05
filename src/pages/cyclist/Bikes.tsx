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
import { Bike, Plus, MapPin, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { type BikeType, type ComponentMaintenance, MAINTENANCE_INTERVALS, getComponentHealth, getHealthColor, getHealthLabel, getSuspensionStatus } from "@/utils/maintenance";

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
                    });
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

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Minhas Bikes</h1>
                    <p className="text-muted-foreground">Gerencie suas bicicletas e acompanhe o uso de cada uma.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingBike(null);
                        setFormData({ name: "", brand: "", model: "", bike_type: "MTB" });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <Plus className="h-4 w-4" /> Adicionar Bike
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
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Salvar Bike</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bikes.length === 0 ? (
                    <Card className="col-span-full border-none shadow-sm py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                                <Bike className="h-10 w-10 text-gray-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-gray-900">Nenhuma bike cadastrada ainda</p>
                                <p className="text-sm text-gray-500">Adicione suas bicicletas manualmente ou sincronize com o Strava.</p>
                            </div>
                            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="border-emerald-200 text-emerald-700">Adicionar bike manualmente</Button>
                        </CardContent>
                    </Card>
                ) : (
                    bikes.map((bike) => (
                        <Card key={bike.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Bike className="h-6 w-6" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
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
                                        Editar
                                    </Button>
                                </div>
                                <div className="mt-4">
                                    <h3 className="font-bold text-lg">{bike.name}</h3>
                                    <p className="text-sm text-muted-foreground">{bike.brand} {bike.model}</p>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                        <MapPin className="h-4 w-4" />
                                        <span>{((bike.total_mileage || 0) / 1000).toFixed(0)} km rodados</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                        {bike.bike_type || 'MTB'}
                                    </span>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Saúde dos Componentes
                                    </h4>

                                    {(['corrente', 'pastilhas', 'rolamentos', 'rodas'] as const).map((comp) => {
                                        const health = getComponentHealth(
                                            bike.total_mileage || 0,
                                            bike.component_maintenance?.[comp] || 0,
                                            (MAINTENANCE_INTERVALS[bike.bike_type as BikeType || 'MTB'] as any)[comp]
                                        );
                                        return (
                                            <div key={comp} className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="capitalize text-slate-600">{comp}</span>
                                                    <span className={`font-medium ${getHealthColor(health)}`}>
                                                        {getHealthLabel(health)} ({health.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={health} className="h-1.5" />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-emerald-600"
                                                        title="Reiniciar manutenção"
                                                        onClick={async () => {
                                                            const newMaint = { ...bike.component_maintenance, [comp]: bike.total_mileage || 0 };
                                                            const { error } = await supabase
                                                                .from('bikes')
                                                                .update({ component_maintenance: newMaint as any })
                                                                .eq('id', bike.id);
                                                            if (!error) {
                                                                toast.success(`Manutenção de ${comp} reiniciada!`);
                                                                fetchBikes();
                                                            }
                                                        }}
                                                    >
                                                        <Activity className="h-3 w-3" />
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
                                        return (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="capitalize text-slate-600">{status.label}</span>
                                                    <span className={`font-medium ${getHealthColor(status.health)}`}>
                                                        {getHealthLabel(status.health)} ({status.health.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={status.health} className="h-1.5" />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-emerald-600"
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
                                                                .update({ component_maintenance: newMaint as any })
                                                                .eq('id', bike.id);
                                                            if (!error) {
                                                                toast.success(`Manutenção de suspensão (${status.is200h ? '200h' : '50h'}) reiniciada!`);
                                                                fetchBikes();
                                                            }
                                                        }}
                                                    >
                                                        <Activity className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
