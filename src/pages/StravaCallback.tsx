import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StravaCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState("Processando conexão...");

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            toast.error("Erro na conexão com Strava: " + error);
            navigate("/");
            return;
        }

        if (!code || !user) {
            return; // Wait for user or code
        }

        const exchangeToken = async () => {
            try {
                setStatus("Trocando tokens com Strava...");

                // Call Edge Function
                const { data, error } = await supabase.functions.invoke('strava-auth', {
                    body: { code, user_id: user.id }
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                toast.success(`Conexão realizada! ${data.results?.length || 0} bikes sincronizadas.`);
                navigate("/dashboard"); // Or dashboard
            } catch (err: any) {
                console.error(err);
                toast.error("Falha ao conectar: " + err.message);
                setStatus("Erro ao conectar.");
            }
        };

        exchangeToken();
    }, [searchParams, user, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Conectando ao Strava</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{status}</p>
                </CardContent>
            </Card>
        </div>
    );
}
