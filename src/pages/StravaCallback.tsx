
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
                    // Check if it's just a non-2xx status but actually worked logic-wise?
                    // Or maybe try client-side exchange if function fails?
                    // For now, let's treat it as error but maybe suppress if navigate happens fast?
                    throw error;
                }

                if (data?.error) throw new Error(data.error);

                toast.success(`Conexão realizada! ${data.results?.length || 0} bikes sincronizadas.`);

            } catch (err: any) {
                console.error(err);
                // If the error is "Edge Function returned a non-2xx status code", it might be a temporary glitch or configuration.
                // However, user said it "works" afterwards.
                // This might be because the first call worked and the second (due to strict mode) failed with "code already used".
                // The useRef fix above should solve this!
                toast.error("Falha ao conectar: " + err.message);
                setStatus("Erro ao conectar.");
                // Even if error, give chance to go back?
            } finally {
                navigate("/dashboard");
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
