// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Strava Auth Function Invoked")

serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { code, user_id } = await req.json()
        if (!code) throw new Error('No code provided')
        if (!user_id) throw new Error('No user_id provided')

        // 1. Exchange Code for Tokens
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: Deno.env.get('STRAVA_CLIENT_ID'),
                client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
                code,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()
        if (tokenData.errors) throw new Error(JSON.stringify(tokenData.errors))

        // 2. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Update User Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                strava_access_token: tokenData.access_token,
                strava_refresh_token: tokenData.refresh_token,
            })
            .eq('id', user_id)

        if (profileError) throw profileError

        // 4. Fetch Athlete Bikes
        const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const athleteData = await athleteResponse.json()

        const bikes = athleteData.bikes || []
        const results = []

        for (const bike of bikes) {
            // Fetch detailed gear info to get brand and model
            let brand = null;
            let model = null;
            try {
                const gearResponse = await fetch(`https://www.strava.com/api/v3/gear/${bike.id}`, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                if (gearResponse.ok) {
                    const gearData = await gearResponse.json();
                    brand = gearData.brand_name || null;
                    model = gearData.model_name || null;
                }
            } catch (err) {
                console.error(`Error fetching gear details for ${bike.id}:`, err);
            }

            // Check if bike exists
            const { data: existing, error: findError } = await supabaseAdmin
                .from('bikes')
                .select('id')
                .eq('strava_gear_id', bike.id)
                .eq('user_id', user_id)
                .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

            if (existing) {
                await supabaseAdmin.from('bikes').update({
                    name: bike.name,
                    total_mileage: bike.distance / 1000, // meters to km
                    brand: brand,
                    model: model
                }).eq('id', existing.id)
                results.push({ action: 'updated', name: bike.name })
            } else {
                await supabaseAdmin.from('bikes').insert({
                    user_id: user_id,
                    strava_gear_id: bike.id,
                    name: bike.name,
                    total_mileage: bike.distance / 1000,
                    brand: brand,
                    model: model
                })
                results.push({ action: 'inserted', name: bike.name })
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error("Strava Auth Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
