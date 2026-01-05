export type BikeType = "MTB" | "Speed" | "Gravel" | "E-bike";

export interface ComponentMaintenance {
    corrente: number;
    pastilhas: number;
    rolamentos: number;
    rodas: number;
    suspensao: number; // Unified field
}

export const MAINTENANCE_INTERVALS: Record<BikeType, any> = {
    MTB: {
        corrente: 1600, // Average of 1200-2000
        pastilhas: 1150, // Average of 800-1500
        rolamentos: 1000,
        rodas: 2500,
        suspensao_50h: 875, // Average of 750-1000 km
        suspensao_200h: 3000, // Average of 2500-3500 km
    },
    Speed: {
        corrente: 3250, // Average of 2500-4000
        pastilhas: 3000, // Average of 2000-4000
        rolamentos: 1000,
        rodas: 2500,
    },
    Gravel: {
        corrente: 2400, // Average of 1800-3000
        pastilhas: 2250, // Average of 1500-3000
        rolamentos: 1000,
        rodas: 2500,
    },
    "E-bike": {
        corrente: 1400, // Average of 1000-1800
        pastilhas: 950, // Average of 700-1200
        rolamentos: 1000,
        rodas: 2500,
    },
};

export const getComponentHealth = (
    currentKm: number,
    lastMaintenanceKm: number,
    limitKm: number
): number => {
    const usedKm = Math.max(0, currentKm - lastMaintenanceKm);
    const health = Math.max(0, 100 - (usedKm / limitKm) * 100);
    return Math.min(100, health);
};

export const getSuspensionStatus = (
    currentKm: number,
    lastMaintenanceKm: number,
    maintenanceCount: number = 0
) => {
    const usedKm = Math.max(0, currentKm - (lastMaintenanceKm || 0));

    // Every 4th maintenance is 200h (3000km), others are 50h (875km)
    // maintenanceCount: 0, 1, 2 -> 50h; 3 -> 200h
    const is200h = (maintenanceCount % 4 === 3);
    const limit = is200h ? 3000 : 875;
    const label = is200h ? "Garfo/Shock (200h)" : "Garfo/Shock (50h)";

    const health = Math.max(0, 100 - (usedKm / limit) * 100);
    return { label, health, is200h };
};

export const getHealthColor = (health: number): string => {
    if (health > 30) return "text-emerald-500";
    if (health > 15) return "text-amber-500";
    return "text-red-500";
};

export const getHealthLabel = (health: number): string => {
    if (health > 30) return "Saudável";
    if (health > 15) return "Atenção";
    return "Crítico";
};
