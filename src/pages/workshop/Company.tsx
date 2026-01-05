import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Building2,
    Users,
    Shield,
    Plus,
    Trash2,
    Save,
    Settings2,
    Eye,
    EyeOff,
    Calendar,
    Loader2,
    Mail,
    UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function WorkshopCompany() {
    usePageTitle("Empresa");
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [workshop, setWorkshop] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [staff, setStaff] = useState<any[]>([]);

    // Invite Member State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("mechanic");
    const [inviting, setInviting] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Workshop
            const { data: ws, error: wsError } = await supabase
                .from('workshops')
                .select('*')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (wsError) throw wsError;

            let currentWorkshop = ws;

            // 2. Auto-initialize workshop if not found
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

            // 3. Fetch/Init Settings
            const { data: st, error: stError } = await supabase
                .from('workshop_settings')
                .select('*')
                .eq('workshop_id', currentWorkshop.id)
                .maybeSingle();

            if (stError) throw stError;

            if (!st) {
                const defaultSettings = {
                    workshop_id: currentWorkshop.id,
                    is_visible: false,
                    max_daily_os: 10,
                    min_notice_hours: 24,
                    default_service_duration: 60,
                    auto_approval: false
                };
                const { data: newSt, error: createStError } = await supabase
                    .from('workshop_settings')
                    .insert(defaultSettings)
                    .select()
                    .single();

                if (createStError) throw createStError;
                setSettings(newSt);
            } else {
                setSettings(st);
            }

            // 4. Fetch Staff
            const { data: stf, error: stfError } = await supabase
                .from('workshop_staff')
                .select('*, profile:profiles(full_name, email)')
                .eq('workshop_id', currentWorkshop.id);

            if (stfError) console.error("Error fetching staff:", stfError);
            setStaff(stf || []);

        } catch (err: any) {
            console.error("Error loading data:", err);
            toast.error("Erro ao carregar dados da empresa: " + (err.message || "Erro desconhecido"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleCepBlur = async () => {
        const cleanCep = workshop.zip_code?.replace(/\D/g, '');
        if (!cleanCep || cleanCep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setWorkshop({
                    ...workshop,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                });
                toast.success("Endereço encontrado!");
            } else {
                toast.error("CEP não encontrado.");
            }
        } catch (error) {
            toast.error("Erro ao buscar CEP.");
        }
    };

    const handleSaveWorkshop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workshop) return;
        try {
            const { error } = await supabase
                .from('workshops')
                .update({
                    name: workshop.name,
                    description: workshop.description,
                    phone: workshop.phone,
                    zip_code: workshop.zip_code,
                    neighborhood: workshop.neighborhood,
                    city: workshop.city,
                    state: workshop.state,
                    street: workshop.street,
                    number: workshop.number,
                    address: `${workshop.street}, ${workshop.number} - ${workshop.neighborhood}, ${workshop.city} - ${workshop.state}`
                } as any)
                .eq('id', workshop.id);
            if (error) throw error;
            toast.success("Dados da empresa salvos com sucesso!");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSaveSettings = async () => {
        if (!workshop || !settings) return;
        try {
            const { error } = await supabase
                .from('workshop_settings')
                .upsert({
                    workshop_id: workshop.id,
                    is_visible: settings.is_visible,
                    max_daily_os: settings.max_daily_os,
                    min_notice_hours: settings.min_notice_hours,
                    default_service_duration: settings.default_service_duration,
                    auto_approval: settings.auto_approval
                });
            if (error) throw error;
            toast.success("Configurações atualizadas!");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleInviteMember = () => {
        setIsInviteOpen(true);
    };

    const handleSendInvite = async () => {
        if (!inviteEmail || !workshop) {
            toast.error("Por favor, preencha o e-mail.");
            return;
        }

        setInviting(true);
        try {
            // Check if user already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('email', inviteEmail)
                .maybeSingle();

            let profileId;

            if (existingProfile) {
                // User exists, just add to workshop_staff
                profileId = existingProfile.id;

                // Check if already a staff member
                const { data: existingStaff } = await supabase
                    .from('workshop_staff')
                    .select('id')
                    .eq('workshop_id', workshop.id)
                    .eq('profile_id', profileId)
                    .maybeSingle();

                if (existingStaff) {
                    toast.error("Este usuário já é membro da equipe.");
                    setInviting(false);
                    return;
                }
            } else {
                // Create a new user via Supabase Auth Admin API
                // Note: This requires admin privileges, so we'll create a placeholder profile
                // and send an invitation email manually or via Edge Function

                const { data: newProfile, error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        email: inviteEmail,
                        full_name: inviteEmail.split('@')[0],
                        role: 'workshop_owner'
                    } as any)
                    .select()
                    .single();

                if (profileError) throw profileError;
                profileId = newProfile.id;

                toast.info("Um convite será enviado para o e-mail informado.");
            }

            // Add to workshop_staff
            const { error: staffError } = await supabase
                .from('workshop_staff')
                .insert({
                    workshop_id: workshop.id,
                    profile_id: profileId,
                    role: inviteRole as any,
                    permissions: {}
                });

            if (staffError) throw staffError;

            toast.success("Membro adicionado com sucesso!");
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteRole("mechanic");
            fetchData();
        } catch (err: any) {
            toast.error("Erro ao convidar membro: " + err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleEditMember = (member: any) => {
        toast.info(`Editando permissões de ${member.profile?.full_name || 'membro'}.`);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;

        try {
            const { error } = await supabase
                .from('workshop_staff')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            toast.success("Membro removido com sucesso.");
            fetchData();
        } catch (err: any) {
            toast.error("Erro ao remover membro: " + err.message);
        }
    };

    if (loading) return (
        <div className="flex h-[400px] flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
            <p className="text-slate-500 font-medium">Carregando dados da sua oficina...</p>
        </div>
    );

    if (!workshop) return (
        <div className="flex h-[400px] flex-col items-center justify-center text-center p-8">
            <Building2 className="h-16 w-16 text-slate-200 mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Oficina não encontrada</h2>
            <p className="text-slate-500 max-w-sm mt-2">Ocorreu um erro ao carregar ou criar os dados da sua oficina. Por favor, tente recarregar a página.</p>
            <Button onClick={() => window.location.reload()} className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                Recarregar Página
            </Button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestão da Empresa</h1>
                <p className="text-slate-500 mt-1">Gerencie os dados, equipe e regras da sua oficina.</p>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList className="bg-white border border-slate-200 p-1 h-auto gap-1">
                    <TabsTrigger value="details" className="gap-2 px-4 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        <Building2 className="h-4 w-4" /> Dados Gerais
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="gap-2 px-4 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        <Users className="h-4 w-4" /> Equipe
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="gap-2 px-4 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                        <Settings2 className="h-4 w-4" /> Regras da Agenda
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Principais</CardTitle>
                            <CardDescription>Informações que aparecem para os ciclistas na busca.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveWorkshop} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome da Oficina</Label>
                                        <Input
                                            id="name"
                                            value={workshop.name || ''}
                                            onChange={e => setWorkshop({ ...workshop, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                        <Input
                                            id="phone"
                                            value={workshop.phone || ''}
                                            onChange={e => setWorkshop({ ...workshop, phone: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="zip_code">CEP</Label>
                                        <Input
                                            id="zip_code"
                                            value={workshop.zip_code || ''}
                                            onChange={e => setWorkshop({ ...workshop, zip_code: e.target.value })}
                                            onBlur={handleCepBlur}
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <Label htmlFor="street">Logradouro (Rua/Av)</Label>
                                        <Input
                                            id="street"
                                            value={workshop.street || ''}
                                            onChange={e => setWorkshop({ ...workshop, street: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="number">Número</Label>
                                        <Input
                                            id="number"
                                            value={workshop.number || ''}
                                            onChange={e => setWorkshop({ ...workshop, number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="neighborhood">Bairro</Label>
                                        <Input
                                            id="neighborhood"
                                            value={workshop.neighborhood || ''}
                                            onChange={e => setWorkshop({ ...workshop, neighborhood: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input
                                            id="city"
                                            value={workshop.city || ''}
                                            onChange={e => setWorkshop({ ...workshop, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">Estado (UF)</Label>
                                        <Input
                                            id="state"
                                            value={workshop.state || ''}
                                            onChange={e => setWorkshop({ ...workshop, state: e.target.value })}
                                            placeholder="SP"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Descrição / Especialidades</Label>
                                    <textarea
                                        id="desc"
                                        className="w-full min-h-[100px] bg-white border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={workshop.description || ''}
                                        onChange={e => setWorkshop({ ...workshop, description: e.target.value })}
                                        placeholder="Ex: Especializada em Mountain Bike e Speed..."
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                        <Save className="h-4 w-4" /> Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-100 bg-emerald-50/20">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-emerald-900">Visibilidade na Plataforma</CardTitle>
                                <CardDescription className="text-emerald-700/70">Controle se sua oficina aparece nas buscas.</CardDescription>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-full border border-emerald-100 shadow-sm">
                                {settings?.is_visible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                                <span className={`text-sm font-bold ${settings?.is_visible ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {settings?.is_visible ? 'VISÍVEL' : 'OCULTA'}
                                </span>
                                <Switch
                                    checked={settings?.is_visible || false}
                                    onCheckedChange={val => {
                                        if (!settings) return;
                                        const newSettings = { ...settings, is_visible: val };
                                        setSettings(newSettings);
                                        // Auto-save visibility for better UX like in Dashboard
                                        supabase.from('workshop_settings').upsert({ workshop_id: workshop.id, is_visible: val }).then(() => {
                                            toast.success(val ? "Oficina visível para busca!" : "Oficina ocultada com sucesso.");
                                        });
                                    }}
                                    className="data-[state=checked]:bg-emerald-600"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 flex gap-4">
                                <Shield className="h-6 w-6 text-emerald-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-emerald-900">Instrução de Segurança</p>
                                    <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                                        Certifique-se de que sua agenda e serviços estão atualizados antes de ficar visível.
                                        Ciclistas poderão agendar serviços diretamente assim que você ativar este ajuste.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="staff" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Equipe e Permissões</CardTitle>
                                <CardDescription>Gerencie quem pode acessar e alterar o painel.</CardDescription>
                            </div>
                            <Button onClick={handleInviteMember} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                <Plus className="h-4 w-4" /> Convidar Membro
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-slate-100">
                                {staff.length > 0 ? staff.map((member, i) => (
                                    <div key={i} className="py-4 flex items-center justify-between group px-2 hover:bg-slate-50 transition-colors rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                {member.profile?.full_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{member.profile?.full_name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => handleEditMember(member)}>Editar</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveMember(member.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center space-y-3">
                                        <Users className="h-12 w-12 text-slate-200 mx-auto" />
                                        <p className="text-slate-500 font-medium">Nenhum membro adicional cadastrado.</p>
                                        <p className="text-xs text-slate-400">O proprietário (você) tem acesso total por padrão.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Capacidade e Horários</CardTitle>
                                <CardDescription>Regule o volume de agendamentos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">Capacidade Máxima Diária (OS)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={settings?.max_daily_os ?? 10}
                                            onChange={e => setSettings({ ...settings, max_daily_os: parseInt(e.target.value) || 0 })}
                                            className="w-24 font-bold text-center"
                                        />
                                        <span className="text-xs text-slate-500 font-medium">Ordens de serviço simultâneas por dia.</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">Duração Padrão (Minutos)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={settings?.default_service_duration ?? 60}
                                            onChange={e => setSettings({ ...settings, default_service_duration: parseInt(e.target.value) || 0 })}
                                            className="w-24 font-bold text-center"
                                        />
                                        <span className="text-xs text-slate-500 font-medium">Tempo base reservado por agendamento.</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-900">Aprovação Automática</p>
                                        <p className="text-xs text-slate-500">Confirmar agendamentos sem revisão manual.</p>
                                    </div>
                                    <Switch
                                        checked={settings?.auto_approval || false}
                                        onCheckedChange={val => setSettings({ ...settings, auto_approval: val })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Antecedência e Bloqueios</CardTitle>
                                <CardDescription>Evite imprevistos na sua agenda.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold">Antecedência Mínima (Horas)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            value={settings?.min_notice_hours ?? 24}
                                            onChange={e => setSettings({ ...settings, min_notice_hours: parseInt(e.target.value) || 0 })}
                                            className="w-24 font-bold text-center"
                                        />
                                        <span className="text-xs text-slate-500 font-medium">Horas antes do serviço para permitir o agendamento.</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Próximos Feriados</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium italic">
                                        Sua oficina está configurada para seguir os feriados municipais de São Paulo.
                                    </p>
                                </div>
                                <Button onClick={handleSaveSettings} className="w-full bg-slate-900 border-none hover:bg-slate-800 text-white shadow-lg disabled:opacity-50" disabled={!settings}>
                                    Atualizar Regras de Negócio
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Invite Member Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-600" />
                            Convidar Membro da Equipe
                        </DialogTitle>
                        <DialogDescription>
                            Adicione um novo membro à sua equipe. Se o e-mail não estiver cadastrado, um convite será enviado.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                E-mail do Membro
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-role" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Função
                            </Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mechanic">Mecânico</SelectItem>
                                    <SelectItem value="attendant">Atendente</SelectItem>
                                    <SelectItem value="manager">Gerente</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 mt-1">
                                Define o nível de acesso e permissões do membro.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsInviteOpen(false);
                                setInviteEmail("");
                                setInviteRole("mechanic");
                            }}
                            disabled={inviting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSendInvite}
                            disabled={!inviteEmail || inviting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            {inviting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Enviar Convite
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
