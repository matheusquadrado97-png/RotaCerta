import { Activity, Trophy, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { usePageTitle } from "@/hooks/usePageTitle";

export default function Activities() {
    usePageTitle("Atividades");
    const handleConnectStrava = () => {
        const CLIENT_ID = "191168";
        const REDIRECT_URI = `${window.location.origin}/strava-callback`;
        const SCOPE = "read,profile:read_all,activity:read_all";
        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${SCOPE}`;
    };

    const handleSync = () => {
        toast.info("Sincronização iniciada...");
        // In a real app, this would trigger a background sync job
        setTimeout(() => {
            toast.success("Suas atividades estão atualizadas!");
        }, 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
                    <p className="text-muted-foreground">Seu histórico de pedaladas sincronizado com o Strava.</p>
                </div>
                <Button onClick={handleSync} className="bg-[#FC4C02] hover:bg-[#E34402] gap-2">
                    Sincronizar Agora
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center">
                        <Activity className="h-10 w-10 text-orange-300" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium text-gray-900">Nenhuma atividade encontrada</p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Conecte sua conta do Strava para importar suas pedaladas automaticamente e monitorar o uso das suas bikes.
                        </p>
                    </div>
                    <Button onClick={handleConnectStrava} variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                        Conectar Strava
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-emerald-50/50">
                    <CardContent className="p-6 text-center">
                        <Trophy className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">0 km</div>
                        <p className="text-xs text-muted-foreground">Distância Total</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-6 text-center">
                        <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Pedaladas</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50">
                    <CardContent className="p-6 text-center">
                        <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">0h</div>
                        <p className="text-xs text-muted-foreground">Tempo Total</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
