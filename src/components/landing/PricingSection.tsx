import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Ciclista",
    price: "Grátis",
    description: "Para ciclistas que querem monitorar suas bikes",
    features: [
      "Sync ilimitado com Strava",
      "Até 3 bicicletas",
      "Alertas de manutenção",
      "Buscar oficinas próximas",
      "Agendamento online",
      "Histórico de manutenções"
    ],
    cta: "Começar Grátis",
    popular: false
  },
  {
    name: "Oficina Pro",
    price: "R$ 149",
    period: "/mês",
    description: "Para oficinas que querem crescer",
    features: [
      "Dashboard completo",
      "Até 3 mecânicos",
      "Agenda integrada",
      "Leads do app",
      "Controle de estoque",
      "Relatórios básicos",
      "Suporte por email"
    ],
    cta: "Iniciar Trial Grátis",
    popular: true
  },
  {
    name: "Oficina Enterprise",
    price: "R$ 349",
    period: "/mês",
    description: "Para redes de oficinas e grandes operações",
    features: [
      "Tudo do Pro +",
      "Mecânicos ilimitados",
      "Multi-unidades",
      "API completa",
      "Integrações personalizadas",
      "Analytics avançado",
      "Suporte prioritário 24/7",
      "Gerente de conta dedicado"
    ],
    cta: "Falar com Vendas",
    popular: false
  }
];

export const PricingSection = () => {
  return (
    <section className="py-24 bg-background" id="precos">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            Preços
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Planos para cada{" "}
            <span className="text-gradient">necessidade</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Ciclistas usam grátis. Oficinas escolhem o plano ideal para seu negócio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl border p-8 animate-slide-up ${plan.popular
                  ? 'border-primary shadow-xl shadow-primary/10 scale-105'
                  : 'border-border'
                }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?tab=register">
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
