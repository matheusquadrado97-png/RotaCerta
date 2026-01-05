import { Activity, Bell, Calendar, MapPin, Shield, Wrench } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Sync Automático com Strava",
    description: "Conecte sua conta Strava e sincronize automaticamente todas as suas atividades. A quilometragem é calculada em tempo real."
  },
  {
    icon: Bell,
    title: "Alertas Inteligentes",
    description: "Receba notificações quando seus componentes atingirem o limite de desgaste. Nunca mais seja pego de surpresa."
  },
  {
    icon: MapPin,
    title: "Oficinas Próximas",
    description: "Encontre oficinas certificadas perto de você com avaliações, preços e disponibilidade em tempo real."
  },
  {
    icon: Calendar,
    title: "Agendamento Integrado",
    description: "Agende manutenções diretamente pelo app. Escolha data, horário e serviço sem precisar ligar."
  },
  {
    icon: Shield,
    title: "Histórico Completo",
    description: "Mantenha um registro detalhado de todas as manutenções realizadas. Valorize sua bike na revenda."
  },
  {
    icon: Wrench,
    title: "Dashboard para Oficinas",
    description: "Ferramentas completas para oficinas gerenciarem agenda, clientes e estoque de peças."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            Funcionalidades
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para{" "}
            <span className="text-gradient">pedalar tranquilo</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Uma plataforma completa que conecta ciclistas a oficinas de qualidade,
            com tecnologia inteligente de monitoramento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 gradient-card rounded-3xl border border-white/10 hover:border-primary/30 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-glow">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 group-hover:text-gradient transition-all duration-300">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base font-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
