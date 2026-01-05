import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Smartphone, MapPin, Mail, Phone, Fingerprint, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Settings() {
    usePageTitle("Configurações");
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState("");
    const [cpf, setCpf] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    // Address State
    const [cep, setCep] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [complement, setComplement] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (data) {
                const profile = data as any;
                setFullName(profile.full_name || "");
                setCpf(profile.cpf || "");
                setPhone(profile.phone || "");
                setEmail(profile.email || "");
                setCep(profile.cep || "");
                setStreet(profile.street || "");
                setNumber(profile.number || "");
                setComplement(profile.complement || "");
                setNeighborhood(profile.neighborhood || "");
                setCity(profile.city || "");
                setState(profile.state || "");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setStreet(data.logradouro);
                setNeighborhood(data.bairro);
                setCity(data.localidade);
                setState(data.uf);
                toast.success("Endereço encontrado!");
            } else {
                toast.error("CEP não encontrado.");
            }
        } catch (error) {
            toast.error("Erro ao buscar CEP.");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    cpf,
                    phone,
                    cep,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                } as any)
                .eq('id', user?.id);

            if (error) throw error;
            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnect = () => {
        toast.info("Tentativa de desconexão Strava. Funcionalidade em desenvolvimento.");
    };

    const handleChangePassword = () => {
        toast.info("Enviamos um link de redefinição para seu email.");
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl pb-10 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
                <p className="text-slate-500 mt-1">Gerencie seu perfil e informações de localização.</p>
            </div>

            <div className="grid gap-8">
                {/* Personal Info */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                                <CardDescription>Suas informações de contato e identificação.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        className="pl-10"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Email (Apenas Leitura)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input className="pl-10 bg-slate-50" type="email" value={email} disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">CPF</Label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        className="pl-10"
                                        value={cpf}
                                        onChange={e => setCpf(e.target.value)}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Telefone / WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        className="pl-10"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="(00) 0 0000-0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Info */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Endereço e Localização</CardTitle>
                                <CardDescription>Usado para encontrar oficinas próximas a você.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2 md:col-span-1">
                                <Label className="text-xs font-bold uppercase text-slate-500">CEP</Label>
                                <Input
                                    value={cep}
                                    onChange={e => setCep(e.target.value)}
                                    onBlur={handleCepBlur}
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label className="text-xs font-bold uppercase text-slate-500">Rua / Logradouro</Label>
                                <Input
                                    value={street}
                                    onChange={e => setStreet(e.target.value)}
                                    placeholder="Nome da rua"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Número</Label>
                                <Input
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                    placeholder="123"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Complemento</Label>
                                <Input
                                    value={complement}
                                    onChange={e => setComplement(e.target.value)}
                                    placeholder="Apt, Bloco..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Bairro</Label>
                                <Input
                                    value={neighborhood}
                                    onChange={e => setNeighborhood(e.target.value)}
                                    placeholder="Seu bairro"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Cidade</Label>
                                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Sua cidade" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold h-12 shadow-lg shadow-emerald-100"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SettingsIcon className="h-4 w-4 mr-2" />}
                        Salvar Todas as Alterações
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-orange-500" /> Integrações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between p-6 bg-orange-50/30 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center bg-[#FC4C02] text-white rounded">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Strava</p>
                                    <p className="text-xs text-slate-500">Atividades e bicicletas.</p>
                                </div>
                            </div>
                            <Button onClick={handleDisconnect} variant="outline" size="sm" className="border-orange-200 text-orange-800 hover:bg-orange-100">Desconectar</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="h-5 w-5 text-red-500" /> Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleChangePassword} variant="outline" className="w-full text-red-600 border-red-100 hover:bg-red-50">Alterar Senha de Acesso</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
