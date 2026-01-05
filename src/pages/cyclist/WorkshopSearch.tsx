import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    MapPin,
    Building2,
    Calendar,
    ChevronRight,
    Star,
    Loader2
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import BookingDialog from "@/components/cyclist/BookingDialog";

// Mapping of cities to their nearby cities (Porto Alegre metropolitan area as example)
const NEARBY_CITIES: Record<string, string[]> = {
    // Porto Alegre region
    "Porto Alegre": ["Canoas", "Gravataí", "Viamão", "Alvorada", "Cachoeirinha", "São Leopoldo", "Novo Hamburgo"],
    "Canoas": ["Porto Alegre", "Esteio", "Sapucaia do Sul", "Nova Santa Rita"],
    "Gravataí": ["Porto Alegre", "Cachoeirinha", "Glorinha"],
    "Viamão": ["Porto Alegre", "Alvorada"],
    "Alvorada": ["Porto Alegre", "Viamão", "Cachoeirinha"],
    "Cachoeirinha": ["Porto Alegre", "Gravataí", "Alvorada"],
    "São Leopoldo": ["Porto Alegre", "Novo Hamburgo", "Sapiranga"],
    "Novo Hamburgo": ["Porto Alegre", "São Leopoldo", "Estância Velha", "Campo Bom"],

    // São Paulo region
    "São Paulo": ["Guarulhos", "Osasco", "Santo André", "São Bernardo do Campo", "São Caetano do Sul", "Diadema", "Mauá", "Taboão da Serra"],
    "Guarulhos": ["São Paulo", "Arujá", "Mairiporã"],
    "Osasco": ["São Paulo", "Barueri", "Carapicuíba", "Cotia"],
    "Santo André": ["São Paulo", "São Bernardo do Campo", "São Caetano do Sul", "Mauá"],

    // Rio de Janeiro region
    "Rio de Janeiro": ["Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Belford Roxo"],
    "Niterói": ["Rio de Janeiro", "São Gonçalo"],
    "São Gonçalo": ["Rio de Janeiro", "Niterói", "Itaboraí"],

    // Belo Horizonte region
    "Belo Horizonte": ["Contagem", "Betim", "Nova Lima", "Ribeirão das Neves", "Santa Luzia"],
    "Contagem": ["Belo Horizonte", "Betim"],

    // Curitiba region
    "Curitiba": ["São José dos Pinhais", "Colombo", "Pinhais", "Araucária"],
    "São José dos Pinhais": ["Curitiba"],
    "Colombo": ["Curitiba", "Pinhais"],
};

// Helper function to normalize text (remove accents and lowercase)
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

// Helper function to get nearby cities
const getNearbyCities = (city: string): string[] => {
    const normalizedInput = normalizeText(city);

    // Try exact match first (faster)
    if (NEARBY_CITIES[city.trim()]) {
        return NEARBY_CITIES[city.trim()];
    }

    // Try case-insensitive and accent-insensitive match
    const cityKey = Object.keys(NEARBY_CITIES).find(
        key => normalizeText(key) === normalizedInput
    );

    return cityKey ? NEARBY_CITIES[cityKey] : [];
};

export default function WorkshopSearch() {
    usePageTitle("Procurar Oficinas");
    const [loading, setLoading] = useState(true);
    const [workshops, setWorkshops] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    const fetchWorkshops = async () => {
        setLoading(true);
        try {
            // Get user profile for location-based search
            const { data: { user } } = await supabase.auth.getUser();
            let profileLocation = null;

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('city, neighborhood')
                    .eq('id', user.id)
                    .maybeSingle(); // Use maybeSingle to avoid errors if profile missing
                profileLocation = profile;
            }

            // Query workshops joined with settings for visibility
            let query = supabase
                .from('workshops')
                .select(`
                    *,
                    workshop_settings!inner (
                        is_visible
                    )
                `)
                .eq('workshop_settings.is_visible', true);

            if (searchTerm) {
                // Fetch all visible workshops and filter client-side for accent-insensitive search
                const { data: allData, error: allError } = await query;

                if (allError) throw allError;

                if (!allData || allData.length === 0) {
                    setWorkshops([]);
                    setLoading(false);
                    return;
                }

                // Normalize search term
                const normalizedSearch = normalizeText(searchTerm);

                // Check if it's a city with nearby cities
                const nearbyCities = getNearbyCities(searchTerm);
                const citiesToSearch = nearbyCities.length > 0
                    ? [searchTerm, ...nearbyCities]
                    : [];

                // Filter workshops client-side with accent-insensitive matching
                const filtered = allData.filter((ws: any) => {
                    const normalizedName = normalizeText(ws.name || '');
                    const normalizedCity = normalizeText(ws.city || '');
                    const normalizedNeighborhood = normalizeText(ws.neighborhood || '');

                    // Check if matches name or neighborhood
                    if (normalizedName.includes(normalizedSearch) ||
                        normalizedNeighborhood.includes(normalizedSearch)) {
                        return true;
                    }

                    // Check if matches city (exact or nearby)
                    if (normalizedCity.includes(normalizedSearch)) {
                        return true;
                    }

                    // Check if matches any nearby city
                    if (citiesToSearch.length > 0) {
                        return citiesToSearch.some(city =>
                            normalizeText(city) === normalizedCity
                        );
                    }

                    return false;
                });

                setWorkshops(filtered);
                setLoading(false);
                return;
            } else if (profileLocation?.city) {
                // Try filtering by city first, then include nearby cities
                const nearbyCities = getNearbyCities(profileLocation.city);
                const citiesToSearch = [profileLocation.city, ...nearbyCities];

                // Fetch all visible workshops
                const { data: allData, error: allError } = await query;

                if (allError) throw allError;

                if (!allData || allData.length === 0) {
                    setWorkshops([]);
                    setLoading(false);
                    return;
                }

                // Filter by city (accent-insensitive)
                const filtered = allData.filter((ws: any) => {
                    const normalizedWsCity = normalizeText(ws.city || '');
                    return citiesToSearch.some(city =>
                        normalizeText(city) === normalizedWsCity
                    );
                });

                if (filtered.length > 0) {
                    // Sort results: user's city first, then nearby cities
                    const sorted = filtered.sort((a: any, b: any) => {
                        const normalizedUserCity = normalizeText(profileLocation.city);
                        if (normalizeText(a.city) === normalizedUserCity) return -1;
                        if (normalizeText(b.city) === normalizedUserCity) return 1;
                        return 0;
                    });
                    setWorkshops(sorted);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setWorkshops(data || []);
        } catch (error) {
            console.error("Error fetching workshops:", error);
            setWorkshops([]); // Ensure state is reset on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkshops();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchWorkshops();
    };

    const openBooking = (ws: any) => {
        setSelectedWorkshop(ws);
        setIsBookingOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Encontrar Oficina</h1>
                    <p className="text-slate-500 mt-1">Busque as melhores oficinas da sua região e agende serviços.</p>
                </div>
            </div>

            {/* Search Bar */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch">
                        <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-slate-100 py-3">
                            <Search className="h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Nome da oficina, cidade ou bairro..."
                                className="border-none shadow-none focus-visible:ring-0 text-base p-0"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-none h-auto px-8 font-semibold py-4 md:py-0">
                            Buscar Oficinas
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                ) : workshops.length === 0 ? (
                    <Card className="col-span-full py-16 flex flex-col items-center text-center">
                        <Building2 className="h-16 w-16 text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Nenhuma oficina encontrada</h3>
                        <p className="text-slate-500 max-w-xs mt-2">
                            Tente buscar por um termo diferente ou mude sua localização.
                        </p>
                    </Card>
                ) : (
                    workshops.map(ws => (
                        <Card key={ws.id} className="group hover:border-emerald-200 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                                <Building2 className="h-12 w-12 text-slate-300" />
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                    <span className="text-xs font-bold text-slate-700">4.9</span>
                                </div>
                            </div>
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl group-hover:text-emerald-700 transition-colors">{ws.name}</CardTitle>
                                        <div className="flex items-center gap-1.5 text-slate-500 mt-1.5">
                                            <MapPin className="h-4 w-4 shrink-0" />
                                            <span className="text-sm truncate">{ws.city}, {ws.neighborhood}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-2 flex-1 flex flex-col">
                                <p className="text-sm text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                                    {ws.description || "Especialista em manutenção de bicicletas de alta performance."}
                                </p>
                                <div className="mt-auto pt-6 flex gap-3">
                                    <Button
                                        onClick={() => openBooking(ws)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                                    >
                                        <Calendar className="h-4 w-4" /> Agendar
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {selectedWorkshop && (
                <BookingDialog
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    workshopId={selectedWorkshop.id}
                    workshopName={selectedWorkshop.name}
                />
            )}
        </div>
    );
}
