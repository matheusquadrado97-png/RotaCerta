import { Button } from "@/components/ui/button";
import { Bike } from "lucide-react";

export const ConnectStravaButton = () => {
    const CLIENT_ID = "191168"; // Public Client ID
    // Use current window location origin/strava-callback
    const REDIRECT_URI = `${window.location.origin}/strava-callback`;
    const SCOPE = "read,profile:read_all,activity:read_all";

    const handleConnect = () => {
        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${SCOPE}`;
    };

    return (
        <Button
            onClick={handleConnect}
            className="bg-[#FC4C02] hover:bg-[#E34402] text-white"
        >
            <Bike className="mr-2 h-4 w-4" />
            Conectar com Strava
        </Button>
    );
};
