import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Bike } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Auth() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<"cyclist" | "workshop_owner">("cyclist");
    const [loading, setLoading] = useState(false);
    const { session } = useAuth();
    const navigate = useNavigate();

    usePageTitle("Entrar");

    // Redirect if already logged in
    useEffect(() => {
        if (session) {
            const userRole = session.user.user_metadata?.role;
            if (userRole === "workshop_owner") {
                navigate("/workshop");
            } else {
                navigate("/dashboard");
            }
        }
    }, [session, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            toast.success("Login realizado com sucesso!");

            // Check metadata to redirect correctly
            const { data: { user } } = await supabase.auth.getUser();
            const userRole = user?.user_metadata?.role;

            if (userRole === "workshop_owner") {
                navigate("/workshop");
            } else {
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    },
                },
            });

            if (error) throw error;
            toast.success("Cadastro realizado! Verifique seu email.");
        } catch (error: any) {
            toast.error(error.message || "Erro ao cadastrar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-hero px-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-20 -left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <Card className="w-full max-w-md bg-white/40 backdrop-blur-xl border-white/20 shadow-2xl relative z-10 animate-slide-up">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow animate-float">
                        <Bike className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight text-gradient">Pelot�o.io</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Sua jornada começa aqui</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
                            <TabsTrigger value="login" className="rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Entrar</TabsTrigger>
                            <TabsTrigger value="register" className="rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm">Criar conta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email-login" className="text-sm font-semibold">Email</Label>
                                    <Input
                                        id="email-login"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password-login" className="text-sm font-semibold">Senha</Label>
                                        <button type="button" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</button>
                                    </div>
                                    <Input
                                        id="password-login"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-12 text-base font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Entrar na Plataforma
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullname" className="text-sm font-semibold">Nome Completo</Label>
                                    <Input
                                        id="fullname"
                                        placeholder="Seu Nome"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email-register" className="text-sm font-semibold">Email</Label>
                                    <Input
                                        id="email-register"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password-register" className="text-sm font-semibold">Senha</Label>
                                    <Input
                                        id="password-register"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white/50 border-white/30 focus:bg-white transition-all duration-300"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-semibold">Como você vai usar o Pelot�o.io?</Label>
                                    <RadioGroup defaultValue="cyclist" value={role} onValueChange={(v) => setRole(v as "cyclist" | "workshop_owner")} className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2 border border-white/30 bg-white/20 p-3 rounded-xl cursor-pointer hover:bg-white/40 transition-all duration-300">
                                            <RadioGroupItem value="cyclist" id="r-cyclist" />
                                            <Label htmlFor="r-cyclist" className="cursor-pointer font-medium">Ciclista</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border border-white/30 bg-white/20 p-3 rounded-xl cursor-pointer hover:bg-white/40 transition-all duration-300">
                                            <RadioGroupItem value="workshop_owner" id="r-owner" />
                                            <Label htmlFor="r-owner" className="cursor-pointer font-medium">Oficina</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <Button type="submit" className="w-full h-12 text-base font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-4" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                    Criar Minha Conta
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col items-center border-t border-white/10 pt-6">
                    <p className="text-xs text-muted-foreground text-center">
                        Ao continuar, você concorda com nossos <br />
                        <span className="text-primary hover:underline cursor-pointer">Termos de Serviço</span> e <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
