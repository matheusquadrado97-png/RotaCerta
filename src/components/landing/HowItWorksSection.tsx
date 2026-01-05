import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Conecte seu Strava",
    description: "Faça login com sua conta Strava e autorize o Pelot�o.io a acessar suas atividades. É rápido e seguro."
  },
  {
    number: "02",
    title: "Cadastre suas bikes",
    description: "Adicione suas bicicletas e componentes. Defina os limites de quilometragem para cada peça."
  },
  {
    number: "03",
    title: "Pedale normalmente",
    description: "Continue suas atividades normalmente. O Pelot�o.io monitora o desgaste automaticamente em background."
  },
  {
    number: "04",
    title: "Receba alertas e agende",
    description: "Quando um componente precisar de atenção, você recebe um alerta e pode agendar a manutenção com um clique."
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-secondary/10 rounded-full text-secondary font-medium text-sm mb-4">
            Como Funciona
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Simples assim:{" "}
            <span className="text-gradient">4 passos</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Da conexão ao agendamento, tudo é pensado para ser intuitivo e rápido.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative bg-card p-8 rounded-2xl border border-border shadow-lg animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <span className="inline-block gradient-primary text-primary-foreground font-display font-bold text-lg px-4 py-2 rounded-lg shadow-lg">
                    {step.number}
                  </span>
                </div>

                <div className="pt-6">
                  <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow for non-last items on large screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-primary rounded-full items-center justify-center shadow-lg">
                    <ArrowRight className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
