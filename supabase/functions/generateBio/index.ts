import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Local fallback bio templates when external API is unavailable
const BIO_TEMPLATES: Record<string, string[]> = {
  corporate: [
    "{name} is a results-driven professional with expertise in driving business growth and operational excellence.",
    "With a track record of success, {name} brings strategic vision and leadership to every challenge.",
    "{name} combines analytical thinking with creative problem-solving to deliver exceptional outcomes.",
  ],
  real_estate: [
    "{name} is a dedicated real estate professional committed to helping clients find their perfect property.",
    "With deep local market knowledge, {name} delivers exceptional results for buyers and sellers alike.",
    "{name} brings passion and expertise to every real estate transaction, ensuring client success.",
  ],
  tradie: [
    "{name} is a skilled tradesperson with years of hands-on experience and a commitment to quality.",
    "Known for reliability and craftsmanship, {name} delivers projects on time and on budget.",
    "{name} takes pride in every job, bringing expertise and attention to detail to all projects.",
  ],
  healthcare: [
    "{name} is a compassionate healthcare professional dedicated to patient care and wellbeing.",
    "With a patient-first approach, {name} combines expertise with empathy to deliver exceptional care.",
    "{name} is committed to making a positive difference in the lives of patients and communities.",
  ],
  creative: [
    "{name} is a creative professional who brings fresh perspectives and innovative solutions to every project.",
    "With a unique artistic vision, {name} transforms ideas into compelling visual experiences.",
    "{name} combines creativity with strategic thinking to deliver impactful creative work.",
  ],
};

const TONE_MODIFIERS: Record<string, (bio: string) => string> = {
  professional: (bio) => bio,
  friendly: (bio) => bio.replace(/professional/g, "approachable professional").replace(/dedicated/g, "enthusiastic"),
  confident: (bio) => bio.replace(/is a/g, "is an accomplished").replace(/brings/g, "confidently brings"),
  casual: (bio) => bio.replace(/professional/g, "pro").replace(/exceptional/g, "great"),
};

function generateLocalBio(name: string, industry: string, tone: string, length: string): string {
  const templates = BIO_TEMPLATES[industry] || BIO_TEMPLATES.corporate;
  const template = templates[Math.floor(Math.random() * templates.length)];
  let bio = template.replace(/{name}/g, name);
  
  const toneModifier = TONE_MODIFIERS[tone] || TONE_MODIFIERS.professional;
  bio = toneModifier(bio);
  
  if (length === "short") {
    bio = bio.split(".")[0] + ".";
  } else if (length === "long") {
    bio += " " + templates[(templates.indexOf(template) + 1) % templates.length].replace(/{name}/g, "They");
  }
  
  return bio;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, industry, tone, length, platform } = await req.json();

    // Try external API first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch('https://ethinx.solutions/api/bio/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, industry, tone, length, platform }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // API returned error, fall through to local generation
      console.log(`External API returned ${response.status}, using local fallback`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('External API unavailable, using local fallback:', fetchError);
    }

    // Local fallback
    const bio = generateLocalBio(name, industry || 'corporate', tone || 'professional', length || 'medium');
    
    return new Response(JSON.stringify({ 
      bio,
      source: 'local_fallback',
      message: 'Generated using local templates'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Bio generation error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
