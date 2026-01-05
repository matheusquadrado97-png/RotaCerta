
import { useEffect, useState, useRef } from "react";
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
    const hasCalled = useRef(false);

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

        // Prevent double call in strict mode
        if (hasCalled.current) return;
        hasCalled.current = true;

        const exchangeToken = async () => {
            try {
                setStatus("Trocando tokens com Strava...");

                // Call Edge Function
                const { data, error } = await supabase.functions.invoke('strava-auth', {
                    body: { code, user_id: user.id }
                });

                if (error) {
                    console.error("Edge Function Error Object:", error);
                    throw error;
                }

                if (data?.error) throw new Error(data.error);

                toast.success(`Conexão realizada! ${data.results?.length || 0} bikes sincronizadas.`);

            } catch (err: any) {
                console.error("Connection Flow Error:", err);

                let msg = err.message;
                // Try to extract body if it's a FunctionsHttpError
                try {
                    if (err.context && typeof err.context.json === 'function') {
                        const body = await err.context.json();
                        if (body && body.error) {
                            msg = body.error;
                        }
                    }
                } catch (e) {
                    console.log("Could not parse error context JSON", e);
                }

                toast.error("Falha ao conectar: " + msg);
                setStatus("Erro: " + msg);
            } finally {
                // Delay navigation slightly so user can see the error toast if present
                if (!status.startsWith("Erro")) {
                    navigate("/dashboard");
                }
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
