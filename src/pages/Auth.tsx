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
import { Bike, Wrench, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState<"cyclist" | "workshop">("cyclist");

    useEffect(() => {
        if (session) {
            navigate("/dashboard");
        }
    }, [session, navigate]);

    const handleAuth = async (mode: "login" | "register") => {
        setLoading(true);
        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            user_type: userType,
                        },
                    },
                });
                if (error) throw error;
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    toast.error("Este email já está em uso.");
                    return;
                }
                toast.success("Conta criada com sucesso! Verifique seu email.");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background z-0" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] z-0 animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] z-0" />

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center justify-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">Pelotão</span>
                        <span className="text-foreground">.io</span>
                    </h1>
                    <p className="text-muted-foreground">Sua jornada, nossa paixão.</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 backdrop-blur p-1 rounded-xl">
                        <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold transition-all">Entrar</TabsTrigger>
                        <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold transition-all">Cadastrar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle>Bem-vindo de volta</CardTitle>
                                <CardDescription>Entre com suas credenciais para acessar sua conta.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-muted/30 border-white/10 focus-visible:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-muted/30 border-white/10 focus-visible:ring-primary/50"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full gradient-primary font-bold shadow-glow h-11"
                                    onClick={() => handleAuth("login")}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    Entrar
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register">
                        <Card className="border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle>Crie sua conta</CardTitle>
                                <CardDescription>Comece agora gratuitamente.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Eu sou...</Label>
                                    <RadioGroup defaultValue="cyclist" onValueChange={(v: "cyclist" | "workshop") => setUserType(v)} className="grid grid-cols-2 gap-4">
                                        <div>
                                            <RadioGroupItem value="cyclist" id="cyclist" className="peer sr-only" />
                                            <Label
                                                htmlFor="cyclist"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-muted/30 p-4 hover:bg-muted/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all text-center gap-2"
                                            >
                                                <Bike className="mb-2 h-6 w-6" />
                                                Ciclista
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="workshop" id="workshop" className="peer sr-only" />
                                            <Label
                                                htmlFor="workshop"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-muted/30 p-4 hover:bg-muted/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all text-center gap-2"
                                            >
                                                <Wrench className="mb-2 h-6 w-6" />
                                                Oficina
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-muted/30 border-white/10 focus-visible:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password">Senha</Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-muted/30 border-white/10 focus-visible:ring-primary/50"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full gradient-primary font-bold shadow-glow h-11"
                                    onClick={() => handleAuth("register")}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <div className="flex items-center gap-2">Criar Conta</div>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                <p className="text-center text-xs text-muted-foreground mt-8 opacity-70">
                    Ao continuar, você concorda com nossos <br />
                    <span className="text-primary hover:underline cursor-pointer">Termos de Serviço</span> e <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>.
                </p>
            </div>
        </div>
    );
}
