import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, Fingerprint, Loader2 } from "lucide-react";

interface AddClientDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
}

export default function AddClientDialog({ isOpen, onClose, onSuccess }: AddClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [cpf, setCpf] = useState("");

    const handleAdd = async () => {
        if (!fullName || !email) {
            toast.error("Nome e E-mail são obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            // Check if user already exists
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (existing) {
                toast.error("Este e-mail já está cadastrado.");
                setLoading(false);
                return;
            }

            // Create a "ghost" profile. 
            // In a real scenario, this would trigger an invite via Supabase Auth or a custom Edge Function.
            // For now, we create the profile directly so the workshop can continue.
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: crypto.randomUUID(), // Temporário até que o usuário aceite o convite / se cadastre
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    cpf: cpf,
                    role: 'cyclist' as any,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Cliente cadastrado com sucesso! Um convite será simulado para o e-mail informado.");
            onSuccess(data);
            onClose();
            // Reset form
            setFullName("");
            setEmail("");
            setPhone("");
            setCpf("");
        } catch (error: any) {
            toast.error("Erro ao cadastrar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" /> Cadastrar Novo Cliente
                    </DialogTitle>
                    <DialogDescription>
                        Adicione um cliente manualmente. Ele receberá um convite para acompanhar o serviço.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase text-slate-500">Nome Completo</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-10"
                                placeholder="Nome do cliente"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">E-mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-bold uppercase text-slate-500">Telefone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cpf" className="text-xs font-bold uppercase text-slate-500">CPF</Label>
                            <div className="relative">
                                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="cpf"
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    className="pl-10"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button
                        onClick={handleAdd}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Cadastrar e Convidar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
